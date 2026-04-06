#!/usr/bin/env python3
"""
Backend API Testing for Waypoint Studio
Tests all API endpoints including health, routing, elevation, GPX export, and route CRUD operations.
"""

import requests
import sys
import json
from datetime import datetime

class WaypointStudioAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.saved_route_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.headers.get('content-type', '').startswith('application/json'):
                try:
                    response_data = response.json()
                    details += f", Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'array'}"
                except:
                    pass

            self.log_test(name, success, details)
            return success, response

        except requests.exceptions.Timeout:
            self.log_test(name, False, "Request timeout")
            return False, None
        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, None

    def test_health(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        if success and response:
            try:
                data = response.json()
                if data.get("status") == "ok":
                    print(f"   Service: {data.get('service', 'Unknown')}")
                    return True
            except:
                pass
        return success

    def test_route_solve_cycling(self):
        """Test route solving with cycling profile"""
        # Paris coordinates: Louvre to Eiffel Tower
        waypoints = [
            [2.3376, 48.8606],  # Louvre Museum
            [2.2945, 48.8584]   # Eiffel Tower
        ]
        
        success, response = self.run_test(
            "Route Solve - Cycling",
            "POST",
            "api/route/solve",
            200,
            data={
                "waypoints": waypoints,
                "activity": "cycling"
            }
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success") and data.get("coordinates"):
                    coords_count = len(data["coordinates"])
                    distance = data.get("distance", 0)
                    duration = data.get("duration", 0)
                    print(f"   Route: {coords_count} coordinates, {distance/1000:.2f}km, {duration/60:.1f}min")
                    return True
            except:
                pass
        return success

    def test_route_solve_with_alternatives(self):
        """Test route solving with alternatives=true"""
        waypoints = [
            [2.3376, 48.8606],  # Louvre Museum
            [2.2945, 48.8584]   # Eiffel Tower
        ]
        
        success, response = self.run_test(
            "Route Solve - With Alternatives",
            "POST",
            "api/route/solve",
            200,
            data={
                "waypoints": waypoints,
                "activity": "cycling",
                "alternatives": True
            }
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success") and data.get("coordinates"):
                    coords_count = len(data["coordinates"])
                    distance = data.get("distance", 0)
                    alternatives = data.get("alternatives", [])
                    print(f"   Route: {coords_count} coordinates, {distance/1000:.2f}km")
                    print(f"   Alternatives: {len(alternatives)} alternative routes")
                    return True
            except:
                pass
        return success

    def test_route_solve_exclude_motorways(self):
        """Test route solving with exclude=['motorway']"""
        waypoints = [
            [2.3376, 48.8606],  # Louvre Museum
            [2.2945, 48.8584]   # Eiffel Tower
        ]
        
        success, response = self.run_test(
            "Route Solve - Exclude Motorways",
            "POST",
            "api/route/solve",
            200,
            data={
                "waypoints": waypoints,
                "activity": "cycling",
                "exclude": ["motorway"]
            }
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success") and data.get("coordinates"):
                    coords_count = len(data["coordinates"])
                    distance = data.get("distance", 0)
                    print(f"   Route (no motorways): {coords_count} coordinates, {distance/1000:.2f}km")
                    return True
            except:
                pass
        return success

    def test_route_solve_running(self):
        """Test route solving with running profile"""
        # Paris coordinates: Notre-Dame to Panthéon
        waypoints = [
            [2.3499, 48.8530],  # Notre-Dame
            [2.3464, 48.8462]   # Panthéon
        ]
        
        success, response = self.run_test(
            "Route Solve - Running",
            "POST",
            "api/route/solve",
            200,
            data={
                "waypoints": waypoints,
                "activity": "running"
            }
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success") and data.get("coordinates"):
                    coords_count = len(data["coordinates"])
                    distance = data.get("distance", 0)
                    duration = data.get("duration", 0)
                    print(f"   Route: {coords_count} coordinates, {distance/1000:.2f}km, {duration/60:.1f}min")
                    return True
            except:
                pass
        return success

    def test_auto_route_loop(self):
        """Test auto route generation - loop type"""
        success, response = self.run_test(
            "Auto Route - Loop",
            "POST",
            "api/route/auto",
            200,
            data={
                "start_lat": 48.8566,
                "start_lng": 2.3522,
                "target_distance_km": 5.0,
                "activity": "cycling",
                "route_type": "loop"
            }
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success") and data.get("coordinates") and data.get("waypoints"):
                    coords_count = len(data["coordinates"])
                    waypoints_count = len(data["waypoints"])
                    distance = data.get("distance", 0)
                    print(f"   Auto Loop: {waypoints_count} waypoints, {coords_count} coordinates, {distance/1000:.2f}km")
                    return True
            except:
                pass
        return success

    def test_auto_route_out_and_back(self):
        """Test auto route generation - out and back type"""
        success, response = self.run_test(
            "Auto Route - Out and Back",
            "POST",
            "api/route/auto",
            200,
            data={
                "start_lat": 48.8566,
                "start_lng": 2.3522,
                "target_distance_km": 8.0,
                "activity": "running",
                "route_type": "out_and_back"
            }
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success") and data.get("coordinates") and data.get("waypoints"):
                    coords_count = len(data["coordinates"])
                    waypoints_count = len(data["waypoints"])
                    distance = data.get("distance", 0)
                    print(f"   Auto Out&Back: {waypoints_count} waypoints, {coords_count} coordinates, {distance/1000:.2f}km")
                    return True
            except:
                pass
        return success

    def test_elevation(self):
        """Test elevation data fetching"""
        # Sample coordinates along a route in Paris
        coordinates = [
            [2.3376, 48.8606],  # Louvre
            [2.3400, 48.8600],  # Point along Seine
            [2.3450, 48.8590],  # Pont Neuf area
            [2.3499, 48.8530]   # Notre-Dame
        ]
        
        success, response = self.run_test(
            "Elevation Data",
            "POST",
            "api/elevation",
            200,
            data={"coordinates": coordinates}
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success") and data.get("elevations"):
                    elevations = data["elevations"]
                    gain = data.get("gain", 0)
                    loss = data.get("loss", 0)
                    min_elev = data.get("min_elevation", 0)
                    max_elev = data.get("max_elevation", 0)
                    print(f"   Elevation: {len(elevations)} points, {min_elev}m-{max_elev}m, +{gain}m/-{loss}m")
                    return True
            except:
                pass
        return success

    def test_gpx_export(self):
        """Test GPX file export"""
        # Sample route coordinates
        coordinates = [
            [2.3376, 48.8606],
            [2.3400, 48.8600],
            [2.3450, 48.8590],
            [2.3499, 48.8530]
        ]
        elevations = [35.0, 32.0, 30.0, 28.0]
        waypoints = [[2.3376, 48.8606], [2.3499, 48.8530]]
        
        success, response = self.run_test(
            "GPX Export",
            "POST",
            "api/gpx/export",
            200,
            data={
                "coordinates": coordinates,
                "elevations": elevations,
                "waypoints": waypoints,
                "name": "Test Route",
                "activity": "cycling"
            }
        )
        
        if success and response:
            content_type = response.headers.get('content-type', '')
            if 'gpx' in content_type or 'xml' in content_type:
                content_length = len(response.content)
                print(f"   GPX: {content_length} bytes, Content-Type: {content_type}")
                # Check if it contains basic GPX structure
                if b'<gpx' in response.content and b'</gpx>' in response.content:
                    return True
        return success

    def test_save_route(self):
        """Test saving a route"""
        route_data = {
            "name": f"Test Route {datetime.now().strftime('%H%M%S')}",
            "waypoints": [[2.3376, 48.8606], [2.3499, 48.8530]],
            "activity": "cycling",
            "route_coordinates": [
                [2.3376, 48.8606], [2.3400, 48.8600], 
                [2.3450, 48.8590], [2.3499, 48.8530]
            ],
            "distance": 2500.0,
            "duration": 450.0,
            "elevation_gain": 15.0,
            "elevation_loss": 20.0
        }
        
        success, response = self.run_test(
            "Save Route",
            "POST",
            "api/routes",
            200,
            data=route_data
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("_id"):
                    self.saved_route_id = data["_id"]
                    print(f"   Saved route ID: {self.saved_route_id}")
                    return True
            except:
                pass
        return success

    def test_list_routes(self):
        """Test listing all routes"""
        success, response = self.run_test(
            "List Routes",
            "GET",
            "api/routes",
            200
        )
        
        if success and response:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"   Found {len(data)} saved routes")
                    return True
            except:
                pass
        return success

    def test_get_route_by_id(self):
        """Test getting a specific route by ID"""
        if not self.saved_route_id:
            print("❌ Get Route by ID - SKIPPED (no saved route ID)")
            return False
            
        success, response = self.run_test(
            "Get Route by ID",
            "GET",
            f"api/routes/{self.saved_route_id}",
            200
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("_id") == self.saved_route_id:
                    print(f"   Retrieved route: {data.get('name', 'Unknown')}")
                    return True
            except:
                pass
        return success

    def test_delete_route(self):
        """Test deleting a route"""
        if not self.saved_route_id:
            print("❌ Delete Route - SKIPPED (no saved route ID)")
            return False
            
        success, response = self.run_test(
            "Delete Route",
            "DELETE",
            f"api/routes/{self.saved_route_id}",
            200
        )
        
        if success and response:
            try:
                data = response.json()
                if data.get("success"):
                    print(f"   Deleted route ID: {self.saved_route_id}")
                    return True
            except:
                pass
        return success

    def test_gpx_import_valid(self):
        """Test GPX import with valid file"""
        # Read the test GPX file
        try:
            with open('/app/tests/test_output.gpx', 'rb') as f:
                gpx_content = f.read()
        except Exception as e:
            self.log_test("GPX Import - Valid File", False, f"Could not read test GPX file: {e}")
            return False
        
        # Use requests to send multipart form data
        url = f"{self.base_url}/api/gpx/import"
        files = {'file': ('test_route.gpx', gpx_content, 'application/gpx+xml')}
        
        try:
            response = requests.post(url, files=files, timeout=30)
            success = response.status_code == 200
            
            if success:
                try:
                    data = response.json()
                    if data.get("success"):
                        waypoints = data.get("waypoints", [])
                        track_points = data.get("track_points", [])
                        name = data.get("name", "")
                        activity = data.get("activity", "")
                        elevations = data.get("elevations", [])
                        
                        details = f"Status: 200, Waypoints: {len(waypoints)}, Track points: {len(track_points)}, Name: '{name}', Activity: '{activity}', Elevations: {len(elevations)}"
                        self.log_test("GPX Import - Valid File", True, details)
                        return True
                    else:
                        self.log_test("GPX Import - Valid File", False, f"Status: 200, but success=false: {data.get('error', 'Unknown error')}")
                        return False
                except Exception as e:
                    self.log_test("GPX Import - Valid File", False, f"Status: 200, but JSON parse error: {e}")
                    return False
            else:
                self.log_test("GPX Import - Valid File", False, f"Status: {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            self.log_test("GPX Import - Valid File", False, "Request timeout")
            return False
        except Exception as e:
            self.log_test("GPX Import - Valid File", False, f"Error: {str(e)}")
            return False

    def test_gpx_import_invalid(self):
        """Test GPX import with invalid file (non-GPX)"""
        # Create a fake non-GPX file
        fake_content = b"This is not a GPX file, just plain text"
        
        url = f"{self.base_url}/api/gpx/import"
        files = {'file': ('fake.txt', fake_content, 'text/plain')}
        
        try:
            response = requests.post(url, files=files, timeout=30)
            success = response.status_code == 400  # Should reject non-GPX files
            
            details = f"Status: {response.status_code}"
            if response.status_code == 400:
                try:
                    data = response.json()
                    details += f", Error: {data.get('detail', 'Unknown error')}"
                except:
                    pass
            
            self.log_test("GPX Import - Invalid File", success, details)
            return success
                
        except requests.exceptions.Timeout:
            self.log_test("GPX Import - Invalid File", False, "Request timeout")
            return False
        except Exception as e:
            self.log_test("GPX Import - Invalid File", False, f"Error: {str(e)}")
            return False

    def test_error_cases(self):
        """Test error handling"""
        print("\n🔍 Testing Error Cases:")
        
        # Test route solve with insufficient waypoints
        success, _ = self.run_test(
            "Route Solve - Insufficient Waypoints",
            "POST",
            "api/route/solve",
            400,
            data={"waypoints": [[2.3376, 48.8606]], "activity": "cycling"}
        )
        
        # Test elevation with no coordinates
        success2, _ = self.run_test(
            "Elevation - No Coordinates",
            "POST",
            "api/elevation",
            400,
            data={"coordinates": []}
        )
        
        # Test GPX export with no coordinates
        success3, _ = self.run_test(
            "GPX Export - No Coordinates",
            "POST",
            "api/gpx/export",
            400,
            data={"coordinates": []}
        )
        
        # Test get non-existent route
        success4, _ = self.run_test(
            "Get Non-existent Route",
            "GET",
            "api/routes/507f1f77bcf86cd799439011",
            404
        )
        
        return success and success2 and success3 and success4

def main():
    print("🚀 Starting Waypoint Studio Backend API Tests")
    print("=" * 60)
    
    tester = WaypointStudioAPITester()
    
    # Core functionality tests
    print("\n🔍 Testing Core Functionality:")
    tester.test_health()
    tester.test_route_solve_cycling()
    tester.test_route_solve_with_alternatives()
    tester.test_route_solve_exclude_motorways()
    tester.test_route_solve_running()
    tester.test_auto_route_loop()
    tester.test_auto_route_out_and_back()
    tester.test_elevation()
    tester.test_gpx_export()
    
    # GPX Import tests
    print("\n🔍 Testing GPX Import:")
    tester.test_gpx_import_valid()
    tester.test_gpx_import_invalid()
    
    # CRUD operations
    print("\n🔍 Testing Route CRUD Operations:")
    tester.test_save_route()
    tester.test_list_routes()
    tester.test_get_route_by_id()
    tester.test_delete_route()
    
    # Error handling
    tester.test_error_cases()
    
    # Final results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())