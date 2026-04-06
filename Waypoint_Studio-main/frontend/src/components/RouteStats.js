import React from 'react';
import { Route, Clock, TrendingUp, TrendingDown } from 'lucide-react';

export const RouteStats = ({ distance, duration, gain, loss }) => {
  const formatDistance = (meters) => {
    if (!meters) return '0 km';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  return (
    <div className="p-3" data-testid="route-stats">
      <label
        className="text-xs font-medium uppercase tracking-wider mb-2 block"
        style={{ color: 'var(--ws-text-muted)' }}
      >
        Route Stats
      </label>
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={<Route className="w-3.5 h-3.5" />}
          label="Distance"
          value={formatDistance(distance)}
          testId="stats-distance"
        />
        <StatCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Duration"
          value={formatDuration(duration)}
          testId="stats-duration"
        />
        <StatCard
          icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--ws-green)' }} />}
          label="Elev. Gain"
          value={`${Math.round(gain || 0)} m`}
          testId="stats-elevation-gain"
        />
        <StatCard
          icon={<TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--ws-danger)' }} />}
          label="Elev. Loss"
          value={`${Math.round(loss || 0)} m`}
          testId="stats-elevation-loss"
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, testId }) => (
  <div
    data-testid={testId}
    className="rounded-xl p-2.5 border"
    style={{
      background: 'var(--ws-surface-2)',
      borderColor: 'var(--ws-border)',
    }}
  >
    <div className="flex items-center gap-1.5 mb-1">
      <span style={{ color: 'var(--ws-teal)' }}>{icon}</span>
      <span className="text-xs" style={{ color: 'var(--ws-text-muted)' }}>
        {label}
      </span>
    </div>
    <div
      className="stat-value text-base"
      style={{ color: 'var(--ws-text)' }}
    >
      {value}
    </div>
  </div>
);

export default RouteStats;
