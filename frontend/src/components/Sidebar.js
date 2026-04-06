import React, { useState, useRef, useCallback } from 'react';
import { Bike, Footprints, Trash2, Save, FolderOpen, Loader2, Wand2, Settings2, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import WaypointRow from './WaypointRow';
import RouteStats from './RouteStats';
import SaveRouteDialog from './SaveRouteDialog';
import LoadRouteDialog from './LoadRouteDialog';
import AutoRouteDialog from './AutoRouteDialog';

export const Sidebar = ({
  waypoints, activity, onActivityChange,
  onRemoveWaypoint, onClearWaypoints, onReorderWaypoints,
  routeStats, elevationStats, onSaveRoute, onLoadRoute,
  isRouting, routeName,
  showAlternatives, excludeMotorways, onRoutingOptionChange,
  onAutoRouteGenerated, onGPXImport,
}) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [autoRouteOpen, setAutoRouteOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const fileInputRef = useRef(null);

  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const handleDragStart = useCallback((index) => { dragIndexRef.current = index; }, []);
  const handleDragOver = useCallback((e, index) => { e.preventDefault(); setDragOverIndex(index); }, []);
  const handleDragEnd = useCallback(() => {
    const from = dragIndexRef.current; const to = dragOverIndex;
    dragIndexRef.current = null; setDragOverIndex(null);
    if (from !== null && to !== null && from !== to) onReorderWaypoints(from, to);
  }, [dragOverIndex, onReorderWaypoints]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) { onGPXImport(file); e.target.value = ''; }
  }, [onGPXImport]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRight: '1px solid var(--ws-border)' }}>
      {/* Activity Selector */}
      <div className="p-4 pb-3">
        <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--ws-text-muted)' }}>Activity Type</label>
        <div className="flex gap-2" data-testid="activity-type-selector">
          <button data-testid="activity-cycling" onClick={() => onActivityChange('cycling')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-transparent"
            style={{ background: activity === 'cycling' ? 'var(--ws-teal)' : 'var(--ws-surface-2)', color: activity === 'cycling' ? 'white' : 'var(--ws-text)', transition: 'background-color 0.15s, color 0.15s' }}>
            <Bike className="w-4 h-4" /> Road Cycling
          </button>
          <button data-testid="activity-running" onClick={() => onActivityChange('running')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-transparent"
            style={{ background: activity === 'running' ? 'var(--ws-teal)' : 'var(--ws-surface-2)', color: activity === 'running' ? 'white' : 'var(--ws-text)', transition: 'background-color 0.15s, color 0.15s' }}>
            <Footprints className="w-4 h-4" /> Running
          </button>
        </div>
      </div>

      <Separator />

      {/* Routing Options */}
      <div className="px-4 pt-3 pb-2">
        <button onClick={() => setOptionsOpen(p => !p)} className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider w-full" style={{ color: 'var(--ws-text-muted)' }} data-testid="routing-options-toggle">
          <Settings2 className="w-3.5 h-3.5" /> Routing Options
          <span className="ml-auto text-[10px]">{optionsOpen ? '\u25B2' : '\u25BC'}</span>
        </button>
        {optionsOpen && (
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--ws-text)' }}>
              <input type="checkbox" checked={showAlternatives} onChange={e => onRoutingOptionChange('alternatives', e.target.checked)} className="rounded" data-testid="option-alternatives" />
              Show alternative routes
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--ws-text)' }}>
              <input type="checkbox" checked={excludeMotorways} onChange={e => onRoutingOptionChange('excludeMotorways', e.target.checked)} className="rounded" data-testid="option-exclude-motorways" />
              Avoid motorways
            </label>
          </div>
        )}
      </div>

      <Separator />

      {/* Waypoints List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ws-text-muted)' }}>Waypoints ({waypoints.length})</label>
          {waypoints.length > 0 && (
            <TooltipProvider delayDuration={200}><Tooltip><TooltipTrigger asChild>
              <Button data-testid="clear-route-button" variant="ghost" size="sm" onClick={onClearWaypoints} className="h-7 px-2 text-xs" style={{ color: 'var(--ws-danger)' }}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
              </Button>
            </TooltipTrigger><TooltipContent>Remove all waypoints</TooltipContent></Tooltip></TooltipProvider>
          )}
        </div>

        <ScrollArea className="flex-1 px-3" data-testid="waypoint-list">
          {waypoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center" style={{ color: 'var(--ws-text-muted)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--ws-surface-2)' }}>
                <MapPinIcon />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--ws-text)' }}>No waypoints yet</p>
              <p className="text-xs mt-1">Click on the map to add waypoints</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ws-blue)' }}>Click on the route line to insert between</p>
            </div>
          ) : (
            <div className="space-y-0.5 py-1">
              {waypoints.map((wp, index) => (
                <WaypointRow key={wp.id} index={index} waypoint={wp} total={waypoints.length}
                  onRemove={() => onRemoveWaypoint(index)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragOver={dragOverIndex === index} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {isRouting && (
        <div className="px-4 py-2 flex items-center gap-2 text-xs" style={{ color: 'var(--ws-blue)' }}>
          <Loader2 className="w-3.5 h-3.5 ws-spinner" /> Calculating route...
        </div>
      )}

      <Separator />
      <RouteStats distance={routeStats.distance} duration={routeStats.duration} gain={elevationStats.gain} loss={elevationStats.loss} />
      <Separator />

      {/* Actions */}
      <div className="p-3 space-y-2" data-testid="route-actions">
        <Button data-testid="auto-route-button" size="sm" className="w-full gap-1.5" onClick={() => setAutoRouteOpen(true)} style={{ background: 'var(--ws-blue)', color: 'white' }}>
          <Wand2 className="w-3.5 h-3.5" /> Auto Route Maker
        </Button>

        <div className="flex gap-2">
          <Button data-testid="save-route-button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setSaveDialogOpen(true)} disabled={waypoints.length === 0}>
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
          <Button data-testid="load-route-button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => setLoadDialogOpen(true)}>
            <FolderOpen className="w-3.5 h-3.5" /> Load
          </Button>
        </div>

        {/* GPX Import */}
        <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleFileSelect} data-testid="gpx-import-input" />
        <Button
          data-testid="gpx-import-button"
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-3.5 h-3.5" /> Import GPX
        </Button>
      </div>

      <SaveRouteDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} onSave={onSaveRoute} defaultName={routeName} />
      <LoadRouteDialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen} onLoad={onLoadRoute} />
      <AutoRouteDialog open={autoRouteOpen} onOpenChange={setAutoRouteOpen} activity={activity} onRouteGenerated={onAutoRouteGenerated} />
    </div>
  );
};

const MapPinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ws-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default Sidebar;
