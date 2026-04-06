"""
Route utility functions for OSRM routing, elevation, and GPX generation.
"""
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
import math
import random
from typing import List, Tuple, Optional, Dict, Any
import logging
import io

logger = logging.getLogger(__name__)

# OSRM routing servers
OSRM_SERVERS = {
    "cycling": "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
    "running": "https://routing.openstreetmap.de/routed-foot/route/v1/driving",
}

# Average speeds for duration estimates (km/h)
ACTIVITY_SPEEDS = {
    "cycling": 20.0,
    "running": 10.0,
}

# Elevation API
ELEVATION_API = "https://api.open-meteo.com/v1/elevation"
MAX_ELEVATION_POINTS = 100


def get_route(
    waypoints: List[List[float]],
    activity: str = "cycling",
    alternatives: bool = False,
    exclude: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Get route from OSRM between waypoints.
    waypoints: List of [lng, lat] pairs
    activity: 'cycling' or 'running'
    alternatives: request up to 3 alternative routes
    exclude: list of road classes to exclude e.g. ['motorway','ferry']
    Returns: { coordinates, distance, duration, success, alternatives? }
    """
    if len(waypoints) < 2:
        return {"success": False, "error": "Need at least 2 waypoints"}

    server_url = OSRM_SERVERS.get(activity, OSRM_SERVERS["cycling"])
    coords_str = ";".join(f"{wp[0]},{wp[1]}" for wp in waypoints)
    url = f"{server_url}/{coords_str}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }
    if alternatives:
        params["alternatives"] = "3"
    if exclude:
        params["exclude"] = ",".join(exclude)

    try:
        resp = requests.get(url, params=params, timeout=15)
        # If exclude param caused an error, retry without it (not all OSRM servers support it)
        if resp.status_code != 200 and exclude:
            logger.warning("OSRM exclude param failed, retrying without it")
            params.pop("exclude", None)
            resp = requests.get(url, params=params, timeout=15)

        if resp.status_code == 200:
            data = resp.json()
            # Also handle OSRM-level errors from unsupported params
            if data.get("code") != "Ok" and exclude:
                logger.warning("OSRM returned non-Ok with exclude, retrying without it")
                params.pop("exclude", None)
                resp = requests.get(url, params=params, timeout=15)
                if resp.status_code == 200:
                    data = resp.json()

            if data.get("code") == "Ok" and data.get("routes"):
                speed_kmh = ACTIVITY_SPEEDS.get(activity, 15.0)

                primary = data["routes"][0]
                primary_distance = primary["distance"]
                primary_duration = (primary_distance / 1000) / speed_kmh * 3600

                result = {
                    "success": True,
                    "coordinates": primary["geometry"]["coordinates"],
                    "distance": primary_distance,
                    "duration": primary_duration,
                    "osrm_duration": primary["duration"],
                }

                # Include alternatives if requested
                if alternatives and len(data["routes"]) > 1:
                    alts = []
                    for alt_route in data["routes"][1:]:
                        alt_dist = alt_route["distance"]
                        alts.append({
                            "coordinates": alt_route["geometry"]["coordinates"],
                            "distance": alt_dist,
                            "duration": (alt_dist / 1000) / speed_kmh * 3600,
                        })
                    result["alternatives"] = alts

                return result
            else:
                return {"success": False, "error": data.get("message", "No route found")}
        else:
            return {"success": False, "error": f"OSRM returned {resp.status_code}"}
    except requests.exceptions.Timeout:
        return {"success": False, "error": "Routing service timeout"}
    except Exception as e:
        logger.error(f"OSRM error: {e}")
        return {"success": False, "error": str(e)}


def generate_auto_route(
    start_lng: float,
    start_lat: float,
    target_distance_km: float,
    activity: str = "cycling",
    route_type: str = "loop",
) -> Dict[str, Any]:
    """
    Generate an automatic route (loop or out-and-back) from a start point.
    Returns waypoints + solved route.
    """
    if target_distance_km < 0.5:
        return {"success": False, "error": "Target distance must be at least 0.5 km"}
    if target_distance_km > 200:
        return {"success": False, "error": "Target distance must be at most 200 km"}

    # Estimate the radius of a circle that would give roughly the target distance
    # For a loop: perimeter ~ target_distance, so radius ~ target / (2*pi)
    # We'll place waypoints on a rough circle with some randomness
    if route_type == "out_and_back":
        # Out-and-back: go out ~half the distance, then return
        half_km = target_distance_km / 2
        # Convert km to degrees (rough: 1 degree lat ~ 111 km)
        delta_lat = half_km / 111.0
        # Pick a random bearing
        bearing = random.uniform(0, 2 * math.pi)
        delta_lat_offset = delta_lat * math.cos(bearing)
        delta_lng_offset = delta_lat * math.sin(bearing) / math.cos(math.radians(start_lat))

        # Create 3 waypoints: start, midpoint, turnaround
        mid_lat = start_lat + delta_lat_offset * 0.5
        mid_lng = start_lng + delta_lng_offset * 0.5
        end_lat = start_lat + delta_lat_offset
        end_lng = start_lng + delta_lng_offset

        waypoints = [
            [start_lng, start_lat],
            [mid_lng, mid_lat],
            [end_lng, end_lat],
            [mid_lng + random.uniform(-0.002, 0.002), mid_lat + random.uniform(-0.002, 0.002)],
            [start_lng, start_lat],  # return to start
        ]
    else:
        # Loop: place 4-6 waypoints roughly in a circle
        radius_km = target_distance_km / (2 * math.pi)
        radius_deg = radius_km / 111.0
        num_points = 5
        start_bearing = random.uniform(0, 2 * math.pi)

        waypoints = [[start_lng, start_lat]]
        for i in range(1, num_points):
            angle = start_bearing + (2 * math.pi * i / num_points)
            # Add some randomness to make it less circular
            r = radius_deg * (0.7 + random.uniform(0, 0.6))
            lat = start_lat + r * math.cos(angle)
            lng = start_lng + r * math.sin(angle) / math.cos(math.radians(start_lat))
            waypoints.append([lng, lat])
        waypoints.append([start_lng, start_lat])  # close the loop

    # Solve the route
    route_result = get_route(waypoints, activity)
    if not route_result.get("success"):
        return route_result

    # If actual distance is too far off from target, try adjusting
    actual_km = route_result["distance"] / 1000
    if actual_km > 0:
        ratio = target_distance_km / actual_km
        if ratio < 0.5 or ratio > 2.0:
            # Scale the waypoints toward/away from start
            scaled_waypoints = [waypoints[0]]
            for wp in waypoints[1:-1]:
                new_lng = start_lng + (wp[0] - start_lng) * ratio
                new_lat = start_lat + (wp[1] - start_lat) * ratio
                scaled_waypoints.append([new_lng, new_lat])
            scaled_waypoints.append(waypoints[-1])
            # Re-solve
            route_result2 = get_route(scaled_waypoints, activity)
            if route_result2.get("success"):
                route_result = route_result2
                waypoints = scaled_waypoints

    route_result["waypoints"] = waypoints
    return route_result


def get_elevation(coordinates: List[List[float]]) -> Dict[str, Any]:
    """Get elevation data for route coordinates."""
    if not coordinates:
        return {"success": False, "error": "No coordinates provided"}

    total = len(coordinates)
    if total > MAX_ELEVATION_POINTS:
        indices = [int(i * (total - 1) / (MAX_ELEVATION_POINTS - 1)) for i in range(MAX_ELEVATION_POINTS)]
    else:
        indices = list(range(total))

    sampled = [coordinates[i] for i in indices]
    lats = [c[1] for c in sampled]
    lons = [c[0] for c in sampled]

    params = {
        "latitude": ",".join(str(l) for l in lats),
        "longitude": ",".join(str(l) for l in lons),
    }

    try:
        resp = requests.get(ELEVATION_API, params=params, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            elevations = data.get("elevation", [])
            if elevations:
                gain = 0
                loss = 0
                for i in range(1, len(elevations)):
                    diff = elevations[i] - elevations[i - 1]
                    if diff > 0:
                        gain += diff
                    else:
                        loss += abs(diff)

                distances = [0]
                for i in range(1, len(sampled)):
                    d = haversine(sampled[i - 1][1], sampled[i - 1][0], sampled[i][1], sampled[i][0])
                    distances.append(distances[-1] + d)

                profile = []
                for i in range(len(elevations)):
                    profile.append({
                        "distance": round(distances[i], 2),
                        "elevation": round(elevations[i], 1),
                        "lat": sampled[i][1],
                        "lng": sampled[i][0],
                    })

                return {
                    "success": True,
                    "elevations": elevations,
                    "profile": profile,
                    "gain": round(gain, 1),
                    "loss": round(loss, 1),
                    "min_elevation": round(min(elevations), 1),
                    "max_elevation": round(max(elevations), 1),
                }
            else:
                return {"success": False, "error": "No elevation data returned"}
        else:
            return {"success": False, "error": f"Elevation API returned {resp.status_code}"}
    except Exception as e:
        logger.error(f"Elevation error: {e}")
        return {"success": False, "error": str(e)}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def generate_gpx(
    route_coords: List[List[float]],
    elevations: Optional[List[float]],
    name: str = "Waypoint Studio Route",
    activity: str = "cycling",
    waypoints: Optional[List[List[float]]] = None,
) -> str:
    gpx_ns = "http://www.topografix.com/GPX/1/1"
    xsi_ns = "http://www.w3.org/2001/XMLSchema-instance"

    root = ET.Element("gpx")
    root.set("version", "1.1")
    root.set("creator", "Waypoint Studio")
    root.set("xmlns", gpx_ns)
    root.set("xmlns:xsi", xsi_ns)
    root.set("xsi:schemaLocation", f"{gpx_ns} http://www.topografix.com/GPX/1/1/gpx.xsd")

    metadata = ET.SubElement(root, "metadata")
    name_el = ET.SubElement(metadata, "name")
    name_el.text = name
    time_elem = ET.SubElement(metadata, "time")
    time_elem.text = datetime.utcnow().isoformat() + "Z"

    if waypoints:
        for i, wp in enumerate(waypoints):
            wpt = ET.SubElement(root, "wpt")
            wpt.set("lat", str(wp[1]))
            wpt.set("lon", str(wp[0]))
            wpt_name = ET.SubElement(wpt, "name")
            wpt_name.text = f"Waypoint {i + 1}"

    trk = ET.SubElement(root, "trk")
    trk_name = ET.SubElement(trk, "name")
    trk_name.text = name
    trk_type = ET.SubElement(trk, "type")
    trk_type.text = activity

    trkseg = ET.SubElement(trk, "trkseg")
    total_coords = len(route_coords)
    if elevations and len(elevations) > 0:
        elev_count = len(elevations)
        for i, coord in enumerate(route_coords):
            trkpt = ET.SubElement(trkseg, "trkpt")
            trkpt.set("lat", str(coord[1]))
            trkpt.set("lon", str(coord[0]))
            elev_idx = min(int(i * (elev_count - 1) / max(total_coords - 1, 1)), elev_count - 1)
            ele = ET.SubElement(trkpt, "ele")
            ele.text = str(round(elevations[elev_idx], 1))
    else:
        for coord in route_coords:
            trkpt = ET.SubElement(trkseg, "trkpt")
            trkpt.set("lat", str(coord[1]))
            trkpt.set("lon", str(coord[0]))

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    output = io.StringIO()
    tree.write(output, encoding="unicode", xml_declaration=True)
    return output.getvalue()
