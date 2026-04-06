import React from 'react';
import { MapPin, BarChart3, Wand2, Download, Menu } from 'lucide-react';

export const MobileBottomBar = ({ onOpenSheet, activeSheet, hasRoute, onExportGPX }) => {
  return (
    <div className="mobile-bottom-bar">
      <button
        className={`mobile-bottom-bar-btn ${activeSheet === 'waypoints' ? 'active' : ''}`}
        onClick={() => onOpenSheet('waypoints')}
        data-testid="mobile-tab-waypoints"
      >
        <MapPin />
        <span>Route</span>
      </button>

      <button
        className={`mobile-bottom-bar-btn ${activeSheet === 'stats' ? 'active' : ''}`}
        onClick={() => onOpenSheet('stats')}
        data-testid="mobile-tab-stats"
      >
        <BarChart3 />
        <span>Stats</span>
      </button>

      <button
        className={`mobile-bottom-bar-btn ${activeSheet === 'tools' ? 'active' : ''}`}
        onClick={() => onOpenSheet('tools')}
        data-testid="mobile-tab-tools"
      >
        <Wand2 />
        <span>Tools</span>
      </button>

      <button
        className="mobile-bottom-bar-btn"
        onClick={onExportGPX}
        disabled={!hasRoute}
        style={{ opacity: hasRoute ? 1 : 0.4 }}
        data-testid="mobile-tab-export"
      >
        <Download />
        <span>Export</span>
      </button>

      <button
        className={`mobile-bottom-bar-btn ${activeSheet === 'more' ? 'active' : ''}`}
        onClick={() => onOpenSheet('more')}
        data-testid="mobile-tab-more"
      >
        <Menu />
        <span>More</span>
      </button>
    </div>
  );
};

export default MobileBottomBar;
