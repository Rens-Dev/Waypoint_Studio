import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Wand2, Loader2, RotateCw, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const AutoRouteDialog = ({ open, onOpenChange, activity, onRouteGenerated }) => {
  const [distance, setDistance] = useState([10]);
  const [routeType, setRouteType] = useState('loop');
  const [generating, setGenerating] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [step, setStep] = useState('pick'); // 'pick' or 'configure'

  const handleGenerate = async () => {
    if (!startPoint) {
      toast.error('Please pick a start point on the map first.');
      return;
    }
    setGenerating(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/route/auto`, {
        start_lat: startPoint.lat,
        start_lng: startPoint.lng,
        target_distance_km: distance[0],
        activity,
        route_type: routeType,
      });
      if (res.data.success) {
        onRouteGenerated(res.data);
        onOpenChange(false);
        toast.success(`Auto route generated! (~${(res.data.distance / 1000).toFixed(1)} km)`);
        // Reset
        setStep('pick');
        setStartPoint(null);
      }
    } catch (err) {
      console.error('Auto route failed:', err);
      toast.error(err.response?.data?.detail || 'Failed to generate route. Try a different location.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setStartPoint({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setStep('configure');
          toast.success('Location detected!');
        },
        () => {
          toast.error('Could not get location. Please enter coordinates.');
        }
      );
    } else {
      toast.error('Geolocation not supported.');
    }
  };

  const handleMapCenter = () => {
    // Default to Paris center; in a real app we'd get the map center
    setStartPoint({ lat: 48.8566, lng: 2.3522 });
    setStep('configure');
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) { setStep('pick'); setStartPoint(null); } }}>
      <DialogContent data-testid="auto-route-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}>
            <Wand2 className="w-5 h-5 inline-block mr-2" style={{ verticalAlign: '-3px' }} />
            Auto Route Maker
          </DialogTitle>
          <DialogDescription>
            {step === 'pick'
              ? 'Choose a starting point for your auto-generated route.'
              : 'Configure your route preferences.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pick' && (
          <div className="py-4 space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleUseCurrentLocation}
            >
              <LocateIcon />
              Use my current location
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleMapCenter}
            >
              <MapCenterIcon />
              Use map center (Paris)
            </Button>
            <div className="pt-2">
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--ws-text-muted)' }}>Or enter coordinates manually</label>
              <div className="flex gap-2">
                <input
                  data-testid="auto-route-lat"
                  type="number"
                  step="0.0001"
                  placeholder="Latitude"
                  className="flex-1 text-sm px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--ws-border)' }}
                  onChange={(e) => setStartPoint(prev => ({ ...(prev || {}), lat: parseFloat(e.target.value), lng: prev?.lng || 0 }))}
                />
                <input
                  data-testid="auto-route-lng"
                  type="number"
                  step="0.0001"
                  placeholder="Longitude"
                  className="flex-1 text-sm px-3 py-2 rounded-lg border"
                  style={{ borderColor: 'var(--ws-border)' }}
                  onChange={(e) => setStartPoint(prev => ({ ...(prev || {}), lng: parseFloat(e.target.value), lat: prev?.lat || 0 }))}
                />
              </div>
              <Button
                size="sm"
                className="mt-2"
                disabled={!startPoint?.lat || !startPoint?.lng}
                onClick={() => setStep('configure')}
                style={{ background: 'var(--ws-teal)', color: 'white' }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <div className="py-4 space-y-5">
            {/* Starting point confirmation */}
            <div className="rounded-xl p-3 border" style={{ background: 'var(--ws-surface-2)', borderColor: 'var(--ws-border)' }}>
              <div className="text-xs" style={{ color: 'var(--ws-text-muted)' }}>Starting from</div>
              <div className="text-sm font-mono" style={{ color: 'var(--ws-text)', fontFamily: 'IBM Plex Mono, monospace' }}>
                {startPoint?.lat?.toFixed(5)}, {startPoint?.lng?.toFixed(5)}
              </div>
            </div>

            {/* Distance slider */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: 'var(--ws-text-muted)' }}>
                Target Distance
              </label>
              <div className="flex items-center gap-3">
                <Slider
                  data-testid="auto-route-distance"
                  value={distance}
                  onValueChange={setDistance}
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="stat-value text-lg min-w-[60px] text-right" style={{ color: 'var(--ws-teal)' }}>
                  {distance[0]} km
                </span>
              </div>
            </div>

            {/* Route type */}
            <div>
              <label className="text-xs font-medium uppercase tracking-wider block mb-2" style={{ color: 'var(--ws-text-muted)' }}>
                Route Type
              </label>
              <div className="flex gap-2" data-testid="auto-route-type">
                <button
                  onClick={() => setRouteType('loop')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-transparent"
                  style={{
                    background: routeType === 'loop' ? 'var(--ws-teal)' : 'var(--ws-surface-2)',
                    color: routeType === 'loop' ? 'white' : 'var(--ws-text)',
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  <RotateCw className="w-4 h-4" />
                  Loop
                </button>
                <button
                  onClick={() => setRouteType('out_and_back')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border border-transparent"
                  style={{
                    background: routeType === 'out_and_back' ? 'var(--ws-teal)' : 'var(--ws-surface-2)',
                    color: routeType === 'out_and_back' ? 'white' : 'var(--ws-text)',
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Out & Back
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'configure' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStep('pick'); setStartPoint(null); }} disabled={generating}>
              Back
            </Button>
            <Button
              data-testid="auto-route-generate"
              onClick={handleGenerate}
              disabled={generating}
              style={{ background: 'var(--ws-green)', color: 'white' }}
            >
              {generating ? <Loader2 className="w-4 h-4 mr-1.5 ws-spinner" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
              Generate Route
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Small icons
const LocateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" />
  </svg>
);

const MapCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export default AutoRouteDialog;
