import os
import uuid
import asyncio
import base64
import json
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import aiofiles

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
STORAGE_PATH = os.environ.get("STORAGE_PATH", "/app/storage")
MOCK_PAGES_PATH = os.environ.get("MOCK_PAGES_PATH", "/app/storage/mock_pages")

# ---------- MongoDB ----------
client: AsyncIOMotorClient = None
db = None

# ---------- Agent State ----------
agent_task: Optional[asyncio.Task] = None
agent_running = False
agent_paused = False

# ---------- SSE subscribers ----------
log_subscribers: list = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await db.properties.create_index("property_id", unique=True)
    await db.logs.create_index("timestamp")
    await db.logs.create_index("property_id")
    # Seed agent_state if not exists
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

class PropertyCreate(BaseModel):
    name: str
    airbnb_url: str = ""
    booking_url: str = ""

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    airbnb_url: Optional[str] = None
    booking_url: Optional[str] = None
    status: Optional[str] = None

class PropertyOut(BaseModel):
    property_id: str
    name: str
    airbnb_url: str
    booking_url: str
    status: str
    last_sync: Optional[str] = None
    booked_dates: list = []

class LogOut(BaseModel):
    log_id: str
    timestamp: str
    property_id: Optional[str]
    action: str
    level: str
    message: str
    status: str
    screenshot_path: Optional[str] = None

class AgentConfig(BaseModel):
    polling_interval: Optional[int] = None


# ============================================================
#  HELPERS
# ============================================================

def serialize_doc(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc

async def push_log(property_id: Optional[str], action: str, level: str, message: str, status: str = "Success", screenshot_path: Optional[str] = None):
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
    # Notify SSE subscribers
    for q in log_subscribers:
        try:
            q.put_nowait(log)
        except asyncio.QueueFull:
            pass
    return log


# ============================================================
#  HEALTH
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
        "properties": {
            "total": prop_count,
            "online": online_count,
            "error": error_count,
            "syncing": syncing_count,
        },
    }


# ============================================================
#  PROPERTIES CRUD
# ============================================================

@app.get("/api/properties")
async def list_properties():
    docs = await db.properties.find({}, {"_id": 0}).to_list(100)
    return docs

@app.post("/api/properties")
async def create_property(body: PropertyCreate):
    prop = {
        "property_id": str(uuid.uuid4()),
        "name": body.name,
        "airbnb_url": body.airbnb_url or f"file://{MOCK_PAGES_PATH}/mock_airbnb.html",
        "booking_url": body.booking_url or f"file://{MOCK_PAGES_PATH}/mock_booking.html",
        "status": "Online",
        "last_sync": None,
        "booked_dates": [],
    }
    await db.properties.insert_one({**prop, "_id": prop["property_id"]})
    await push_log(prop["property_id"], "PROPERTY_CREATED", "INFO", f"Property '{body.name}' registered in Orbit")
    return serialize_doc(prop)

@app.get("/api/properties/{property_id}")
async def get_property(property_id: str):
    doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Property not found")
    return doc

