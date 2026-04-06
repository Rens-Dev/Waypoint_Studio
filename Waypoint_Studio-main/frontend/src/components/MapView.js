import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMapEvents, Marker, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, LocateFixed, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createWaypointIcon = (index, total) => {
  const isStart = index === 0;
  const isEnd = index === total - 1 && total > 1;
  let bg = '#0B4F6C';
  let label = index + 1;
  if (isStart) { bg = '#20BF55'; label = 'S'; }
  if (isEnd) { bg = '#E5484D'; label = 'E'; }
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:${bg};color:white;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(11,79,108,0.35);cursor:grab;">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Helper: find closest segment between consecutive waypoints
function findInsertIndex(clickLat, clickLng, waypoints) {
  if (waypoints.length < 2) return waypoints.length;
  let bestIdx = 1;
  let bestDist = Infinity;
  for (let i = 0; i < waypoints.length - 1; i++) {
    // Distance from click to the midpoint of each segment
    const midLat = (waypoints[i].lat + waypoints[i + 1].lat) / 2;
    const midLng = (waypoints[i].lng + waypoints[i + 1].lng) / 2;
    const dist = Math.sqrt((clickLat - midLat) ** 2 + (clickLng - midLng) ** 2);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i + 1;
    }
  }
  return bestIdx;
}

