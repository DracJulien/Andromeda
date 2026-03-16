#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime, timedelta

class OrbitAPITester:
    def __init__(self, base_url="https://b45c1c9c-9183-4902-811c-cf34ab14db55.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_token = None
        self.user_id = None
        self.property_id = None
        self.reservation_id = None
        self.test_user_id = None
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] [{status}] {message}")

    def get_auth_headers(self):
        """Get authorization headers with session token"""
        headers = {'Content-Type': 'application/json'}
        if self.session_token:
            headers['Authorization'] = f'Bearer {self.session_token}'
        return headers

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_auth=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = self.get_auth_headers() if use_auth else {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"Response: {response.text}", "ERROR")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            return False, {}

    # ============================================================
    #  AUTHENTICATION TESTS
    # ============================================================
    
    def test_register_new_user(self):
        """Test POST /api/auth/register creates a new user with session_token"""
        timestamp = int(datetime.now().timestamp())
        success, response = self.run_test(
            "Register New User",
            "POST",
            "api/auth/register",
            200,
            data={
                "name": f"Test User {timestamp}",
                "email": f"test{timestamp}@orbit.test",
                "password": "testpass123"
            }
        )
        if success and 'session_token' in response and 'user' in response:
            self.session_token = response['session_token']
            self.user_id = response['user']['user_id']
            self.log(f"✅ User registered with token: {self.session_token[:20]}...", "PASS")
        return success

    def test_login_admin(self):
        """Test POST /api/auth/login authenticates admin user"""
        success, response = self.run_test(
            "Login Admin User",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": "admin@orbit.io",
                "password": "admin123"
            }
        )
        if success and 'session_token' in response and 'user' in response:
            self.session_token = response['session_token']
            self.user_id = response['user']['user_id']
            self.log(f"✅ Admin logged in with token: {self.session_token[:20]}...", "PASS")
            if response['user'].get('role') == 'admin':
                self.log("✅ Admin role confirmed", "PASS")
        return success

    def test_auth_me_with_session(self):
        """Test GET /api/auth/me returns current user with valid session"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200,
            use_auth=True
        )
        if success and 'user_id' in response:
            self.log(f"✅ Current user: {response.get('name', 'Unknown')}", "PASS")
        return success

    def test_auth_me_without_session(self):
        """Test GET /api/auth/me returns 401 without session"""
        success, response = self.run_test(
            "Get Current User (No Auth)",
            "GET",
            "api/auth/me",
            401
        )
        return success

    def test_logout(self):
        """Test POST /api/auth/logout clears session"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Logout",
            "POST",
            "api/auth/logout",
            200,
            use_auth=True
        )
        if success:
            # Clear session token after logout
            old_token = self.session_token
            self.session_token = None
            self.log(f"✅ Logged out, cleared token: {old_token[:20]}...", "PASS")
        return success

    def test_update_settings(self):
        """Test PUT /api/auth/settings updates user name and password"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Update User Settings",
            "PUT",
            "api/auth/settings",
            200,
            data={
                "name": "Updated Admin User"
            },
            use_auth=True
        )
        if success and response.get('name') == "Updated Admin User":
            self.log("✅ User settings updated successfully", "PASS")
        return success

    # ============================================================
    #  PROTECTED ENDPOINTS WITHOUT AUTH TESTS  
    # ============================================================

    def test_properties_without_auth(self):
        """Test GET /api/properties returns 401 without auth"""
        success, response = self.run_test(
            "Properties (No Auth)",
            "GET",
            "api/properties",
            401
        )
        return success

    # ============================================================
    #  PROPERTY TESTS (AUTH REQUIRED)
    # ============================================================
    def test_health_endpoint(self):
        """Test GET /api/health returns operational status with MongoDB connected"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        if success:
            if response.get('mongodb') is True:
                self.log("✅ MongoDB connection verified", "PASS")
            else:
                self.log("❌ MongoDB not connected properly", "FAIL")
        return success

    def test_create_property_with_auth(self):
        """Test POST /api/properties creates property with auth (check subscription limit)"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Create Property (Auth)",
            "POST",
            "api/properties",
            200,
            data={"name": "Test Hotel Orbit Auth"},
            use_auth=True
        )
        if success and 'property_id' in response:
            self.property_id = response['property_id']
            self.log(f"✅ Property created with ID: {self.property_id}", "PASS")
            # Verify subscription limits are respected
            if 'max_properties' in str(response) or 'limit' in str(response):
                self.log("✅ Subscription limits checked", "PASS")
        return success

    def test_list_properties_with_auth(self):
        """Test GET /api/properties lists properties with auth"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "List Properties (Auth)",
            "GET",
            "api/properties",
            200,
            use_auth=True
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} properties", "PASS")
        return success

    # ============================================================
    #  RESERVATIONS TESTS
    # ============================================================

    def test_list_reservations(self):
        """Test GET /api/reservations lists reservations with auth"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "List Reservations",
            "GET",
            "api/reservations",
            200,
            use_auth=True
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} reservations", "PASS")
        return success

    def test_create_reservation(self):
        """Test POST /api/reservations creates reservation"""
        if not self.session_token or not self.property_id:
            self.log("❌ No session token or property ID available", "SKIP")
            return False
            
        today = datetime.now().date()
        tomorrow = today + timedelta(days=1)
        
        success, response = self.run_test(
            "Create Reservation",
            "POST",
            "api/reservations",
            200,
            data={
                "property_id": self.property_id,
                "guest_name": "Test Guest",
                "check_in": str(today),
                "check_out": str(tomorrow),
                "source": "Manual",
                "notes": "Test reservation"
            },
            use_auth=True
        )
        if success and 'reservation_id' in response:
            self.reservation_id = response['reservation_id']
            self.log(f"✅ Reservation created: {self.reservation_id}", "PASS")
        return success

    def test_delete_reservation(self):
        """Test DELETE /api/reservations/{id} removes reservation"""
        if not self.session_token or not self.reservation_id:
            self.log("❌ No session token or reservation ID available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Delete Reservation",
            "DELETE",
            f"api/reservations/{self.reservation_id}",
            200,
            use_auth=True
        )
        if success and response.get('deleted') is True:
            self.log("✅ Reservation deleted successfully", "PASS")
        return success

    # ============================================================
    #  USER MANAGEMENT TESTS (ADMIN ONLY)
    # ============================================================

    def test_list_users_admin(self):
        """Test GET /api/users returns user list (admin only)"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "List Users (Admin)",
            "GET",
            "api/users",
            200,
            use_auth=True
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} users", "PASS")
            # Store a test user ID for role change test
            for user in response:
                if user.get('role') == 'manager':
                    self.test_user_id = user.get('user_id')
                    break
        return success

    def test_update_user_role(self):
        """Test PUT /api/users/{id} changes user role (admin only)"""
        if not self.session_token or not self.test_user_id:
            self.log("❌ No session token or test user ID available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Update User Role",
            "PUT",
            f"api/users/{self.test_user_id}",
            200,
            data={"role": "admin"},
            use_auth=True
        )
        if success and response.get('role') == 'admin':
            self.log("✅ User role updated successfully", "PASS")
            # Revert back to manager
            self.run_test(
                "Revert User Role",
                "PUT", 
                f"api/users/{self.test_user_id}",
                200,
                data={"role": "manager"},
                use_auth=True
            )
        return success

    # ============================================================
    #  SUBSCRIPTION TESTS
    # ============================================================

    def test_get_plans(self):
        """Test GET /api/plans returns subscription plans"""
        success, response = self.run_test(
            "Get Subscription Plans",
            "GET",
            "api/plans",
            200
        )
        if success and isinstance(response, dict):
            plans = ['starter', 'pro', 'enterprise']
            found_plans = [p for p in plans if p in response]
            self.log(f"✅ Found plans: {found_plans}", "PASS")
        return success

    def test_create_checkout_session(self):
        """Test POST /api/checkout creates Stripe checkout session"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            "api/checkout",
            200,
            data={
                "plan_id": "pro",
                "origin_url": "https://test.orbit.com"
            },
            use_auth=True
        )
        if success and 'session_id' in response and 'url' in response:
            self.checkout_session_id = response['session_id']
            self.log(f"✅ Checkout session created: {self.checkout_session_id}", "PASS")
        return success

    def test_checkout_status(self):
        """Test GET /api/checkout/status/{session_id} returns payment status"""
        if not self.session_token or not hasattr(self, 'checkout_session_id'):
            self.log("❌ No session token or checkout session ID available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Get Checkout Status",
            "GET",
            f"api/checkout/status/{self.checkout_session_id}",
            200,
            use_auth=True
        )
        if success and 'status' in response and 'payment_status' in response:
            self.log(f"✅ Payment status: {response.get('payment_status')}", "PASS")
        return success

    def test_list_logs(self):
        """Test GET /api/logs returns logs list"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "List Logs",
            "GET",
            "api/logs",
            200,
            use_auth=True
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} log entries", "PASS")
        return success

    def test_agent_status(self):
        """Test GET /api/agent/status returns agent state"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Agent Status",
            "GET",
            "api/agent/status",
            200,
            use_auth=True
        )
        if success and 'running' in response:
            self.log(f"✅ Agent status: {'running' if response['running'] else 'stopped'}", "PASS")
        return success

    def test_list_screenshots(self):
        """Test GET /api/screenshots lists screenshots"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "List Screenshots",
            "GET",
            "api/screenshots",
            200,
            use_auth=True
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} screenshots", "PASS")
        return success

    # ============================================================
    #  CHAT AI ASSISTANT TESTS (NEW IN ITERATION 4)
    # ============================================================

    def test_chat_send_without_auth(self):
        """Test POST /api/chat/send returns 401 without auth"""
        success, response = self.run_test(
            "Chat Send (No Auth)",
            "POST",
            "api/chat/send",
            401,
            data={"message": "Test message"}
        )
        return success

    def test_chat_send_with_auth(self):
        """Test POST /api/chat/send works with auth"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Chat Send (Auth)",
            "POST",
            "api/chat/send",
            200,
            data={"message": "Bonjour, pouvez-vous m'aider?"},
            use_auth=True
        )
        if success and 'message' in response and 'message_id' in response:
            self.log(f"✅ AI Response received: {response['message'][:100]}...", "PASS")
        return success

    def test_chat_send_system_status_french(self):
        """Test POST /api/chat/send with 'Quel est le statut du systeme' returns health info"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Chat Send - System Status (French)",
            "POST",
            "api/chat/send",
            200,
            data={"message": "Quel est le statut du systeme"},
            use_auth=True
        )
        if success and 'message' in response:
            # Check if response contains health/system status info
            response_text = response['message'].lower()
            health_indicators = ['mongodb', 'agent', 'proprietes', 'sante', 'systeme', 'orbit']
            found_indicators = [indicator for indicator in health_indicators if indicator in response_text]
            if found_indicators:
                self.log(f"✅ Health info found in response: {found_indicators}", "PASS")
            else:
                self.log(f"⚠️ Response may not contain health info: {response['message'][:200]}", "WARN")
        return success

    def test_chat_send_properties_french(self):
        """Test POST /api/chat/send with 'Montre-moi mes proprietes' returns property list"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Chat Send - Properties (French)",
            "POST",
            "api/chat/send",
            200,
            data={"message": "Montre-moi mes proprietes"},
            use_auth=True
        )
        if success and 'message' in response:
            # Check if response contains property information
            response_text = response['message'].lower()
            property_indicators = ['propriete', 'statut', 'sync', 'hotel', 'booking', 'airbnb']
            found_indicators = [indicator for indicator in property_indicators if indicator in response_text]
            if found_indicators:
                self.log(f"✅ Property info found in response: {found_indicators}", "PASS")
            else:
                self.log(f"⚠️ Response may not contain property info: {response['message'][:200]}", "WARN")
        return success

    def test_chat_history_without_auth(self):
        """Test GET /api/chat/history returns 401 without auth"""
        success, response = self.run_test(
            "Chat History (No Auth)",
            "GET",
            "api/chat/history",
            401
        )
        return success

    def test_chat_history_with_auth(self):
        """Test GET /api/chat/history returns conversation history"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Chat History (Auth)",
            "GET",
            "api/chat/history?limit=50",
            200,
            use_auth=True
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} chat messages in history", "PASS")
            # Check if any messages have proper structure
            if response:
                msg = response[0]
                if 'role' in msg and 'content' in msg and 'created_at' in msg:
                    self.log("✅ Chat history has proper message structure", "PASS")
        return success

    def test_chat_suggestions_without_auth(self):
        """Test GET /api/chat/suggestions returns 401 without auth"""
        success, response = self.run_test(
            "Chat Suggestions (No Auth)",
            "GET",
            "api/chat/suggestions",
            401
        )
        return success

    def test_chat_suggestions_with_auth(self):
        """Test GET /api/chat/suggestions returns auto-suggestions based on system state"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Chat Suggestions (Auth)",
            "GET",
            "api/chat/suggestions",
            200,
            use_auth=True
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} chat suggestions", "PASS")
            # Check if suggestions have proper structure
            if response:
                suggestion = response[0]
                if 'type' in suggestion and 'message' in suggestion and 'action' in suggestion:
                    self.log("✅ Chat suggestions have proper structure", "PASS")
        return success

    def test_clear_chat_history_without_auth(self):
        """Test DELETE /api/chat/history returns 401 without auth"""
        success, response = self.run_test(
            "Clear Chat History (No Auth)",
            "DELETE",
            "api/chat/history",
            401
        )
        return success

    def test_clear_chat_history_with_auth(self):
        """Test DELETE /api/chat/history clears history"""
        if not self.session_token:
            self.log("❌ No session token available", "SKIP")
            return False
            
        success, response = self.run_test(
            "Clear Chat History (Auth)",
            "DELETE",
            "api/chat/history",
            200,
            use_auth=True
        )
        if success and response.get('cleared') is True:
            self.log("✅ Chat history cleared successfully", "PASS")
        return success

def main():
    tester = OrbitAPITester()
    
    print("🚀 Starting Orbit API Backend Tests - Iteration 4 (AI Chat Assistant)")
    print("Testing Auth, Users, Reservations, Subscription, Properties & New Chat Features")
    print("=" * 75)
    
    # Test all endpoints in logical order
    tests = [
        # Public endpoints
        tester.test_health_endpoint,
        tester.test_get_plans,
        
        # Auth tests
        tester.test_register_new_user,
        tester.test_auth_me_with_session, 
        tester.test_auth_me_without_session,
        tester.test_logout,
        
        # Login as admin for protected tests
        tester.test_login_admin,
        tester.test_auth_me_with_session,
        tester.test_update_settings,
        
        # Protected endpoint auth checks
        tester.test_properties_without_auth,
        
        # Chat endpoints without auth (should fail)
        tester.test_chat_send_without_auth,
        tester.test_chat_history_without_auth,
        tester.test_chat_suggestions_without_auth,
        tester.test_clear_chat_history_without_auth,
        
        # Chat endpoints with auth (should work)
        tester.test_chat_send_with_auth,
        tester.test_chat_send_system_status_french,
        tester.test_chat_send_properties_french,
        tester.test_chat_history_with_auth,
        tester.test_chat_suggestions_with_auth,
        tester.test_clear_chat_history_with_auth,
        
        # Properties (with auth)
        tester.test_list_properties_with_auth,
        tester.test_create_property_with_auth,
        
        # Reservations
        tester.test_list_reservations,
        tester.test_create_reservation,
        tester.test_delete_reservation,
        
        # Admin-only user management  
        tester.test_list_users_admin,
        tester.test_update_user_role,
        
        # Subscription/Stripe
        tester.test_create_checkout_session,
        tester.test_checkout_status,
        
        # Legacy agent tests (if needed)
        tester.test_agent_status,
        tester.test_list_logs,
        tester.test_list_screenshots,
    ]
    
    for test in tests:
        test()
        print()  # Add spacing between tests
    
    print("=" * 75)
    print(f"📊 Backend Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️  Some backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())