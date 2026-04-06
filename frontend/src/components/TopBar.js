import React from 'react';
import { Download, MapPin, Undo2, Redo2, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';

export const TopBar = ({
  routeName,
  onRouteNameChange,
  onExportGPX,
  hasRoute,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onToggleMobileSidebar,
}) => {
  return (
    <div
      className="h-14 px-4 flex items-center gap-3 border-b"
      style={{
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(12px)',
        borderColor: 'var(--ws-border)',
      }}
    >
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 md:hidden shrink-0"
        onClick={onToggleMobileSidebar}
        style={{ color: 'var(--ws-teal)' }}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--ws-teal)' }}
        >
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <span
          className="text-lg font-semibold tracking-tight hidden sm:block"
          style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Waypoint Studio
        </span>
      </div>

      {/* Route Name */}
      <div className="flex-1 flex justify-center">
        <input
          data-testid="route-name-input"
          type="text"
          value={routeName}
          onChange={(e) => onRouteNameChange(e.target.value)}
          className="text-center text-sm font-medium px-3 py-1.5 rounded-lg border bg-transparent max-w-xs w-full"
          style={{
            borderColor: 'var(--ws-border)',
            color: 'var(--ws-text)',
            fontFamily: 'Space Grotesk, sans-serif',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => {
            e.target.select();
            e.target.style.borderColor = 'var(--ws-blue)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--ws-border)';
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <TooltipProvider delayDuration={200}>
          {/* Undo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="undo-button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onUndo}
                disabled={!canUndo}
                style={{ color: canUndo ? 'var(--ws-teal)' : undefined }}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          {/* Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="redo-button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0"
                onClick={onRedo}
                disabled={!canRedo}
                style={{ color: canRedo ? 'var(--ws-teal)' : undefined }}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Export GPX */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-testid="export-gpx-button"
                size="sm"
                onClick={onExportGPX}
                disabled={!hasRoute}
                className="gap-1.5"
                style={{
                  background: hasRoute ? 'var(--ws-green)' : undefined,
                  color: hasRoute ? 'white' : undefined,
                }}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export GPX</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download route as GPX file</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default TopBar;
