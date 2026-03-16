import os
import uuid
import asyncio
import base64
import json
import hashlib
import hmac
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query, Request, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import jwt

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
STORAGE_PATH = os.environ.get("STORAGE_PATH", "/app/storage")
MOCK_PAGES_PATH = os.environ.get("MOCK_PAGES_PATH", "/app/storage/mock_pages")
JWT_SECRET = os.environ.get("JWT_SECRET")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

# Subscription Plans (server-side only, prevents price manipulation)
PLANS = {
    "starter": {"name": "Starter", "price": 0.0, "currency": "eur", "max_properties": 1, "features": ["1 property", "Basic sync", "Community support"]},
    "pro": {"name": "Pro", "price": 29.0, "currency": "eur", "max_properties": 10, "features": ["10 properties", "Priority sync", "Email support", "Advanced analytics"]},
    "enterprise": {"name": "Enterprise", "price": 99.0, "currency": "eur", "max_properties": 999, "features": ["Unlimited properties", "Real-time sync", "Dedicated support", "Custom integrations", "API access"]},
}

# ---------- MongoDB ----------
client: AsyncIOMotorClient = None
db = None

# ---------- Agent State ----------
agent_task: Optional[asyncio.Task] = None
agent_running = False

# ---------- SSE subscribers ----------
log_subscribers: list = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await db.properties.create_index("property_id", unique=True)
    await db.properties.create_index("owner_id")
    await db.logs.create_index("timestamp")
    await db.logs.create_index("property_id")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.reservations.create_index("property_id")
    await db.reservations.create_index("reservation_id", unique=True)
    await db.payment_transactions.create_index("session_id")
    state = await db.agent_state.find_one({"_id": "global"})
    if not state:
        await db.agent_state.insert_one({
            "_id": "global",
            "running": False,
            "paused": False,
            "current_task": None,
            "polling_interval": 900,
            "last_run": None,
        })
    yield
    client.close()


