"""
POC Test Script: Waypoint Studio Core
Tests: OSRM routing (bike/foot), Elevation API, GPX generation
"""
import requests
import json
import xml.etree.ElementTree as ET
from datetime import datetime
import time

# Test waypoints (Central Park, NYC area)
WAYPOINTS = [
    (-73.9712, 40.7831),  # lon, lat - Central Park West
    (-73.9665, 40.7812),  # lon, lat - Mid Central Park
    (-73.9580, 40.7685),  # lon, lat - East side
]

# OSRM routing servers to test
OSRM_SERVERS = {
    "osrm_demo_driving": "https://router.project-osrm.org/route/v1/driving",
    "osrm_de_bike": "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
    "osrm_de_foot": "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
}

# Activity to OSRM server mapping
ACTIVITY_PROFILES = {
    "cycling": "osrm_de_bike",
    "running": "osrm_de_foot",
}

# Fallback speeds (km/h) for duration estimation
ACTIVITY_SPEEDS = {
    "cycling": 20.0,
    "running": 10.0,
}


def test_osrm_routing(server_name, server_url, waypoints):
    """Test OSRM routing API with given waypoints"""
    print(f"\n{'='*60}")
    print(f"Testing OSRM: {server_name}")
    print(f"URL: {server_url}")
    print(f"{'='*60}")

    # Build coordinates string: lon,lat;lon,lat;...
    coords_str = ";".join(f"{lon},{lat}" for lon, lat in waypoints)
    url = f"{server_url}/{coords_str}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        print(f"Status: {resp.status_code}")

        if resp.status_code == 200:
            data = resp.json()
            if data.get("code") == "Ok":
                route = data["routes"][0]
                distance_km = route["distance"] / 1000
                duration_min = route["duration"] / 60
                coords = route["geometry"]["coordinates"]
                print(f"SUCCESS - Distance: {distance_km:.2f} km, Duration: {duration_min:.1f} min")
                print(f"Route points: {len(coords)}")
                print(f"First 3 coords: {coords[:3]}")
                return {
                    "success": True,
                    "distance": route["distance"],
                    "duration": route["duration"],
                    "coordinates": coords,
                }
            else:
                print(f"OSRM error code: {data.get('code')}")
                print(f"Message: {data.get('message', 'N/A')}")
                return {"success": False, "error": data.get("message", "Unknown")}
        else:
            print(f"HTTP Error: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            return {"success": False, "error": f"HTTP {resp.status_code}"}

    except requests.exceptions.Timeout:
        print("TIMEOUT - Server did not respond in 15s")
        return {"success": False, "error": "Timeout"}
    except Exception as e:
        print(f"ERROR: {e}")
        return {"success": False, "error": str(e)}


def test_elevation_api(coordinates):
    """Test Open-Meteo Elevation API"""
    print(f"\n{'='*60}")
    print("Testing Open-Meteo Elevation API")
    print(f"{'='*60}")

    # Downsample to strictly 100 or fewer coordinates
    max_points = 100
    if len(coordinates) > max_points:
        # Use linspace-like indexing to get exactly max_points
        indices = [int(i * (len(coordinates) - 1) / (max_points - 1)) for i in range(max_points)]
        sampled = [coordinates[i] for i in indices]
    else:
        sampled = coordinates
    
    print(f"Coordinates: {len(coordinates)} -> Sampled: {len(sampled)}")

    # Open-Meteo expects lat,lon separately
    lats = [c[1] for c in sampled]  # GeoJSON is [lon, lat]
    lons = [c[0] for c in sampled]

    url = "https://api.open-meteo.com/v1/elevation"
    params = {
        "latitude": ",".join(str(l) for l in lats),
        "longitude": ",".join(str(l) for l in lons),
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        print(f"Status: {resp.status_code}")

        if resp.status_code == 200:
            data = resp.json()
            elevations = data.get("elevation", [])
            if elevations:
                print(f"SUCCESS - Got {len(elevations)} elevation points")
                print(f"Min: {min(elevations):.1f}m, Max: {max(elevations):.1f}m")

                # Compute gain/loss
                gain = 0
                loss = 0
                for i in range(1, len(elevations)):
                    diff = elevations[i] - elevations[i - 1]
                    if diff > 0:
                        gain += diff
                    else:
                        loss += abs(diff)

                print(f"Elevation gain: {gain:.1f}m, Elevation loss: {loss:.1f}m")
                return {
                    "success": True,
                    "elevations": elevations,
                    "sampled_coords": sampled,
                    "gain": gain,
                    "loss": loss,
                }
            else:
                print("No elevation data returned")
                return {"success": False, "error": "No data"}
        else:
            print(f"HTTP Error: {resp.status_code}")
            print(f"Response: {resp.text[:200]}")
            return {"success": False, "error": f"HTTP {resp.status_code}"}

    except Exception as e:
        print(f"ERROR: {e}")
        return {"success": False, "error": str(e)}


def test_gpx_generation(route_coords, elevations, activity="cycling"):
    """Test GPX file generation"""
    print(f"\n{'='*60}")
    print("Testing GPX Generation")
    print(f"{'='*60}")

    try:
        # Create GPX XML
        gpx_ns = "http://www.topografix.com/GPX/1/1"
        xsi_ns = "http://www.w3.org/2001/XMLSchema-instance"

        root = ET.Element("gpx")
        root.set("version", "1.1")
        root.set("creator", "Waypoint Studio")
        root.set("xmlns", gpx_ns)
        root.set("xmlns:xsi", xsi_ns)
        root.set("xsi:schemaLocation", f"{gpx_ns} http://www.topografix.com/GPX/1/1/gpx.xsd")

        # Metadata
        metadata = ET.SubElement(root, "metadata")
        name = ET.SubElement(metadata, "name")
        name.text = f"Waypoint Studio - {activity.title()} Route"
        time_elem = ET.SubElement(metadata, "time")
        time_elem.text = datetime.utcnow().isoformat() + "Z"

        # Track
        trk = ET.SubElement(root, "trk")
        trk_name = ET.SubElement(trk, "name")
        trk_name.text = f"{activity.title()} Route"
        trk_type = ET.SubElement(trk, "type")
        trk_type.text = activity

        trkseg = ET.SubElement(trk, "trkseg")

        # Match elevations to route coords (downsample if needed)
        elev_index = 0
        elev_step = max(1, len(route_coords) // len(elevations)) if elevations else 1

        for i, coord in enumerate(route_coords):
            trkpt = ET.SubElement(trkseg, "trkpt")
            trkpt.set("lat", str(coord[1]))  # GeoJSON is [lon, lat]
            trkpt.set("lon", str(coord[0]))

            if elevations and elev_index < len(elevations):
                ele = ET.SubElement(trkpt, "ele")
                ele.text = str(round(elevations[elev_index], 1))
                if (i + 1) % elev_step == 0 and elev_index < len(elevations) - 1:
                    elev_index += 1

        # Write to file
        tree = ET.ElementTree(root)
        ET.indent(tree, space="  ")
        output_path = "/app/tests/test_output.gpx"
        tree.write(output_path, encoding="unicode", xml_declaration=True)

        # Validate by re-parsing
        parsed = ET.parse(output_path)
        root_parsed = parsed.getroot()
        trkpts = root_parsed.findall(".//{http://www.topografix.com/GPX/1/1}trkpt")

        print(f"SUCCESS - GPX file written to {output_path}")
        print(f"Track points: {len(trkpts)}")
        print(f"Has elevation data: {elevations is not None and len(elevations) > 0}")

        # Read and show first few lines
        with open(output_path, "r") as f:
            content = f.read()
            print(f"File size: {len(content)} bytes")
            print(f"First 500 chars:\n{content[:500]}")

        return {"success": True, "path": output_path, "track_points": len(trkpts)}

    except Exception as e:
        print(f"ERROR: {e}")
        return {"success": False, "error": str(e)}


def run_all_tests():
    """Run all POC tests"""
    print("=" * 60)
    print("WAYPOINT STUDIO - CORE POC TESTS")
    print("=" * 60)

    results = {}

    # Test 1: OSRM Demo (driving) - baseline
    result = test_osrm_routing("osrm_demo_driving", OSRM_SERVERS["osrm_demo_driving"], WAYPOINTS)
    results["osrm_demo_driving"] = result
    time.sleep(1)

    # Test 2: OSRM DE Bike (cycling)
    result = test_osrm_routing("osrm_de_bike", OSRM_SERVERS["osrm_de_bike"], WAYPOINTS)
    results["osrm_de_bike"] = result
    time.sleep(1)

    # Test 3: OSRM DE Foot (running)
    result = test_osrm_routing("osrm_de_foot", OSRM_SERVERS["osrm_de_foot"], WAYPOINTS)
    results["osrm_de_foot"] = result
    time.sleep(1)

    # Determine best routing source for each activity
    best_route = None
    if results["osrm_de_bike"].get("success"):
        best_route = results["osrm_de_bike"]
        print("\n>> Using DE Bike route for elevation & GPX tests")
    elif results["osrm_demo_driving"].get("success"):
        best_route = results["osrm_demo_driving"]
        print("\n>> Falling back to OSRM demo driving route")
    
    if not best_route:
        print("\n!! NO ROUTING SUCCEEDED - Cannot test elevation & GPX")
        return results

    # Test 4: Elevation API
    elev_result = test_elevation_api(best_route["coordinates"])
    results["elevation"] = elev_result
    time.sleep(1)

    # Test 5: GPX Generation
    elevations = elev_result.get("elevations") if elev_result.get("success") else None
    gpx_result = test_gpx_generation(best_route["coordinates"], elevations)
    results["gpx"] = gpx_result

    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    for test_name, test_result in results.items():
        status = "PASS" if test_result.get("success") else "FAIL"
        error = test_result.get("error", "")
        print(f"  {test_name}: {status} {f'({error})' if error else ''}")

    all_critical_pass = (
        (results.get("osrm_de_bike", {}).get("success") or results.get("osrm_demo_driving", {}).get("success"))
        and (results.get("osrm_de_foot", {}).get("success") or results.get("osrm_demo_driving", {}).get("success"))
        and results.get("elevation", {}).get("success")
        and results.get("gpx", {}).get("success")
    )

    print(f"\n{'='*60}")
    if all_critical_pass:
        print("ALL CRITICAL TESTS PASSED - Core is ready for app development!")
    else:
        print("SOME TESTS FAILED - Need to fix before proceeding")
    print(f"{'='*60}")

    return results


if __name__ == "__main__":
    run_all_tests()
