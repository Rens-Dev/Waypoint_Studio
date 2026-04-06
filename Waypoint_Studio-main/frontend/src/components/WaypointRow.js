import React from 'react';
import { X, GripVertical } from 'lucide-react';
import { Button } from './ui/button';

export const WaypointRow = ({
  index,
  waypoint,
  total,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
}) => {
  const isStart = index === 0;
  const isEnd = index === total - 1 && total > 1;

  const getLabel = () => {
    if (isStart) return 'S';
    if (isEnd) return 'E';
    return index + 1;
  };

  const getBadgeColor = () => {
    if (isStart) return 'var(--ws-green)';
    if (isEnd) return 'var(--ws-danger)';
    return 'var(--ws-teal)';
  };

  return (
    <div
      data-testid={`waypoint-row-${index}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        // make the ghost semi-transparent
        if (e.currentTarget) {
          e.currentTarget.style.opacity = '0.5';
        }
        onDragStart && onDragStart();
      }}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1';
        onDragEnd && onDragEnd();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver && onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.style.opacity = '1';
        onDragEnd && onDragEnd();
      }}
      className="flex items-center gap-2 rounded-lg px-2 py-2 group"
      style={{
        transition: 'background-color 0.15s, border-color 0.15s',
        borderTop: isDragOver ? '2px solid var(--ws-blue)' : '2px solid transparent',
        cursor: 'default',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ws-surface-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Drag handle */}
      <div
        data-testid={`waypoint-drag-handle-${index}`}
        className="text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        style={{ transition: 'opacity 0.15s' }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Index badge */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
        style={{ background: getBadgeColor(), fontFamily: 'Space Grotesk, sans-serif' }}
      >
        {getLabel()}
      </div>

      {/* Coordinates */}
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-mono truncate"
          style={{ color: 'var(--ws-text)', fontFamily: 'IBM Plex Mono, monospace' }}
        >
          {waypoint.lat.toFixed(5)}, {waypoint.lng.toFixed(5)}
        </div>
        <div className="text-xs" style={{ color: 'var(--ws-text-muted)' }}>
          {isStart ? 'Start' : isEnd ? 'End' : `Waypoint ${index + 1}`}
        </div>
      </div>

      {/* Delete */}
      <Button
        data-testid={`waypoint-delete-button-${index}`}
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
        style={{ transition: 'opacity 0.15s', color: 'var(--ws-danger)' }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default WaypointRow;
