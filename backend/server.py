import os
import logging
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager
import xml.etree.ElementTree as ET

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from route_utils import get_route, get_elevation, generate_gpx, generate_auto_route

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "waypoint_studio")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.mongo_client = AsyncIOMotorClient(MONGO_URL)
    app.state.db = app.state.mongo_client[DB_NAME]
    logger.info(f"Connected to MongoDB: {DB_NAME}")
    yield
    app.state.mongo_client.close()


app = FastAPI(title="Waypoint Studio API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def serialize_doc(doc):
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [
                serialize_doc(v) if isinstance(v, dict)
                else str(v) if isinstance(v, ObjectId)
                else v.isoformat() if isinstance(v, datetime)
                else v
                for v in value
            ]
        elif isinstance(value, dict):
            result[key] = serialize_doc(value)
        else:
            result[key] = value
    return result


# --- Models ---

class RouteRequest(BaseModel):
    waypoints: List[List[float]]
    activity: str = "cycling"
    alternatives: bool = False
    exclude: Optional[List[str]] = None

class ElevationRequest(BaseModel):
    coordinates: List[List[float]]

class GPXExportRequest(BaseModel):
    coordinates: List[List[float]]
    elevations: Optional[List[float]] = None
    waypoints: Optional[List[List[float]]] = None
    name: str = "Waypoint Studio Route"
    activity: str = "cycling"

class SaveRouteRequest(BaseModel):
    name: str
    waypoints: List[List[float]]
    activity: str = "cycling"
    route_coordinates: Optional[List[List[float]]] = None
    distance: Optional[float] = None
    duration: Optional[float] = None
    elevation_gain: Optional[float] = None
    elevation_loss: Optional[float] = None

class AutoRouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    target_distance_km: float = 10.0
    activity: str = "cycling"
    route_type: str = "loop"


# --- GPX Import Parser ---

def parse_gpx(content: str) -> dict:
    """Parse GPX XML and extract waypoints, track points, and metadata."""
    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        return {"success": False, "error": f"Invalid GPX XML: {e}"}

    # Handle namespace
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    result = {
        "success": True,
        "name": "",
        "activity": "cycling",
        "waypoints": [],
        "track_points": [],
        "elevations": [],
    }

    # Extract metadata name
    meta_name = root.find(f"{ns}metadata/{ns}name")
    if meta_name is not None and meta_name.text:
        result["name"] = meta_name.text

    # Extract wpt elements (explicit waypoints)
    for wpt in root.findall(f"{ns}wpt"):
        lat = wpt.get("lat")
        lon = wpt.get("lon")
        if lat and lon:
            result["waypoints"].append([float(lon), float(lat)])  # GeoJSON order

    # Extract trk -> trkseg -> trkpt elements
    for trk in root.findall(f"{ns}trk"):
        trk_name = trk.find(f"{ns}name")
        if trk_name is not None and trk_name.text and not result["name"]:
            result["name"] = trk_name.text

        trk_type = trk.find(f"{ns}type")
        if trk_type is not None and trk_type.text:
            t = trk_type.text.lower()
            if "run" in t or "foot" in t:
                result["activity"] = "running"
            elif "cycl" in t or "bike" in t:
                result["activity"] = "cycling"

        for seg in trk.findall(f"{ns}trkseg"):
            for trkpt in seg.findall(f"{ns}trkpt"):
                lat = trkpt.get("lat")
                lon = trkpt.get("lon")
                if lat and lon:
                    result["track_points"].append([float(lon), float(lat)])
                    ele = trkpt.find(f"{ns}ele")
                    if ele is not None and ele.text:
                        try:
                            result["elevations"].append(float(ele.text))
                        except ValueError:
                            result["elevations"].append(0)

    # Also check rte -> rtept (route points)
    for rte in root.findall(f"{ns}rte"):
        rte_name = rte.find(f"{ns}name")
        if rte_name is not None and rte_name.text and not result["name"]:
            result["name"] = rte_name.text
        for rtept in rte.findall(f"{ns}rtept"):
            lat = rtept.get("lat")
            lon = rtept.get("lon")
            if lat and lon:
                result["track_points"].append([float(lon), float(lat)])

    if not result["name"]:
        result["name"] = "Imported Route"

    # If we have track points but no explicit waypoints, sample waypoints from track
    if result["track_points"] and not result["waypoints"]:
        tp = result["track_points"]
        count = min(len(tp), 10)  # Sample up to 10 waypoints
        if count <= 2:
            result["waypoints"] = tp[:]
        else:
            indices = [int(i * (len(tp) - 1) / (count - 1)) for i in range(count)]
            result["waypoints"] = [tp[i] for i in indices]

    if not result["waypoints"] and not result["track_points"]:
        return {"success": False, "error": "No waypoints or track data found in GPX file"}

    return result


# --- Endpoints ---

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Waypoint Studio"}


@app.post("/api/route/solve")
async def solve_route(req: RouteRequest):
    if len(req.waypoints) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 waypoints")
    result = get_route(req.waypoints, req.activity, req.alternatives, req.exclude)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Routing failed"))
    return result


@app.post("/api/route/auto")
async def auto_route(req: AutoRouteRequest):
    result = generate_auto_route(
        start_lng=req.start_lng, start_lat=req.start_lat,
        target_distance_km=req.target_distance_km,
        activity=req.activity, route_type=req.route_type,
    )
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Auto route generation failed"))
    return result


@app.post("/api/elevation")
async def fetch_elevation(req: ElevationRequest):
    if not req.coordinates:
        raise HTTPException(status_code=400, detail="No coordinates provided")
    result = get_elevation(req.coordinates)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Elevation fetch failed"))
    return result


@app.post("/api/gpx/export")
async def export_gpx(req: GPXExportRequest):
    if not req.coordinates:
        raise HTTPException(status_code=400, detail="No coordinates provided")
    gpx_content = generate_gpx(
        route_coords=req.coordinates, elevations=req.elevations,
        name=req.name, activity=req.activity, waypoints=req.waypoints,
    )
    return Response(
        content=gpx_content, media_type="application/gpx+xml",
        headers={"Content-Disposition": f'attachment; filename="{req.name.replace(" ", "_")}.gpx"'},
    )


@app.post("/api/gpx/import")
async def import_gpx(file: UploadFile = File(...)):
    """Import a GPX file and return parsed waypoints and track data."""
    if not file.filename.lower().endswith(".gpx"):
        raise HTTPException(status_code=400, detail="File must be a .gpx file")

    content = await file.read()
    try:
        content_str = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            content_str = content.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode GPX file")

    result = parse_gpx(content_str)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to parse GPX"))

    return result


@app.post("/api/routes")
async def save_route(req: SaveRouteRequest):
    db = app.state.db
    route_doc = {
        "name": req.name, "waypoints": req.waypoints, "activity": req.activity,
        "route_coordinates": req.route_coordinates, "distance": req.distance,
        "duration": req.duration, "elevation_gain": req.elevation_gain,
        "elevation_loss": req.elevation_loss,
        "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
    }
    result = await db.routes.insert_one(route_doc)
    route_doc["_id"] = result.inserted_id
    return serialize_doc(route_doc)


@app.get("/api/routes")
async def list_routes():
    db = app.state.db
    routes = []
    cursor = db.routes.find().sort("updated_at", -1)
    async for route in cursor:
        routes.append(serialize_doc(route))
    return routes


@app.get("/api/routes/{route_id}")
async def get_route_by_id(route_id: str):
    db = app.state.db
    try:
        route = await db.routes.find_one({"_id": ObjectId(route_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid route ID")
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return serialize_doc(route)


@app.delete("/api/routes/{route_id}")
async def delete_route(route_id: str):
    db = app.state.db
    try:
        result = await db.routes.delete_one({"_id": ObjectId(route_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid route ID")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"success": True, "message": "Route deleted"}