const MapEventsHandler = ({ onMapClick, onMouseMove }) => {
  useMapEvents({
    click(e) {
      if (e.originalEvent._stopped) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    mousemove(e) { onMouseMove(e.latlng); },
    mouseout() { onMouseMove(null); },
  });
  return null;
};

const DraggableMarker = ({ position, index, total, onDrag }) => {
  const markerRef = useRef(null);
  const icon = useMemo(() => createWaypointIcon(index, total), [index, total]);
  const eventHandlers = useMemo(() => ({
    dragend() {
      const marker = markerRef.current;
      if (marker) { const { lat, lng } = marker.getLatLng(); onDrag(index, lat, lng); }
    },
  }), [index, onDrag]);
  return <Marker draggable eventHandlers={eventHandlers} position={position} ref={markerRef} icon={icon} />;
};

const MapControls = ({ routeCoordinates }) => {
  const map = useMap();
  const controlRef = useRef(null);
  useEffect(() => {
    if (controlRef.current) {
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, []);
  return (
    <div ref={controlRef} className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
      <div className="rounded-xl border p-1 flex flex-col gap-0.5" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderColor: 'var(--ws-border)', boxShadow: 'var(--ws-shadow-tight)' }}>
        <TooltipProvider delayDuration={200}>
          <Tooltip><TooltipTrigger asChild><Button data-testid="zoom-in-button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => map.zoomIn()} style={{ color: 'var(--ws-teal)' }}><ZoomIn className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">Zoom In</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button data-testid="zoom-out-button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => map.zoomOut()} style={{ color: 'var(--ws-teal)' }}><ZoomOut className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">Zoom Out</TooltipContent></Tooltip>
          <div className="h-px mx-1" style={{ background: 'var(--ws-border)' }} />
          <Tooltip><TooltipTrigger asChild><Button data-testid="locate-button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => map.locate({ setView: true, maxZoom: 14 })} style={{ color: 'var(--ws-teal)' }}><LocateFixed className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">My Location</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button data-testid="fit-route-button" variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => { if (routeCoordinates?.length > 0) map.fitBounds(L.latLngBounds(routeCoordinates.map(c => [c[1], c[0]])), { padding: [50, 50] }); }} style={{ color: 'var(--ws-teal)' }}><Maximize2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent side="left">Fit Route</TooltipContent></Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

const HoveredPointMarker = ({ hoveredProfileIndex, elevationProfile }) => {
  if (hoveredProfileIndex === null || !elevationProfile?.[hoveredProfileIndex]) return null;
  const point = elevationProfile[hoveredProfileIndex];
  return <CircleMarker center={[point.lat, point.lng]} radius={6} pathOptions={{ color: '#01BAEF', fillColor: '#01BAEF', fillOpacity: 1, weight: 3 }} />;
};

const SnapPreviewLine = ({ lastWaypoint, mousePosition }) => {
  if (!lastWaypoint || !mousePosition) return null;
  return <Polyline positions={[[lastWaypoint.lat, lastWaypoint.lng], [mousePosition.lat, mousePosition.lng]]} pathOptions={{ color: '#01BAEF', weight: 3, opacity: 0.6, dashArray: '8, 8' }} />;
};

const AlternativeRoutes = ({ alternatives, onSelectAlternative }) => {
  if (!alternatives?.length) return null;
  return alternatives.map((alt, idx) => (
    <Polyline key={`alt-${idx}`} positions={alt.coordinates.map(c => [c[1], c[0]])} pathOptions={{ color: '#757575', weight: 3, opacity: 0.5, dashArray: '6, 6' }} eventHandlers={{ click: () => onSelectAlternative?.(idx) }} />
  ));
};

// Clickable route polyline for insert-between
const ClickableRoutePolyline = ({ positions, onRouteClick }) => {
  if (!positions || positions.length === 0) return null;
  return (
    <>
      {/* White outline */}
      <Polyline positions={positions} pathOptions={{ color: 'rgba(251,251,255,0.9)', weight: 7, opacity: 0.9 }} />
      {/* Main colored line */}
      <Polyline positions={positions} pathOptions={{ color: '#0B4F6C', weight: 4, opacity: 0.9 }} />
      {/* Invisible fat clickable overlay */}
      <Polyline
        positions={positions}
        pathOptions={{ color: 'transparent', weight: 20, opacity: 0 }}
        eventHandlers={{
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            if (onRouteClick) {
              onRouteClick(e.latlng.lat, e.latlng.lng);
            }
          },
        }}
      />
    </>
  );
};

export const MapView = ({
  waypoints, routeCoordinates, activity,
  onMapClick, onWaypointDrag,
  hoveredProfileIndex, elevationProfile,
  isRouting, alternatives, onSelectAlternative,
  onInsertWaypoint,
}) => {
  const mapRef = useRef(null);
  const [mousePosition, setMousePosition] = useState(null);
  const handleMouseMove = useCallback((latlng) => setMousePosition(latlng), []);
  const routeLatLngs = useMemo(() => routeCoordinates.map(c => [c[1], c[0]]), [routeCoordinates]);
  const lastWaypoint = waypoints.length > 0 ? waypoints[waypoints.length - 1] : null;

  const handleRouteClick = useCallback((lat, lng) => {
    if (onInsertWaypoint && waypoints.length >= 2) {
      const insertIdx = findInsertIndex(lat, lng, waypoints);
      onInsertWaypoint(insertIdx, lat, lng);
    }
  }, [onInsertWaypoint, waypoints]);

  return (
    <div className="w-full h-full relative">
      <MapContainer center={[48.8566, 2.3522]} zoom={13} className="w-full h-full" zoomControl={false} attributionControl={true} ref={mapRef}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEventsHandler onMapClick={onMapClick} onMouseMove={handleMouseMove} />
        <MapControls routeCoordinates={routeCoordinates} />

        <AlternativeRoutes alternatives={alternatives} onSelectAlternative={onSelectAlternative} />

        {/* Clickable route polyline with insert-between */}
        <ClickableRoutePolyline positions={routeLatLngs} onRouteClick={handleRouteClick} />

        <SnapPreviewLine lastWaypoint={lastWaypoint} mousePosition={mousePosition} />
        {waypoints.map((wp, index) => <DraggableMarker key={wp.id} position={[wp.lat, wp.lng]} index={index} total={waypoints.length} onDrag={onWaypointDrag} />)}
        <HoveredPointMarker hoveredProfileIndex={hoveredProfileIndex} elevationProfile={elevationProfile} />
      </MapContainer>

      {waypoints.length === 0 && (
        <div className="map-empty-state" data-testid="map-empty-state">
          <div className="rounded-2xl px-6 py-4 text-center" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', boxShadow: 'var(--ws-shadow)', border: '1px solid var(--ws-border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}>Click on the map to add your first waypoint</p>
            <p className="text-xs mt-1" style={{ color: 'var(--ws-text-muted)' }}>Add at least 2 points to create a route</p>
          </div>
        </div>
      )}

      {isRouting && (
        <div className="absolute top-3 left-3 z-[1000] rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', boxShadow: 'var(--ws-shadow-tight)', border: '1px solid var(--ws-border)' }}>
          <div className="w-4 h-4 border-2 rounded-full ws-spinner" style={{ borderColor: 'var(--ws-blue)', borderTopColor: 'transparent' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--ws-teal)' }}>Routing...</span>
        </div>
      )}
    </div>
  );
};

export default MapView;
