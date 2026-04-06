import React, { useRef, useState } from 'react';
import { Bike, Footprints, Trash2, Save, FolderOpen, Wand2, Upload, Settings2, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import WaypointRow from './WaypointRow';
import RouteStats from './RouteStats';
import SaveRouteDialog from './SaveRouteDialog';
import LoadRouteDialog from './LoadRouteDialog';
import AutoRouteDialog from './AutoRouteDialog';

export const MobileBottomSheet = ({
  sheet, onClose,
  waypoints, activity, onActivityChange,
  onRemoveWaypoint, onClearWaypoints,
  routeStats, elevationStats,
  onSaveRoute, onLoadRoute,
  isRouting, routeName,
  showAlternatives, excludeMotorways, onRoutingOptionChange,
  onAutoRouteGenerated, onGPXImport,
}) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [autoRouteOpen, setAutoRouteOpen] = useState(false);
  const fileInputRef = useRef(null);

  const isOpen = !!sheet;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) { onGPXImport(file); e.target.value = ''; onClose(); }
  };

  return (
    <>
      {/* Overlay */}
      <div className={`mobile-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      {/* Sheet */}
      <div className={`mobile-bottom-sheet ${isOpen ? 'open' : ''}`} data-testid="mobile-bottom-sheet">
        <div className="mobile-sheet-handle" onClick={onClose} />

        {/* WAYPOINTS SHEET */}
        {sheet === 'waypoints' && (
          <div className="p-4 pt-0" style={{ maxHeight: '75dvh', overflow: 'auto' }}>
            {/* Activity selector */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => onActivityChange('cycling')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-transparent"
                style={{ background: activity === 'cycling' ? 'var(--ws-teal)' : 'var(--ws-surface-2)', color: activity === 'cycling' ? 'white' : 'var(--ws-text)' }}>
                <Bike className="w-4 h-4" /> Cycling
              </button>
              <button onClick={() => onActivityChange('running')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-transparent"
                style={{ background: activity === 'running' ? 'var(--ws-teal)' : 'var(--ws-surface-2)', color: activity === 'running' ? 'white' : 'var(--ws-text)' }}>
                <Footprints className="w-4 h-4" /> Running
              </button>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-muted)' }}>Waypoints ({waypoints.length})</span>
              {waypoints.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearWaypoints} className="h-7 px-2 text-xs" style={{ color: 'var(--ws-danger)' }}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>

            {isRouting && (
              <div className="flex items-center gap-2 text-xs py-2" style={{ color: 'var(--ws-blue)' }}>
                <Loader2 className="w-3.5 h-3.5 ws-spinner" /> Calculating route...
              </div>
            )}

            {waypoints.length === 0 ? (
              <div className="text-center py-6" style={{ color: 'var(--ws-text-muted)' }}>
                <p className="text-sm">Tap the map to add waypoints</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {waypoints.map((wp, index) => (
                  <WaypointRow key={wp.id} index={index} waypoint={wp} total={waypoints.length}
                    onRemove={() => onRemoveWaypoint(index)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATS SHEET */}
        {sheet === 'stats' && (
          <div className="p-4 pt-0">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}>Route Statistics</h3>
            <RouteStats distance={routeStats.distance} duration={routeStats.duration} gain={elevationStats.gain} loss={elevationStats.loss} />
          </div>
        )}

        {/* TOOLS SHEET */}
        {sheet === 'tools' && (
          <div className="p-4 pt-0 space-y-3">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}>Tools</h3>
            <Button size="sm" className="w-full gap-1.5 h-11" onClick={() => { setAutoRouteOpen(true); }} style={{ background: 'var(--ws-blue)', color: 'white' }}>
              <Wand2 className="w-4 h-4" /> Auto Route Maker
            </Button>
            <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleFileSelect} />
            <Button variant="outline" size="sm" className="w-full gap-1.5 h-11" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" /> Import GPX File
            </Button>

            <Separator className="my-3" />
            <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-muted)' }}>Routing Options</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer py-1" style={{ color: 'var(--ws-text)' }}>
              <input type="checkbox" checked={showAlternatives} onChange={e => onRoutingOptionChange('alternatives', e.target.checked)} className="rounded w-4 h-4" />
              Show alternatives
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer py-1" style={{ color: 'var(--ws-text)' }}>
              <input type="checkbox" checked={excludeMotorways} onChange={e => onRoutingOptionChange('excludeMotorways', e.target.checked)} className="rounded w-4 h-4" />
              Avoid motorways
            </label>
          </div>
        )}

        {/* MORE SHEET */}
        {sheet === 'more' && (
          <div className="p-4 pt-0 space-y-3">
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}>More</h3>
            <Button variant="outline" size="sm" className="w-full gap-1.5 h-11" onClick={() => { setSaveDialogOpen(true); }} disabled={waypoints.length === 0}>
              <Save className="w-4 h-4" /> Save Route
            </Button>
            <Button variant="outline" size="sm" className="w-full gap-1.5 h-11" onClick={() => { setLoadDialogOpen(true); }}>
              <FolderOpen className="w-4 h-4" /> Load Route
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs (render outside sheet) */}
      <SaveRouteDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} onSave={onSaveRoute} defaultName={routeName} />
      <LoadRouteDialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen} onLoad={(r) => { onLoadRoute(r); onClose(); }} />
      <AutoRouteDialog open={autoRouteOpen} onOpenChange={setAutoRouteOpen} activity={activity} onRouteGenerated={(d) => { onAutoRouteGenerated(d); onClose(); }} />
    </>
  );
};

export default MobileBottomSheet;