app = FastAPI(title="Orbit API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
#  PYDANTIC MODELS
# ============================================================

class RegisterBody(BaseModel):
    name: str
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

class PropertyCreate(BaseModel):
    name: str
    airbnb_url: str = ""
    booking_url: str = ""

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    airbnb_url: Optional[str] = None
    booking_url: Optional[str] = None
    status: Optional[str] = None

class AgentConfig(BaseModel):
    polling_interval: Optional[int] = None

class ReservationCreate(BaseModel):
    property_id: str
    guest_name: str
    check_in: str
    check_out: str
    source: str = "Manual"
    notes: str = ""

class ReservationUpdate(BaseModel):
    guest_name: Optional[str] = None
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class UserUpdateBody(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None

class UserSettingsBody(BaseModel):
    name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class CheckoutBody(BaseModel):
    plan_id: str
    origin_url: str


# ============================================================
#  AUTH HELPERS
# ============================================================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

async def get_current_user(request: Request) -> dict:
    # Check cookie first, then Authorization header
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")

    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Invalid session")

    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(401, "Session expired")

    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

def serialize_doc(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

async def push_log(property_id, action, level, message, status="Success", screenshot_path=None):
    log = {
        "log_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "property_id": property_id,
        "action": action,
        "level": level,
        "message": message,
        "status": status,
        "screenshot_path": screenshot_path,
    }
    await db.logs.insert_one({**log, "_id": log["log_id"]})
    for q in log_subscribers:
        try:
            q.put_nowait(log)
        except asyncio.QueueFull:
            pass
    return log


# ============================================================
#  AUTH ENDPOINTS
# ============================================================

@app.post("/api/auth/register")
async def register(body: RegisterBody, response: Response):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": body.email.lower(),
        "name": body.name,
        "password_hash": hash_password(body.password),
        "picture": "",
        "role": "manager",
        "subscription": "starter",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one({**user, "_id": user_id})

    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": serialize_doc(user), "session_token": session_token}

@app.post("/api/auth/login")
async def login(body: LoginBody, response: Response):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        raise HTTPException(401, "Invalid credentials")
    if not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user["user_id"],
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    safe_user = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    return {"user": safe_user, "session_token": session_token}

@app.get("/api/auth/session")
async def exchange_session(session_id: str, response: Response):
    """Exchange Emergent OAuth session_id for local session."""
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    try:
        async with httpx.AsyncClient() as hc:
            r = await hc.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
            )
            if r.status_code != 200:
                raise HTTPException(401, "OAuth session invalid")
            data = r.json()
    except httpx.HTTPError:
        raise HTTPException(502, "Failed to verify OAuth session")

    email = data["email"].lower()
    name = data.get("name", "")
    picture = data.get("picture", "")

    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user:
        await db.users.update_one({"email": email}, {"$set": {"name": name or user.get("name"), "picture": picture}})
        user_id = user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "password_hash": "",
            "role": "manager",
            "subscription": "starter",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one({**user, "_id": user_id})

    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie("session_token", session_token, path="/", httponly=True, secure=True, samesite="none", max_age=7*24*3600)
    safe_user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"user": safe_user, "session_token": session_token}

@app.get("/api/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user

@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}


# ============================================================
#  HEALTH (public)
# ============================================================

@app.get("/api/health")
async def health():
    try:
        await client.admin.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    state = await db.agent_state.find_one({"_id": "global"}, {"_id": 0})
    prop_count = await db.properties.count_documents({})
    error_count = await db.properties.count_documents({"status": "Error"})
    online_count = await db.properties.count_documents({"status": "Online"})
    syncing_count = await db.properties.count_documents({"status": "Syncing"})
    return {
        "status": "operational" if mongo_ok else "degraded",
        "mongodb": mongo_ok,
        "agent": state or {},
        "properties": {"total": prop_count, "online": online_count, "error": error_count, "syncing": syncing_count},
    }


# ============================================================
#  PROPERTIES CRUD (auth-protected)
# ============================================================

@app.get("/api/properties")
async def list_properties(request: Request):
    user = await get_current_user(request)
    if user["role"] == "admin":
        docs = await db.properties.find({}, {"_id": 0}).to_list(100)
    else:
        docs = await db.properties.find({"owner_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return docs

@app.post("/api/properties")
async def create_property(body: PropertyCreate, request: Request):
    user = await get_current_user(request)
    # Check subscription limits
    sub = user.get("subscription", "starter")
    max_props = PLANS.get(sub, PLANS["starter"])["max_properties"]
    current_count = await db.properties.count_documents({"owner_id": user["user_id"]})
    if current_count >= max_props:
        raise HTTPException(403, f"Property limit reached for {sub} plan ({max_props}). Upgrade to add more.")

    prop = {
        "property_id": str(uuid.uuid4()),
        "name": body.name,
        "owner_id": user["user_id"],
        "airbnb_url": body.airbnb_url or f"file://{MOCK_PAGES_PATH}/mock_airbnb.html",
        "booking_url": body.booking_url or f"file://{MOCK_PAGES_PATH}/mock_booking.html",
        "status": "Online",
        "last_sync": None,
        "booked_dates": [],
    }
    await db.properties.insert_one({**prop, "_id": prop["property_id"]})
    await push_log(prop["property_id"], "PROPERTY_CREATED", "INFO", f"Property '{body.name}' registered by {user['name']}")
    return serialize_doc(prop)

@app.get("/api/properties/{property_id}")
async def get_property(property_id: str, request: Request):
    await get_current_user(request)
    doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Property not found")
    return doc

@app.put("/api/properties/{property_id}")
async def update_property(property_id: str, body: PropertyUpdate, request: Request):
    await get_current_user(request)
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    result = await db.properties.update_one({"property_id": property_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Property not found")
    doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    return doc

@app.delete("/api/properties/{property_id}")
async def delete_property(property_id: str, request: Request):
    await get_current_user(request)
    result = await db.properties.delete_one({"property_id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Property not found")
    await push_log(property_id, "PROPERTY_DELETED", "WARN", f"Property {property_id} removed")
    return {"deleted": True}


# ============================================================
#  RESERVATIONS CRUD
# ============================================================

@app.get("/api/reservations")
async def list_reservations(request: Request, property_id: Optional[str] = None):
    user = await get_current_user(request)
    query = {}
    if property_id:
        query["property_id"] = property_id
    if user["role"] != "admin":
        # Get user's property IDs
        props = await db.properties.find({"owner_id": user["user_id"]}, {"property_id": 1, "_id": 0}).to_list(100)
        prop_ids = [p["property_id"] for p in props]
        if property_id:
            if property_id not in prop_ids:
                raise HTTPException(403, "Not your property")
        else:
            query["property_id"] = {"$in": prop_ids}
    docs = await db.reservations.find(query, {"_id": 0}).sort("check_in", 1).to_list(500)
    return docs

@app.post("/api/reservations")
async def create_reservation(body: ReservationCreate, request: Request):
    user = await get_current_user(request)
    prop = await db.properties.find_one({"property_id": body.property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(404, "Property not found")

    res = {
        "reservation_id": str(uuid.uuid4()),
        "property_id": body.property_id,
        "property_name": prop["name"],
        "guest_name": body.guest_name,
        "check_in": body.check_in,
        "check_out": body.check_out,
        "source": body.source,
        "status": "Confirmed",
        "notes": body.notes,
        "created_by": user["user_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reservations.insert_one({**res, "_id": res["reservation_id"]})
    return serialize_doc(res)

@app.put("/api/reservations/{reservation_id}")
async def update_reservation(reservation_id: str, body: ReservationUpdate, request: Request):
    await get_current_user(request)
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    result = await db.reservations.update_one({"reservation_id": reservation_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Reservation not found")
    doc = await db.reservations.find_one({"reservation_id": reservation_id}, {"_id": 0})
    return doc

@app.delete("/api/reservations/{reservation_id}")
async def delete_reservation(reservation_id: str, request: Request):
    await get_current_user(request)
    result = await db.reservations.delete_one({"reservation_id": reservation_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Reservation not found")
    return {"deleted": True}


# ============================================================
#  USER MANAGEMENT (admin only)
# ============================================================

@app.get("/api/users")
async def list_users(request: Request):
    user = await get_current_user(request)
    if user["role"] != "admin":
        raise HTTPException(403, "Admin only")
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return docs

@app.put("/api/users/{user_id}")
async def update_user(user_id: str, body: UserUpdateBody, request: Request):
    admin = await get_current_user(request)
    if admin["role"] != "admin":
        raise HTTPException(403, "Admin only")
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields")
    result = await db.users.update_one({"user_id": user_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "User not found")
    doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return doc

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    admin = await get_current_user(request)
    if admin["role"] != "admin":
        raise HTTPException(403, "Admin only")
    if admin["user_id"] == user_id:
        raise HTTPException(400, "Cannot delete yourself")
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    return {"deleted": True}


# ============================================================
#  USER SETTINGS (self)
# ============================================================

@app.put("/api/auth/settings")
async def update_settings(body: UserSettingsBody, request: Request):
    user = await get_current_user(request)
    updates = {}
    if body.name:
        updates["name"] = body.name
    if body.new_password:
        if body.current_password:
            full_user = await db.users.find_one({"user_id": user["user_id"]})
            if full_user.get("password_hash") and not verify_password(body.current_password, full_user["password_hash"]):
                raise HTTPException(400, "Current password is incorrect")
        updates["password_hash"] = hash_password(body.new_password)
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return doc


# ============================================================
#  SUBSCRIPTION & STRIPE
# ============================================================

@app.get("/api/plans")
async def get_plans():
    return PLANS

@app.post("/api/checkout")
async def create_checkout(body: CheckoutBody, request: Request):
    user = await get_current_user(request)
    plan = PLANS.get(body.plan_id)
    if not plan:
        raise HTTPException(400, "Invalid plan")
    if plan["price"] == 0:
        raise HTTPException(400, "Starter plan is free")

    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    success_url = f"{body.origin_url}/subscription?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{body.origin_url}/subscription"

    checkout_req = CheckoutSessionRequest(
        amount=plan["price"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["user_id"],
            "plan_id": body.plan_id,
            "user_email": user["email"],
        },
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)

    # Create payment transaction record BEFORE redirect
    await db.payment_transactions.insert_one({
        "_id": session.session_id,
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "plan_id": body.plan_id,
        "amount": plan["price"],
        "currency": plan["currency"],
        "payment_status": "pending",
        "metadata": {"plan_id": body.plan_id, "user_email": user["email"]},
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"url": session.url, "session_id": session.session_id}

@app.get("/api/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    user = await get_current_user(request)

    from emergentintegrations.payments.stripe.checkout import StripeCheckout

    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    status = await stripe_checkout.get_checkout_status(session_id)

    # Update transaction
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if tx and tx.get("payment_status") != "paid":
        new_status = status.payment_status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": new_status, "status": status.status}}
        )
        # Upgrade user subscription if paid
        if new_status == "paid":
            plan_id = tx.get("plan_id") or (tx.get("metadata", {}).get("plan_id"))
            if plan_id:
                await db.users.update_one(
                    {"user_id": tx["user_id"]},
                    {"$set": {"subscription": plan_id, "subscription_updated": datetime.now(timezone.utc).isoformat()}}
                )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
    }

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        webhook_response = await stripe_checkout.handle_webhook(body, sig)

        if webhook_response.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            if tx and tx.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                plan_id = tx.get("plan_id") or webhook_response.metadata.get("plan_id")
                if plan_id:
                    await db.users.update_one(
                        {"user_id": tx["user_id"]},
                        {"$set": {"subscription": plan_id}}
                    )
    except Exception:
        pass
    return {"received": True}


# ============================================================
#  LOGS
# ============================================================

@app.get("/api/logs")
async def list_logs(request: Request, property_id: Optional[str] = None, limit: int = Query(100, le=500)):
    await get_current_user(request)
    query = {}
    if property_id:
        query["property_id"] = property_id
    docs = await db.logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return docs

@app.get("/api/logs/stream")
async def stream_logs():
    q = asyncio.Queue(maxsize=100)
    log_subscribers.append(q)

    async def event_generator():
        try:
            while True:
                try:
                    log = await asyncio.wait_for(q.get(), timeout=30)
                    yield f"data: {json.dumps(log)}\n\n"
                except asyncio.TimeoutError:
                    yield f": keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if q in log_subscribers:
                log_subscribers.remove(q)

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no",
    })


# ============================================================
#  SCREENSHOTS
# ============================================================

@app.get("/api/screenshots")
async def list_screenshots(request: Request):
    await get_current_user(request)
    screenshot_dir = os.path.join(STORAGE_PATH, "screenshots")
    if not os.path.isdir(screenshot_dir):
        return []
    files = []
    for f in sorted(os.listdir(screenshot_dir), reverse=True):
        if f.endswith((".png", ".jpg", ".jpeg")):
            files.append({
                "filename": f,
                "url": f"/api/screenshots/{f}",
                "created": datetime.fromtimestamp(os.path.getmtime(os.path.join(screenshot_dir, f)), tz=timezone.utc).isoformat(),
            })
    return files

@app.get("/api/screenshots/{filename}")
async def get_screenshot(filename: str):
    filepath = os.path.join(STORAGE_PATH, "screenshots", filename)
    if not os.path.isfile(filepath):
        raise HTTPException(404, "Screenshot not found")
    return FileResponse(filepath, media_type="image/png")


# ============================================================
#  AGENT CONTROL
# ============================================================

@app.get("/api/agent/status")
async def agent_status_endpoint(request: Request):
    await get_current_user(request)
    state = await db.agent_state.find_one({"_id": "global"}, {"_id": 0})
    return state or {"running": False, "paused": False}

@app.post("/api/agent/start")
async def start_agent(request: Request):
    await get_current_user(request)
    global agent_task, agent_running
    if agent_running:
        return {"message": "Agent already running"}
    agent_running = True
    await db.agent_state.update_one({"_id": "global"}, {"$set": {"running": True, "paused": False}})
    agent_task = asyncio.create_task(agent_loop())
    await push_log(None, "AGENT_START", "INFO", "Orbit Agent initialized.")
    return {"message": "Agent started"}

@app.post("/api/agent/stop")
async def stop_agent(request: Request):
    await get_current_user(request)
    global agent_task, agent_running
    if not agent_running:
        return {"message": "Agent not running"}
    agent_running = False
    if agent_task:
        agent_task.cancel()
        agent_task = None
    await db.agent_state.update_one({"_id": "global"}, {"$set": {"running": False, "paused": False, "current_task": None}})
    await push_log(None, "AGENT_STOP", "WARN", "Orbit Agent deactivated.")
    return {"message": "Agent stopped"}

@app.post("/api/agent/config")
async def configure_agent(body: AgentConfig, request: Request):
    await get_current_user(request)
    updates = {}
    if body.polling_interval is not None:
        updates["polling_interval"] = body.polling_interval
    if updates:
        await db.agent_state.update_one({"_id": "global"}, {"$set": updates})
    state = await db.agent_state.find_one({"_id": "global"}, {"_id": 0})
    return state

@app.post("/api/properties/{property_id}/sync")
async def trigger_sync(property_id: str, request: Request):
    await get_current_user(request)
    doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Property not found")
    asyncio.create_task(run_sync_for_property(property_id))
    return {"message": "Sync triggered", "property_id": property_id}


# ============================================================
#  AGENT CORE LOGIC (unchanged)
# ============================================================

async def run_sync_for_property(property_id: str):
    from playwright.async_api import async_playwright
    doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not doc:
        return
    prop_name = doc.get("name", "Unknown")
    booking_url = doc.get("booking_url", "")
    airbnb_url = doc.get("airbnb_url", "")
    await db.properties.update_one({"property_id": property_id}, {"$set": {"status": "Syncing"}})
    await push_log(property_id, "SYNC_START", "INFO", f"[{prop_name}] Initiating calendar sync cycle")
    screenshot_dir = os.path.join(STORAGE_PATH, "screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
            context = await browser.new_context(viewport={"width": 1280, "height": 800})
            page = await context.new_page()
            await push_log(property_id, "OBSERVE", "INFO", f"[{prop_name}] Navigating to source: {booking_url}")
            await page.goto(booking_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(1)
            ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            obs_screenshot = f"observe_{property_id[:8]}_{ts}.png"
            obs_path = os.path.join(screenshot_dir, obs_screenshot)
            await page.screenshot(path=obs_path, full_page=True)
            await push_log(property_id, "SCREENSHOT", "INFO", f"[{prop_name}] Source captured", screenshot_path=f"/api/screenshots/{obs_screenshot}")
            booked_dates = await analyze_calendar_with_vision(obs_path, "booking")
            await push_log(property_id, "VISION_ANALYSIS", "INFO", f"[{prop_name}] Gemini detected {len(booked_dates)} booked dates: {booked_dates}")
            existing_dates = doc.get("booked_dates", [])
            new_dates = [d for d in booked_dates if d not in existing_dates]
            if not new_dates:
                await push_log(property_id, "COMPARE", "INFO", f"[{prop_name}] Calendars in sync.")
                await db.properties.update_one({"property_id": property_id}, {"$set": {"status": "Online", "last_sync": datetime.now(timezone.utc).isoformat()}})
                await browser.close()
                return
            await push_log(property_id, "COMPARE", "WARN", f"[{prop_name}] {len(new_dates)} new bookings. Syncing to target.")
            await push_log(property_id, "ACTION", "INFO", f"[{prop_name}] Navigating to target: {airbnb_url}")
            await page.goto(airbnb_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(1)
            for date in new_dates:
                try:
                    date_cell = page.locator(f'[data-date="{date}"]')
                    if await date_cell.count() > 0:
                        await date_cell.click()
                        await asyncio.sleep(0.3)
                        await push_log(property_id, "BLOCK_DATE", "INFO", f"[{prop_name}] Blocked {date}")
                except Exception as e:
                    await push_log(property_id, "BLOCK_DATE", "ERROR", f"[{prop_name}] Failed {date}: {str(e)}")
            await asyncio.sleep(1)
            val_screenshot = f"validate_{property_id[:8]}_{ts}.png"
            val_path = os.path.join(screenshot_dir, val_screenshot)
            await page.screenshot(path=val_path, full_page=True)
            await push_log(property_id, "SCREENSHOT", "INFO", f"[{prop_name}] Validation captured", screenshot_path=f"/api/screenshots/{val_screenshot}")
            validation_result = await analyze_calendar_with_vision(val_path, "airbnb")
            await push_log(property_id, "VALIDATE", "INFO", f"[{prop_name}] Validation: {validation_result}")
            all_dates = list(set(existing_dates + new_dates))
            await db.properties.update_one({"property_id": property_id}, {"$set": {"status": "Online", "last_sync": datetime.now(timezone.utc).isoformat(), "booked_dates": all_dates}})
            await push_log(property_id, "SYNC_COMPLETE", "INFO", f"[{prop_name}] Sync complete. {len(new_dates)} dates synced.")
            # Auto-create reservations from synced dates
            for date in new_dates:
                existing_res = await db.reservations.find_one({"property_id": property_id, "check_in": date})
                if not existing_res:
                    res = {
                        "reservation_id": str(uuid.uuid4()),
                        "property_id": property_id,
                        "property_name": prop_name,
                        "guest_name": "Auto-synced",
                        "check_in": date,
                        "check_out": date,
                        "source": "Booking.com (Agent)",
                        "status": "Confirmed",
                        "notes": "Auto-detected by Orbit agent",
                        "created_by": "agent",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                    }
                    await db.reservations.insert_one({**res, "_id": res["reservation_id"]})
            await browser.close()
    except Exception as e:
        error_msg = str(e)
        if "captcha" in error_msg.lower() or "2fa" in error_msg.lower():
            await db.properties.update_one({"property_id": property_id}, {"$set": {"status": "Action Required"}})
            await push_log(property_id, "ACTION_REQUIRED", "ERROR", f"[{prop_name}] Human needed: {error_msg}")
        else:
            await db.properties.update_one({"property_id": property_id}, {"$set": {"status": "Error"}})
            await push_log(property_id, "SYNC_ERROR", "ERROR", f"[{prop_name}] Failed: {error_msg}")


async def analyze_calendar_with_vision(screenshot_path: str, calendar_type: str) -> list:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        with open(screenshot_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"orbit-vision-{uuid.uuid4().hex[:8]}",
            system_message="You are a calendar analysis agent. Return ONLY a JSON array of date strings in YYYY-MM-DD format."
        ).with_model("gemini", "gemini-2.5-flash")
        image_content = ImageContent(image_base64=image_data)
        prompt = f"Analyze this {calendar_type} calendar screenshot. Identify ALL booked/unavailable dates. Return ONLY a JSON array in YYYY-MM-DD format. Empty array [] if none."
        msg = UserMessage(text=prompt, file_contents=[image_content])
        response = await chat.send_message(msg)
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        dates = json.loads(clean)
        return dates if isinstance(dates, list) else []
    except Exception as e:
        await push_log(None, "VISION_ERROR", "ERROR", f"Vision failed: {str(e)}")
        return []


async def agent_loop():
    global agent_running
    while agent_running:
        try:
            state = await db.agent_state.find_one({"_id": "global"})
            interval = state.get("polling_interval", 900) if state else 900
            properties = await db.properties.find({}, {"_id": 0}).to_list(100)
            if properties:
                await push_log(None, "AGENT_CYCLE", "INFO", f"Syncing {len(properties)} properties")
                for prop in properties:
                    if not agent_running:
                        break
                    await db.agent_state.update_one({"_id": "global"}, {"$set": {"current_task": prop["property_id"]}})
                    await run_sync_for_property(prop["property_id"])
                    await asyncio.sleep(2)
            await db.agent_state.update_one({"_id": "global"}, {"$set": {"current_task": None, "last_run": datetime.now(timezone.utc).isoformat()}})
            await push_log(None, "AGENT_CYCLE", "INFO", f"Cycle complete. Next in {interval}s")
            await asyncio.sleep(interval)
        except asyncio.CancelledError:
            break
        except Exception as e:
            await push_log(None, "AGENT_ERROR", "ERROR", f"Loop error: {str(e)}")
            await asyncio.sleep(30)
    agent_running = False
    await db.agent_state.update_one({"_id": "global"}, {"$set": {"running": False}})
