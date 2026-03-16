#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class OrbitAPITester:
    def __init__(self, base_url="https://b45c1c9c-9183-4902-811c-cf34ab14db55.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.property_id = None
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] [{status}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

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

    def test_create_property(self):
        """Test POST /api/properties creates a property with auto-assigned mock URLs"""
        success, response = self.run_test(
            "Create Property",
            "POST",
            "api/properties",
            200,
            data={"name": "Test Hotel Orbit"}
        )
        if success and 'property_id' in response:
            self.property_id = response['property_id']
            self.log(f"✅ Property created with ID: {self.property_id}", "PASS")
            # Verify mock URLs were assigned
            if 'airbnb_url' in response and 'booking_url' in response:
                self.log("✅ Mock URLs assigned automatically", "PASS")
            else:
                self.log("❌ Mock URLs not assigned", "FAIL")
        return success

    def test_list_properties(self):
        """Test GET /api/properties lists all properties"""
        success, response = self.run_test(
            "List Properties",
            "GET",
            "api/properties",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} properties", "PASS")
        return success

    def test_get_property(self):
        """Test GET /api/properties/{id} returns single property"""
        if not self.property_id:
            self.log("❌ No property ID available for testing", "SKIP")
            return False
            
        success, response = self.run_test(
            "Get Single Property",
            "GET",
            f"api/properties/{self.property_id}",
            200
        )
        if success and response.get('property_id') == self.property_id:
            self.log("✅ Single property retrieved correctly", "PASS")
        return success

    def test_update_property(self):
        """Test PUT /api/properties/{id} updates property fields"""
        if not self.property_id:
            self.log("❌ No property ID available for testing", "SKIP")
            return False
            
        success, response = self.run_test(
            "Update Property",
            "PUT",
            f"api/properties/{self.property_id}",
            200,
            data={"name": "Updated Test Hotel Orbit"}
        )
        if success and response.get('name') == "Updated Test Hotel Orbit":
            self.log("✅ Property updated successfully", "PASS")
        return success

    def test_trigger_sync(self):
        """Test POST /api/properties/{id}/sync triggers sync for a property"""
        if not self.property_id:
            self.log("❌ No property ID available for testing", "SKIP")
            return False
            
        success, response = self.run_test(
            "Trigger Property Sync",
            "POST",
            f"api/properties/{self.property_id}/sync",
            200
        )
        if success and 'message' in response:
            self.log("✅ Sync triggered successfully", "PASS")
        return success

    def test_list_logs(self):
        """Test GET /api/logs returns logs list"""
        success, response = self.run_test(
            "List Logs",
            "GET",
            "api/logs",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} log entries", "PASS")
        return success

    def test_agent_status(self):
        """Test GET /api/agent/status returns agent state"""
        success, response = self.run_test(
            "Agent Status",
            "GET",
            "api/agent/status",
            200
        )
        if success and 'running' in response:
            self.log(f"✅ Agent status: {'running' if response['running'] else 'stopped'}", "PASS")
        return success

    def test_agent_start(self):
        """Test POST /api/agent/start starts the agent"""
        success, response = self.run_test(
            "Start Agent",
            "POST",
            "api/agent/start",
            200
        )
        if success and 'message' in response:
            self.log("✅ Agent start command executed", "PASS")
        return success

    def test_agent_stop(self):
        """Test POST /api/agent/stop stops the agent"""
        success, response = self.run_test(
            "Stop Agent",
            "POST",
            "api/agent/stop",
            200
        )
        if success and 'message' in response:
            self.log("✅ Agent stop command executed", "PASS")
        return success

    def test_agent_config(self):
        """Test POST /api/agent/config updates polling interval"""
        success, response = self.run_test(
            "Update Agent Config",
            "POST",
            "api/agent/config",
            200,
            data={"polling_interval": 600}
        )
        if success and response.get('polling_interval') == 600:
            self.log("✅ Agent config updated successfully", "PASS")
        return success

    def test_list_screenshots(self):
        """Test GET /api/screenshots lists screenshots"""
        success, response = self.run_test(
            "List Screenshots",
            "GET",
            "api/screenshots",
            200
        )
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} screenshots", "PASS")
        return success

    def test_delete_property(self):
        """Test DELETE /api/properties/{id} removes property"""
        if not self.property_id:
            self.log("❌ No property ID available for testing", "SKIP")
            return False
            
        success, response = self.run_test(
            "Delete Property",
            "DELETE",
            f"api/properties/{self.property_id}",
            200
        )
        if success and response.get('deleted') is True:
            self.log("✅ Property deleted successfully", "PASS")
        return success

def main():
    tester = OrbitAPITester()
    
    print("🚀 Starting Orbit API Backend Tests")
    print("=" * 50)
    
    # Test all endpoints in logical order
    tests = [
        tester.test_health_endpoint,
        tester.test_create_property,
        tester.test_list_properties,
        tester.test_get_property,
        tester.test_update_property,
        tester.test_trigger_sync,
        tester.test_list_logs,
        tester.test_agent_status,
        tester.test_agent_start,
        tester.test_agent_stop,
        tester.test_agent_config,
        tester.test_list_screenshots,
        tester.test_delete_property,
    ]
    
    for test in tests:
        test()
        print()  # Add spacing between tests
    
    print("=" * 50)
    print(f"📊 Backend Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️  Some backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())