@app.put("/api/properties/{property_id}")
async def update_property(property_id: str, body: PropertyUpdate):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    result = await db.properties.update_one({"property_id": property_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(404, "Property not found")
    doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    return doc

@app.delete("/api/properties/{property_id}")
async def delete_property(property_id: str):
    result = await db.properties.delete_one({"property_id": property_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Property not found")
    await push_log(property_id, "PROPERTY_DELETED", "WARN", f"Property {property_id} removed from Orbit")
    return {"deleted": True}


# ============================================================
#  LOGS
# ============================================================

@app.get("/api/logs")
async def list_logs(property_id: Optional[str] = None, limit: int = Query(100, le=500)):
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
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })


# ============================================================
#  SCREENSHOTS
# ============================================================

@app.get("/api/screenshots")
async def list_screenshots():
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
async def agent_status():
    state = await db.agent_state.find_one({"_id": "global"}, {"_id": 0})
    return state or {"running": False, "paused": False}

@app.post("/api/agent/start")
async def start_agent():
    global agent_task, agent_running
    if agent_running:
        return {"message": "Agent already running"}
    agent_running = True
    await db.agent_state.update_one({"_id": "global"}, {"$set": {"running": True, "paused": False}})
    agent_task = asyncio.create_task(agent_loop())
    await push_log(None, "AGENT_START", "INFO", "Orbit Agent initialized. Beginning orbital sync cycle.")
    return {"message": "Agent started"}

@app.post("/api/agent/stop")
async def stop_agent():
    global agent_task, agent_running
    if not agent_running:
        return {"message": "Agent not running"}
    agent_running = False
    if agent_task:
        agent_task.cancel()
        agent_task = None
    await db.agent_state.update_one({"_id": "global"}, {"$set": {"running": False, "paused": False, "current_task": None}})
    await push_log(None, "AGENT_STOP", "WARN", "Orbit Agent deactivated. Sync cycles halted.")
    return {"message": "Agent stopped"}

@app.post("/api/agent/config")
async def configure_agent(body: AgentConfig):
    updates = {}
    if body.polling_interval is not None:
        updates["polling_interval"] = body.polling_interval
    if updates:
        await db.agent_state.update_one({"_id": "global"}, {"$set": updates})
    state = await db.agent_state.find_one({"_id": "global"}, {"_id": 0})
    return state


# ============================================================
#  SYNC TRIGGER (manual per property)
# ============================================================

@app.post("/api/properties/{property_id}/sync")
async def trigger_sync(property_id: str):
    doc = await db.properties.find_one({"property_id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Property not found")
    asyncio.create_task(run_sync_for_property(property_id))
    return {"message": "Sync triggered", "property_id": property_id}


# ============================================================
#  AGENT CORE LOGIC
# ============================================================

async def run_sync_for_property(property_id: str):
    """Execute the full observe -> compare -> act -> validate cycle for one property."""
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

            # ---- STEP 1: OBSERVATION ----
            await push_log(property_id, "OBSERVE", "INFO", f"[{prop_name}] Navigating to source calendar: {booking_url}")
            await page.goto(booking_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(1)

            # Take screenshot of source
            ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
            obs_screenshot = f"observe_{property_id[:8]}_{ts}.png"
            obs_path = os.path.join(screenshot_dir, obs_screenshot)
            await page.screenshot(path=obs_path, full_page=True)
            await push_log(property_id, "SCREENSHOT", "INFO", f"[{prop_name}] Source calendar captured", screenshot_path=f"/api/screenshots/{obs_screenshot}")

            # Use Gemini Vision to analyze the calendar
            booked_dates = await analyze_calendar_with_vision(obs_path, "booking")
            await push_log(property_id, "VISION_ANALYSIS", "INFO", f"[{prop_name}] Gemini detected {len(booked_dates)} booked dates: {booked_dates}")

            # ---- STEP 2: COMPARISON ----
            existing_dates = doc.get("booked_dates", [])
            new_dates = [d for d in booked_dates if d not in existing_dates]

            if not new_dates:
                await push_log(property_id, "COMPARE", "INFO", f"[{prop_name}] No new bookings detected. Calendars in sync.")
                await db.properties.update_one({"property_id": property_id}, {
                    "$set": {"status": "Online", "last_sync": datetime.now(timezone.utc).isoformat()}
                })
                await browser.close()
                return

            await push_log(property_id, "COMPARE", "WARN", f"[{prop_name}] {len(new_dates)} new bookings found: {new_dates}. Initiating sync to target.")

            # ---- STEP 3: ACTION ----
            await push_log(property_id, "ACTION", "INFO", f"[{prop_name}] Navigating to target calendar: {airbnb_url}")
            await page.goto(airbnb_url, wait_until="networkidle", timeout=30000)
            await asyncio.sleep(1)

            # Click on new dates to block them
            for date in new_dates:
                try:
                    date_cell = page.locator(f'[data-date="{date}"]')
                    if await date_cell.count() > 0:
                        await date_cell.click()
                        await asyncio.sleep(0.3)
                        await push_log(property_id, "BLOCK_DATE", "INFO", f"[{prop_name}] Blocked date {date} on target")
                    else:
                        await push_log(property_id, "BLOCK_DATE", "WARN", f"[{prop_name}] Date cell {date} not found on target")
                except Exception as e:
                    await push_log(property_id, "BLOCK_DATE", "ERROR", f"[{prop_name}] Failed to block {date}: {str(e)}")

            # ---- STEP 4: VALIDATION ----
            await asyncio.sleep(1)
            val_screenshot = f"validate_{property_id[:8]}_{ts}.png"
            val_path = os.path.join(screenshot_dir, val_screenshot)
            await page.screenshot(path=val_path, full_page=True)
            await push_log(property_id, "SCREENSHOT", "INFO", f"[{prop_name}] Validation screenshot captured", screenshot_path=f"/api/screenshots/{val_screenshot}")

            # Verify with vision
            validation_result = await analyze_calendar_with_vision(val_path, "airbnb")
            await push_log(property_id, "VALIDATE", "INFO", f"[{prop_name}] Validation complete. Target shows: {validation_result}")

            # Update property state
            all_dates = list(set(existing_dates + new_dates))
            await db.properties.update_one({"property_id": property_id}, {
                "$set": {
                    "status": "Online",
                    "last_sync": datetime.now(timezone.utc).isoformat(),
                    "booked_dates": all_dates,
                }
            })
            await push_log(property_id, "SYNC_COMPLETE", "INFO", f"[{prop_name}] Sync cycle complete. {len(new_dates)} dates synchronized.")
            await browser.close()

    except Exception as e:
        error_msg = str(e)
        if "captcha" in error_msg.lower() or "2fa" in error_msg.lower() or "verify" in error_msg.lower():
            await db.properties.update_one({"property_id": property_id}, {"$set": {"status": "Action Required"}})
            await push_log(property_id, "ACTION_REQUIRED", "ERROR", f"[{prop_name}] Human intervention needed: {error_msg}")
        else:
            await db.properties.update_one({"property_id": property_id}, {"$set": {"status": "Error"}})
            await push_log(property_id, "SYNC_ERROR", "ERROR", f"[{prop_name}] Sync failed: {error_msg}")


async def analyze_calendar_with_vision(screenshot_path: str, calendar_type: str) -> list:
    """Use Gemini Vision to analyze a calendar screenshot and extract booked dates."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

        with open(screenshot_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"orbit-vision-{uuid.uuid4().hex[:8]}",
            system_message="You are a calendar analysis agent. Analyze calendar screenshots and extract date information. Return ONLY a JSON array of date strings in YYYY-MM-DD format. No other text."
        ).with_model("gemini", "gemini-2.5-flash")

        image_content = ImageContent(image_base64=image_data)

        prompt = f"Analyze this {calendar_type} calendar screenshot. Identify ALL dates that are marked as booked/unavailable/occupied (shown with colored backgrounds, strikethrough, or 'booked' labels). Return ONLY a JSON array of dates in YYYY-MM-DD format. If no booked dates are visible, return an empty array []."

        msg = UserMessage(text=prompt, file_contents=[image_content])
        response = await chat.send_message(msg)

        # Parse the response
        try:
            # Try to extract JSON from response
            clean = response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            dates = json.loads(clean)
            if isinstance(dates, list):
                return dates
        except (json.JSONDecodeError, IndexError):
            pass
        return []
    except Exception as e:
        await push_log(None, "VISION_ERROR", "ERROR", f"Gemini vision analysis failed: {str(e)}")
        return []


async def agent_loop():
    """Main agent loop that periodically syncs all properties."""
    global agent_running
    while agent_running:
        try:
            state = await db.agent_state.find_one({"_id": "global"})
            interval = state.get("polling_interval", 900) if state else 900

            properties = await db.properties.find({}, {"_id": 0}).to_list(100)
            if properties:
                await push_log(None, "AGENT_CYCLE", "INFO", f"Agent cycle: syncing {len(properties)} properties")
                for prop in properties:
                    if not agent_running:
                        break
                    await db.agent_state.update_one({"_id": "global"}, {"$set": {"current_task": prop["property_id"]}})
                    await run_sync_for_property(prop["property_id"])
                    await asyncio.sleep(2)

            await db.agent_state.update_one({"_id": "global"}, {
                "$set": {"current_task": None, "last_run": datetime.now(timezone.utc).isoformat()}
            })
            await push_log(None, "AGENT_CYCLE", "INFO", f"Agent cycle complete. Next run in {interval}s")
            await asyncio.sleep(interval)
        except asyncio.CancelledError:
            break
        except Exception as e:
            await push_log(None, "AGENT_ERROR", "ERROR", f"Agent loop error: {str(e)}")
            await asyncio.sleep(30)

    agent_running = False
    await db.agent_state.update_one({"_id": "global"}, {"$set": {"running": False}})
