# Waypoint Studio

A web application for planning outdoor activity routes. Place waypoints on an interactive map, get turn-by-turn routed paths for cycling or running, visualise elevation profiles, and export your routes as GPX files.

## Features

- **Interactive map** — click to place waypoints on OpenStreetMap tiles via Leaflet
- **Activity modes** — road cycling and running, each using a separate OSRM routing profile
- **Live route drawing** — routes recalculate automatically as you add or move waypoints, with a rubber-band preview segment
- **Elevation chart** — elevation profile rendered from Open-Meteo data with distance along the x-axis
- **Route stats** — total distance and elevation gain/loss
- **Advanced routing options** — alternative routes, avoid motorways
- **Auto-route generation** — create loop or out-and-back routes from a single start point
- **Drag-and-drop reorder** — reorder waypoints in the sidebar
- **Undo / Redo** — full history for all edits
- **Save & load** — persist named routes to MongoDB
- **GPX export** — download routes for use in Garmin, Wahoo, Komoot, etc.
- **Mobile-first PWA** — responsive layout with bottom sheet navigation, installable as a home screen app

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Leaflet / react-leaflet, Recharts, shadcn/ui, Tailwind CSS, framer-motion |
| Backend | Python 3, FastAPI, Motor (async MongoDB) |
| Routing | [OSRM](http://project-osrm.org/) public API |
| Elevation | [Open-Meteo](https://open-meteo.com/) elevation API |
| Database | MongoDB |

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Python 3.10+
- A running MongoDB instance (local or Atlas)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn motor requests python-dotenv
```

Copy `.env.example` to `.env` and set your values:

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=waypoint_studio
CORS_ORIGINS=http://localhost:3000
```

Start the server:

```bash
uvicorn server:app --reload --port 8001
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

The app will be available at `http://localhost:3000`. It connects to the backend at the URL set in `frontend/.env` (`REACT_APP_BACKEND_URL`).

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/route/solve` | Compute routed geometry between waypoints |
| POST | `/api/route/elevation` | Fetch elevation profile for a route |
| GET | `/api/route/export-gpx` | Export a route as a GPX file |
| POST | `/api/routes/save` | Save a named route to the database |
| GET | `/api/routes` | List all saved routes |
| GET | `/api/routes/{id}` | Load a saved route by ID |
| DELETE | `/api/routes/{id}` | Delete a saved route |
| POST | `/api/route/auto-generate` | Generate a loop or out-and-back route |

## Running Tests

```bash
# Backend API tests (requires the backend to be running)
python backend_test.py

# Python unit tests
cd tests
pytest
```

## License

MIT
