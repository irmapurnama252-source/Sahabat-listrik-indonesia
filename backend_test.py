import requests
import sys
import json
from datetime import datetime

class JasaTukangAPITester:
    def __init__(self, base_url="https://b3d99750-c678-4276-99fd-c56f41418b15.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_tukang_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_create_tukang_valid(self):
        """Test creating tukang with valid data"""
        test_data = {
            "name": "Ahmad Tukang Listrik",
            "skills": "Listrik",
            "city": "Jakarta",
            "whatsapp_number": "08123456789"
        }
        
        success, response = self.run_test(
            "Create Tukang (Valid Data)",
            "POST",
            "api/tukang",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.created_tukang_ids.append(response['id'])
            print(f"   Created tukang ID: {response['id']}")
        
        return success

    def test_create_tukang_invalid_skills(self):
        """Test creating tukang with invalid skills"""
        test_data = {
            "name": "Budi Tukang",
            "skills": "InvalidSkill",  # Invalid skill
            "city": "Bandung",
            "whatsapp_number": "08123456789"
        }
        
        success, response = self.run_test(
            "Create Tukang (Invalid Skills)",
            "POST",
            "api/tukang",
            422,  # Validation error
            data=test_data
        )
        return success

    def test_create_tukang_missing_fields(self):
        """Test creating tukang with missing required fields"""
        test_data = {
            "name": "Incomplete Tukang",
            # Missing skills, city, whatsapp_number
        }
        
        success, response = self.run_test(
            "Create Tukang (Missing Fields)",
            "POST",
            "api/tukang",
            422,  # Validation error
            data=test_data
        )
        return success

    def test_create_tukang_whatsapp_formatting(self):
        """Test WhatsApp number formatting (should add +62 prefix)"""
        test_data = {
            "name": "Sari Tukang Cat",
            "skills": "Cat",
            "city": "Surabaya",
            "whatsapp_number": "08567891234"  # Should be converted to +6285...
        }
        
        success, response = self.run_test(
            "Create Tukang (WhatsApp Formatting)",
            "POST",
            "api/tukang",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.created_tukang_ids.append(response['id'])
            # Verify the formatting by getting the tukang
            get_success, get_response = self.run_test(
                "Verify WhatsApp Formatting",
                "GET",
                f"api/tukang/{response['id']}",
                200
            )
            if get_success and 'whatsapp_number' in get_response:
                formatted_number = get_response['whatsapp_number']
                print(f"   WhatsApp formatted as: {formatted_number}")
                if formatted_number.startswith('+62'):
                    print("   ✅ WhatsApp formatting correct")
                else:
                    print("   ❌ WhatsApp formatting incorrect")
        
        return success

    def test_get_all_tukang(self):
        """Test getting all tukang"""
        success, response = self.run_test(
            "Get All Tukang",
            "GET",
            "api/tukang",
            200
        )
        
        if success:
            tukang_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {tukang_count} tukang in database")
        
        return success

    def test_get_tukang_by_id(self):
        """Test getting specific tukang by ID"""
        if not self.created_tukang_ids:
            print("   ⚠️  No tukang IDs available for testing")
            return False
        
        tukang_id = self.created_tukang_ids[0]
        success, response = self.run_test(
            "Get Tukang by ID",
            "GET",
            f"api/tukang/{tukang_id}",
            200
        )
        return success

    def test_get_nonexistent_tukang(self):
        """Test getting non-existent tukang"""
        fake_id = "nonexistent-id-12345"
        success, response = self.run_test(
            "Get Non-existent Tukang",
            "GET",
            f"api/tukang/{fake_id}",
            404
        )
        return success

    def test_delete_tukang(self):
        """Test deleting tukang"""
        if not self.created_tukang_ids:
            print("   ⚠️  No tukang IDs available for testing")
            return False
        
        tukang_id = self.created_tukang_ids.pop()  # Remove from list after deletion
        success, response = self.run_test(
            "Delete Tukang",
            "DELETE",
            f"api/tukang/{tukang_id}",
            200
        )
        return success

    def cleanup_created_tukang(self):
        """Clean up any remaining created tukang"""
        print(f"\n🧹 Cleaning up {len(self.created_tukang_ids)} remaining tukang...")
        for tukang_id in self.created_tukang_ids:
            try:
                response = requests.delete(f"{self.base_url}/api/tukang/{tukang_id}")
                if response.status_code == 200:
                    print(f"   ✅ Deleted tukang {tukang_id}")
                else:
                    print(f"   ❌ Failed to delete tukang {tukang_id}")
            except Exception as e:
                print(f"   ❌ Error deleting tukang {tukang_id}: {str(e)}")

def main():
    print("🚀 Starting Jasa Tukang Hemat API Tests")
    print("=" * 50)
    
    tester = JasaTukangAPITester()
    
    # Run all tests
    test_results = []
    
    # Basic functionality tests
    test_results.append(tester.test_health_check())
    test_results.append(tester.test_create_tukang_valid())
    test_results.append(tester.test_create_tukang_whatsapp_formatting())
    test_results.append(tester.test_get_all_tukang())
    test_results.append(tester.test_get_tukang_by_id())
    
    # Validation tests
    test_results.append(tester.test_create_tukang_invalid_skills())
    test_results.append(tester.test_create_tukang_missing_fields())
    test_results.append(tester.test_get_nonexistent_tukang())
    
    # Cleanup tests
    test_results.append(tester.test_delete_tukang())
    
    # Final cleanup
    tester.cleanup_created_tukang()
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} test(s) failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())