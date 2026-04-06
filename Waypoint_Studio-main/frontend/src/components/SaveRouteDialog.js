import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Save, Loader2 } from 'lucide-react';

export const SaveRouteDialog = ({ open, onOpenChange, onSave, defaultName }) => {
  const [name, setName] = useState(defaultName || 'Untitled Route');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim());
      onOpenChange(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="save-route-dialog"
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle
            style={{ color: 'var(--ws-teal)', fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Save Route
          </DialogTitle>
          <DialogDescription>
            Give your route a name to save it for later.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3">
          <Input
            data-testid="save-route-name-input"
            placeholder="Route name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            data-testid="save-route-confirm-button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{ background: 'var(--ws-green)', color: 'white' }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-1.5 ws-spinner" />
            ) : (
              <Save className="w-4 h-4 mr-1.5" />
            )}
            Save Route
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveRouteDialog;
