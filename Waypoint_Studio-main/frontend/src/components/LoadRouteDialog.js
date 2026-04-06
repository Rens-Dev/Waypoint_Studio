import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Bike, Footprints, Trash2, Loader2, FolderOpen, Route } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const LoadRouteDialog = ({ open, onOpenChange, onLoad }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Fetch routes when dialog opens
  useEffect(() => {
    if (open) {
      fetchRoutes();
    }
  }, [open]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/routes`);
      setRoutes(res.data);
    } catch (err) {
      toast.error('Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (route) => {
    onLoad(route);
    onOpenChange(false);
  };

  const handleDelete = async (routeId, e) => {
    e.stopPropagation();
    setDeleting(routeId);
    try {
      await axios.delete(`${BACKEND_URL}/api/routes/${routeId}`);
      setRoutes(prev => prev.filter(r => r._id !== routeId));
      toast.success('Route deleted');
    } catch (err) {
      toast.error('Failed to delete route');
    } finally {
      setDeleting(null);
    }
  };

  const formatDistance = (meters) => {
    if (!meters) return '-';
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="load-route-dialog"
        className="sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle
            style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Load Route
          </DialogTitle>
          <DialogDescription>
            Select a previously saved route to load.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 ws-spinner" style={{ color: 'var(--ws-blue)' }} />
            </div>
          ) : routes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FolderOpen className="w-10 h-10 mb-2" style={{ color: 'var(--ws-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--ws-text-muted)' }}>
                No saved routes yet
              </p>
            </div>
          ) : (
            <div className="space-y-1" data-testid="saved-routes-table">
              {routes.map((route) => (
                <div
                  key={route._id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group"
                  style={{ transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ws-surface-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => handleLoad(route)}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--ws-surface-2)' }}
                  >
                    {route.activity === 'running' ? (
                      <Footprints className="w-4 h-4" style={{ color: 'var(--ws-teal)' }} />
                    ) : (
                      <Bike className="w-4 h-4" style={{ color: 'var(--ws-teal)' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ws-text)' }}>
                      {route.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ws-text-muted)' }}>
                      <span>{formatDistance(route.distance)}</span>
                      <span>{route.waypoints?.length || 0} waypoints</span>
                      <span>{formatDate(route.created_at)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                    style={{ transition: 'opacity 0.15s', color: 'var(--ws-danger)' }}
                    onClick={(e) => handleDelete(route._id, e)}
                    disabled={deleting === route._id}
                  >
                    {deleting === route._id ? (
                      <Loader2 className="w-3.5 h-3.5 ws-spinner" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LoadRouteDialog;
