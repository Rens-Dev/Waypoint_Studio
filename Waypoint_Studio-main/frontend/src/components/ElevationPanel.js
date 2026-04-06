import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChevronUp, ChevronDown, Mountain } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="ws-tooltip"
        data-testid="elevation-tooltip"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--ws-border)',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: 'var(--ws-shadow-tight)',
        }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--ws-text)' }}>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {data.elevation.toFixed(1)}m
          </span>
          <span style={{ color: 'var(--ws-text-muted)' }}> elevation</span>
        </p>
        <p className="text-xs" style={{ color: 'var(--ws-text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
          {data.distance.toFixed(2)} km from start
        </p>
      </div>
    );
  }
  return null;
};

export const ElevationPanel = ({ profile, isOpen, onToggle, onHover, elevationStats }) => {
  const hasData = profile && profile.length > 0;
  // Delay chart render slightly so ResponsiveContainer can measure after panel expands
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    if (isOpen && hasData) {
      const timer = setTimeout(() => setChartReady(true), 350);
      return () => clearTimeout(timer);
    } else {
      setChartReady(false);
    }
  }, [isOpen, hasData]);

  return (
    <div
      className="elevation-panel"
      data-testid="elevation-panel"
      style={{
        height: isOpen ? '220px' : '44px',
        overflow: 'hidden',
        transition: 'height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* Handle */}
      <div
        data-testid="elevation-panel-toggle"
        className="flex items-center justify-center cursor-pointer py-2"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div className="elevation-handle" />
          {hasData && (
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ws-text-muted)' }}>
              <Mountain className="w-3.5 h-3.5" style={{ color: 'var(--ws-teal)' }} />
              <span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--ws-text)' }}>
                  {elevationStats?.min || 0}m
                </span>
                {' \u2013 '}
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--ws-text)' }}>
                  {elevationStats?.max || 0}m
                </span>
              </span>
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </div>
          )}
          {!hasData && (
            <span className="text-xs" style={{ color: 'var(--ws-text-muted)' }}>
              Elevation Profile
            </span>
          )}
        </div>
      </div>

      {/* Chart area \u2013 always in DOM when data exists so ResponsiveContainer can size */}
      {hasData && (
        <div
          className="px-4 pb-3"
          data-testid="elevation-chart"
          style={{
            height: '176px',
            opacity: chartReady ? 1 : 0,
            transition: 'opacity 0.2s ease-in',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={profile}
              onMouseMove={(e) => {
                if (e && e.activeTooltipIndex !== undefined) {
                  onHover(e.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => onHover(null)}
            >
              <defs>
                <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#20BF55" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#20BF55" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(11, 79, 108, 0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="distance"
                tickFormatter={(v) => `${v.toFixed(1)} km`}
                fontSize={10}
                stroke="#757575"
                axisLine={false}
                tickLine={false}
                fontFamily="IBM Plex Mono, monospace"
              />
              <YAxis
                tickFormatter={(v) => `${v}m`}
                fontSize={10}
                stroke="#757575"
                axisLine={false}
                tickLine={false}
                fontFamily="IBM Plex Mono, monospace"
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="#0B4F6C"
                strokeWidth={2.25}
                fill="url(#elevGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: '#01BAEF',
                  strokeWidth: 2,
                  fill: 'white',
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No data state */}
      {isOpen && !hasData && (
        <div className="flex items-center justify-center h-32 text-sm" style={{ color: 'var(--ws-text-muted)' }}>
          Add waypoints to see elevation profile
        </div>
      )}
    </div>
  );
};

export default ElevationPanel;
