import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import ElevationPanel from './components/ElevationPanel';
import MobileBottomBar from './components/MobileBottomBar';
import MobileBottomSheet from './components/MobileBottomSheet';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [waypoints, setWaypoints] = useState([]);
  const [activity, setActivity] = useState('cycling');
  const [routeName, setRouteName] = useState('Untitled Route');
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 });
  const [alternatives, setAlternatives] = useState([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [excludeMotorways, setExcludeMotorways] = useState(false);
  const [elevationProfile, setElevationProfile] = useState([]);
  const [elevationStats, setElevationStats] = useState({ gain: 0, loss: 0, min: 0, max: 0 });
  const [elevationPanelOpen, setElevationPanelOpen] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [hoveredProfileIndex, setHoveredProfileIndex] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const routeTimeoutRef = useRef(null);

  // Mobile state
  const [mobileSheet, setMobileSheet] = useState(null);

  const pushUndo = useCallback((cur) => { setUndoStack(us => [...us, cur]); setRedoStack([]); }, []);
  const clearRouteData = useCallback(() => {
    setRouteCoordinates([]); setRouteStats({ distance: 0, duration: 0 });
    setElevationProfile([]); setElevationStats({ gain: 0, loss: 0, min: 0, max: 0 });
    setElevationPanelOpen(false); setAlternatives([]);
  }, []);

  const solveRoute = useCallback(async (wps, act, opts = {}) => {
    if (wps.length < 2) { clearRouteData(); return; }
    const altFlag = opts.showAlternatives ?? showAlternatives;
    const exclFlag = opts.excludeMotorways ?? excludeMotorways;
    setIsRouting(true);
    try {
      const exclude = exclFlag ? ['motorway'] : undefined;
      const routeRes = await axios.post(`${BACKEND_URL}/api/route/solve`, {
        waypoints: wps.map(wp => [wp.lng, wp.lat]), activity: act, alternatives: altFlag, exclude,
      });
      if (routeRes.data.success) {
        setRouteCoordinates(routeRes.data.coordinates);
        setRouteStats({ distance: routeRes.data.distance, duration: routeRes.data.duration });
        setAlternatives(routeRes.data.alternatives || []);
        try {
          const elevRes = await axios.post(`${BACKEND_URL}/api/elevation`, { coordinates: routeRes.data.coordinates });
          if (elevRes.data.success) {
            setElevationProfile(elevRes.data.profile);
            setElevationStats({ gain: elevRes.data.gain, loss: elevRes.data.loss, min: elevRes.data.min_elevation, max: elevRes.data.max_elevation });
            setElevationPanelOpen(true);
          }
        } catch {}
      }
    } catch (err) { toast.error('Failed to calculate route.'); } finally { setIsRouting(false); }
  }, [clearRouteData, showAlternatives, excludeMotorways]);

  const debouncedSolveRoute = useCallback((wps, act, opts) => {
    if (routeTimeoutRef.current) clearTimeout(routeTimeoutRef.current);
    routeTimeoutRef.current = setTimeout(() => solveRoute(wps, act, opts), 300);
  }, [solveRoute]);

  const addWaypoint = useCallback((lat, lng) => {
    setWaypoints(prev => { pushUndo(prev); const n = [...prev, { lat, lng, id: Date.now() + Math.random() }]; debouncedSolveRoute(n, activity); return n; });
  }, [activity, debouncedSolveRoute, pushUndo]);

  const insertWaypoint = useCallback((index, lat, lng) => {
    setWaypoints(prev => { pushUndo(prev); const n = [...prev]; n.splice(index, 0, { lat, lng, id: Date.now() + Math.random() }); debouncedSolveRoute(n, activity); return n; });
    toast.success('Waypoint inserted');
  }, [activity, debouncedSolveRoute, pushUndo]);

  const moveWaypoint = useCallback((index, lat, lng) => {
    setWaypoints(prev => { pushUndo(prev); const n = [...prev]; n[index] = { ...n[index], lat, lng }; debouncedSolveRoute(n, activity); return n; });
  }, [activity, debouncedSolveRoute, pushUndo]);

  const removeWaypoint = useCallback((index) => {
    setWaypoints(prev => { pushUndo(prev); const n = prev.filter((_, i) => i !== index); debouncedSolveRoute(n, activity); return n; });
  }, [activity, debouncedSolveRoute, pushUndo]);

  const clearWaypoints = useCallback(() => { pushUndo(waypoints); setWaypoints([]); clearRouteData(); }, [waypoints, pushUndo, clearRouteData]);

  const reorderWaypoints = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setWaypoints(prev => { pushUndo(prev); const n = [...prev]; const [m] = n.splice(fromIndex, 1); n.splice(toIndex, 0, m); debouncedSolveRoute(n, activity); return n; });
  }, [activity, debouncedSolveRoute, pushUndo]);

  const selectAlternative = useCallback((altIdx) => {
    if (!alternatives[altIdx]) return;
    setRouteCoordinates(alternatives[altIdx].coordinates);
    setRouteStats({ distance: alternatives[altIdx].distance, duration: alternatives[altIdx].duration });
    setAlternatives([]);
    axios.post(`${BACKEND_URL}/api/elevation`, { coordinates: alternatives[altIdx].coordinates })
      .then(r => { if (r.data.success) { setElevationProfile(r.data.profile); setElevationStats({ gain: r.data.gain, loss: r.data.loss, min: r.data.min_elevation, max: r.data.max_elevation }); } }).catch(() => {});
  }, [alternatives]);

  const handleUndo = useCallback(() => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(rs => [...rs, waypoints]); setUndoStack(us => us.slice(0, -1)); setWaypoints(prev);
    if (prev.length >= 2) debouncedSolveRoute(prev, activity); else clearRouteData();
  }, [undoStack, waypoints, activity, debouncedSolveRoute, clearRouteData]);

  const handleRedo = useCallback(() => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(us => [...us, waypoints]); setRedoStack(rs => rs.slice(0, -1)); setWaypoints(next);
    if (next.length >= 2) debouncedSolveRoute(next, activity); else clearRouteData();
  }, [redoStack, waypoints, activity, debouncedSolveRoute, clearRouteData]);

  const handleActivityChange = useCallback((a) => { setActivity(a); if (waypoints.length >= 2) debouncedSolveRoute(waypoints, a); }, [waypoints, debouncedSolveRoute]);

  const handleRoutingOptionChange = useCallback((opt, val) => {
    if (opt === 'alternatives') { setShowAlternatives(val); if (waypoints.length >= 2) debouncedSolveRoute(waypoints, activity, { showAlternatives: val }); }
    else if (opt === 'excludeMotorways') { setExcludeMotorways(val); if (waypoints.length >= 2) debouncedSolveRoute(waypoints, activity, { excludeMotorways: val }); }
  }, [waypoints, activity, debouncedSolveRoute]);

  const handleAutoRouteGenerated = useCallback((data) => {
    if (!data.waypoints || !data.coordinates) return;
    const nw = data.waypoints.map((wp, i) => ({ lng: wp[0], lat: wp[1], id: Date.now() + i }));
    setUndoStack([]); setRedoStack([]); setWaypoints(nw);
    setRouteCoordinates(data.coordinates); setRouteStats({ distance: data.distance, duration: data.duration }); setAlternatives([]);
    axios.post(`${BACKEND_URL}/api/elevation`, { coordinates: data.coordinates })
      .then(r => { if (r.data.success) { setElevationProfile(r.data.profile); setElevationStats({ gain: r.data.gain, loss: r.data.loss, min: r.data.min_elevation, max: r.data.max_elevation }); setElevationPanelOpen(true); } }).catch(() => {});
  }, []);

  const handleGPXImport = useCallback(async (file) => {
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/gpx/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        const { waypoints: wps, name, activity: act, track_points } = res.data;
        const loadedWps = wps.map((wp, i) => ({ lng: wp[0], lat: wp[1], id: Date.now() + i }));
        setWaypoints(loadedWps); setActivity(act || 'cycling'); setRouteName(name || 'Imported Route');
        setUndoStack([]); setRedoStack([]);
        if (track_points?.length) setRouteCoordinates(track_points);
        solveRoute(loadedWps, act || 'cycling');
        toast.success(`Imported: ${name || 'GPX Route'}`);
      }
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to import GPX'); }
  }, [solveRoute]);

  const exportGPX = useCallback(async () => {
    if (!routeCoordinates.length) { toast.error('No route to export.'); return; }
    try {
      const response = await axios.post(`${BACKEND_URL}/api/gpx/export`, {
        coordinates: routeCoordinates, elevations: elevationProfile.map(p => p.elevation),
        waypoints: waypoints.map(wp => [wp.lng, wp.lat]), name: routeName, activity,
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `${routeName.replace(/\s+/g, '_')}.gpx`);
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
      toast.success('GPX exported!');
    } catch { toast.error('Failed to export GPX'); }
  }, [routeCoordinates, elevationProfile, waypoints, routeName, activity]);

  const saveRoute = useCallback(async (name) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/routes`, {
        name: name || routeName, waypoints: waypoints.map(wp => [wp.lng, wp.lat]),
        activity, route_coordinates: routeCoordinates, distance: routeStats.distance,
        duration: routeStats.duration, elevation_gain: elevationStats.gain, elevation_loss: elevationStats.loss,
      });
      setRouteName(name || routeName); toast.success('Route saved!'); return res.data;
    } catch { toast.error('Failed to save route'); }
  }, [waypoints, activity, routeCoordinates, routeStats, elevationStats, routeName]);

  const loadRoute = useCallback(async (routeData) => {
    const lw = routeData.waypoints.map((wp, i) => ({ lng: wp[0], lat: wp[1], id: Date.now() + i }));
    setWaypoints(lw); setActivity(routeData.activity || 'cycling'); setRouteName(routeData.name || 'Loaded Route');
    setUndoStack([]); setRedoStack([]);
    if (routeData.route_coordinates) setRouteCoordinates(routeData.route_coordinates);
    if (routeData.distance || routeData.duration) setRouteStats({ distance: routeData.distance || 0, duration: routeData.duration || 0 });
    solveRoute(lw, routeData.activity || 'cycling');
  }, [solveRoute]);

  const handleOpenSheet = useCallback((sheet) => {
    setMobileSheet(prev => prev === sheet ? null : sheet);
  }, []);

  return (
    <div className="app-shell">
      <Toaster position="top-center" richColors />
      <div className="app-topbar">
        <TopBar routeName={routeName} onRouteNameChange={setRouteName} onExportGPX={exportGPX}
          hasRoute={routeCoordinates.length > 0} onUndo={handleUndo} canUndo={undoStack.length > 0}
          onRedo={handleRedo} canRedo={redoStack.length > 0}
          onToggleMobileSidebar={() => handleOpenSheet('waypoints')} />
      </div>

      {/* Desktop sidebar */}
      <div className="app-sidebar">
        <Sidebar waypoints={waypoints} activity={activity} onActivityChange={handleActivityChange}
          onRemoveWaypoint={removeWaypoint} onClearWaypoints={clearWaypoints}
          onReorderWaypoints={reorderWaypoints} routeStats={routeStats} elevationStats={elevationStats}
          onSaveRoute={saveRoute} onLoadRoute={loadRoute} isRouting={isRouting} routeName={routeName}
          showAlternatives={showAlternatives} excludeMotorways={excludeMotorways}
          onRoutingOptionChange={handleRoutingOptionChange} onAutoRouteGenerated={handleAutoRouteGenerated}
          onGPXImport={handleGPXImport} />
      </div>

      <div className="app-map-area">
        <MapView waypoints={waypoints} routeCoordinates={routeCoordinates} activity={activity}
          onMapClick={addWaypoint} onWaypointDrag={moveWaypoint}
          hoveredProfileIndex={hoveredProfileIndex} elevationProfile={elevationProfile}
          isRouting={isRouting} alternatives={alternatives} onSelectAlternative={selectAlternative}
          onInsertWaypoint={insertWaypoint} />
        <ElevationPanel profile={elevationProfile} isOpen={elevationPanelOpen}
          onToggle={() => setElevationPanelOpen(prev => !prev)}
          onHover={setHoveredProfileIndex} elevationStats={elevationStats} />
      </div>

      {/* Mobile bottom bar */}
      <MobileBottomBar
        onOpenSheet={handleOpenSheet}
        activeSheet={mobileSheet}
        hasRoute={routeCoordinates.length > 0}
        onExportGPX={exportGPX}
      />

      {/* Mobile bottom sheet */}
      <MobileBottomSheet
        sheet={mobileSheet}
        onClose={() => setMobileSheet(null)}
        waypoints={waypoints} activity={activity}
        onActivityChange={handleActivityChange}
        onRemoveWaypoint={removeWaypoint}
        onClearWaypoints={clearWaypoints}
        routeStats={routeStats} elevationStats={elevationStats}
        onSaveRoute={saveRoute} onLoadRoute={loadRoute}
        isRouting={isRouting} routeName={routeName}
        showAlternatives={showAlternatives} excludeMotorways={excludeMotorways}
        onRoutingOptionChange={handleRoutingOptionChange}
        onAutoRouteGenerated={handleAutoRouteGenerated}
        onGPXImport={handleGPXImport}
      />
    </div>
  );
}

export default App;
