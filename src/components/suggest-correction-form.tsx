'use client';

import { useState, useMemo } from 'react';
import type { BusRoute } from '@/lib/bus-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AutoComplete } from '@/components/ui/autocomplete';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Plus, Trash2, X, ArrowUp, ArrowDown, Loader2, Send, ChevronRight } from 'lucide-react';

type CorrectionType = 'edit' | 'add' | 'remove';

interface SuggestCorrectionFormProps {
  allRoutes: BusRoute[];
  allStops: { value: string; label: string }[];
  trigger: React.ReactNode;
}

export function SuggestCorrectionForm({ allRoutes, allStops, trigger }: SuggestCorrectionFormProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CorrectionType>('edit');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Shared state
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [description, setDescription] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterContact, setSubmitterContact] = useState('');

  // Route selector options
  const routeOptions = useMemo(
    () => allRoutes.map(r => ({ value: r.id, label: `Bus ${r.busNumber} — ${r.description}` })),
    [allRoutes]
  );

  const selectedRoute = useMemo(
    () => allRoutes.find(r => r.id === selectedRouteId),
    [allRoutes, selectedRouteId]
  );

  function resetForm() {
    setSelectedRouteId('');
    setBusNumber('');
    setDescription('');
    setStops([]);
    setReason('');
    setSubmitterName('');
    setSubmitterContact('');
  }

  function handleSelectRoute(routeId: string) {
    setSelectedRouteId(routeId);
    const route = allRoutes.find(r => r.id === routeId);
    if (route) {
      setBusNumber(route.busNumber);
      setDescription(route.description);
      if (tab === 'edit') {
        setStops([...route.stops]);
      }
    }
  }

  function handleTabChange(newTab: CorrectionType) {
    setTab(newTab);
    resetForm();
  }

  // Stop list management
  function removeStop(index: number) {
    setStops(prev => prev.filter((_, i) => i !== index));
  }

  function moveStop(index: number, direction: 'up' | 'down') {
    setStops(prev => {
      const newStops = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newStops.length) return prev;
      [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
      return newStops;
    });
  }

  function addStop(stopName: string) {
    if (stopName && !stops.includes(stopName)) {
      setStops(prev => [...prev, stopName]);
    }
  }

  async function handleSubmit() {
    // Validation
    if (tab !== 'remove' && stops.length < 2) {
      toast({ title: 'Error', description: 'Please add at least 2 stops.', variant: 'destructive' });
      return;
    }
    if (!reason.trim()) {
      toast({ title: 'Error', description: 'Please provide a reason for the correction.', variant: 'destructive' });
      return;
    }
    if ((tab === 'edit' || tab === 'remove') && !selectedRouteId) {
      toast({ title: 'Error', description: 'Please select a bus route.', variant: 'destructive' });
      return;
    }
    if (tab === 'add' && !busNumber.trim()) {
      toast({ title: 'Error', description: 'Please enter a bus number.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/suggest-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tab,
          busNumber: busNumber.trim(),
          description: description.trim() || `${stops[0]} to ${stops[stops.length - 1]}`,
          busId: selectedRouteId || undefined,
          stops,
          reason: reason.trim(),
          submitterName: submitterName.trim() || undefined,
          submitterContact: submitterContact.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      toast({
        title: '✅ Submitted!',
        description: 'Your correction has been submitted for review. Thank you for contributing!',
      });

      resetForm();
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  const tabs = [
    { id: 'edit' as CorrectionType, label: 'Edit Route', icon: Pencil },
    { id: 'add' as CorrectionType, label: 'Add New', icon: Plus },
    { id: 'remove' as CorrectionType, label: 'Remove', icon: Trash2 },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Suggest a Route Correction</DialogTitle>
          <DialogDescription>
            Help improve bus route data for everyone in Mangalore.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4 pt-2">
          {/* Route selector for Edit/Remove */}
          {(tab === 'edit' || tab === 'remove') && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Select Bus Route</label>
              <AutoComplete
                options={routeOptions}
                value={selectedRouteId}
                onValueChange={handleSelectRoute}
                placeholder="Search by bus number or route..."
              />
            </div>
          )}

          {/* Bus Number & Description for Add */}
          {tab === 'add' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Bus Number</label>
                <Input
                  value={busNumber}
                  onChange={e => setBusNumber(e.target.value)}
                  placeholder="e.g., 15, 45H, 2A"
                />
              </div>
              <div className={`space-y-1.5 transition-opacity ${!busNumber.trim() ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="text-sm font-medium">Route Description</label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g., State Bank to Surathkal"
                  disabled={!busNumber.trim()}
                />
              </div>
            </>
          )}

          {/* Current stops (read-only) for Remove */}
          {tab === 'remove' && selectedRoute && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Current Stops</label>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="flex flex-wrap gap-1.5">
                  {selectedRoute.stops.map((stop, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                      {stop}
                      {i < selectedRoute.stops.length - 1 && (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Editable stops for Edit/Add */}
          {(tab === 'edit' || tab === 'add') && (
            <div className={`space-y-1.5 transition-opacity ${
              (tab === 'edit' && !selectedRouteId) || (tab === 'add' && (!busNumber.trim() || !description.trim())) 
              ? 'opacity-50 pointer-events-none' 
              : ''
            }`}>
              <label className="text-sm font-medium">
                {tab === 'edit' ? 'Modify Stops' : 'Add Stops'}
              </label>
              
              {tab === 'edit' && !selectedRouteId && (
                <p className="text-xs text-muted-foreground italic">Select a bus route first to see its stops.</p>
              )}

              {/* Stop list */}
              {stops.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto p-2 rounded-lg border bg-muted/30">
                  {stops.map((stop, i) => (
                    <div
                      key={`${stop}-${i}`}
                      className="flex items-center gap-1.5 p-1.5 rounded-md bg-background border text-sm"
                    >
                      <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 text-xs shrink-0">
                        {i + 1}
                      </Badge>
                      <span className="flex-1 truncate text-xs sm:text-sm">{stop}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => moveStop(i, 'up')}
                          disabled={i === 0}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-25 transition-colors"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveStop(i, 'down')}
                          disabled={i === stops.length - 1}
                          className="p-0.5 rounded hover:bg-muted disabled:opacity-25 transition-colors"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeStop(i)}
                          className="p-0.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add stop input */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Add a stop from the list:</p>
                {/* AutoComplete works better internally with its own state. The container's pointer-events-none protects it */}
                <AddStopInput allStops={allStops} onAdd={addStop} />
              </div>
            </div>
          )}

          {/* Reason */}
          <div className={`space-y-1.5 transition-opacity ${
            (tab === 'edit' && (!selectedRouteId || stops.length < 2)) || 
            (tab === 'add' && (!busNumber.trim() || !description.trim() || stops.length < 2)) || 
            (tab === 'remove' && !selectedRouteId)
            ? 'opacity-50 pointer-events-none' 
            : ''
          }`}>
            <label className="text-sm font-medium">
              {tab === 'remove' ? 'Why should this route be removed?' : 'What\'s wrong / what changed?'}
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={
                (tab === 'edit' && (!selectedRouteId || stops.length < 2)) || 
                (tab === 'add' && (!busNumber.trim() || !description.trim() || stops.length < 2)) || 
                (tab === 'remove' && !selectedRouteId)
              }
              placeholder={
                tab === 'remove' 
                  ? 'e.g., This bus route was discontinued last month.' 
                  : 'e.g., The bus now stops at Kankanady before Nandi Gudda.'
              }
              className="w-full min-h-[72px] px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed"
            />
          </div>

          {/* Optional submitter info */}
          <div className={`space-y-1.5 transition-opacity ${!reason.trim() ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="text-xs text-muted-foreground font-medium">Your Name (optional)</label>
            <Input
              value={submitterName}
              onChange={e => setSubmitterName(e.target.value)}
              placeholder="Anonymous"
              className="h-8 text-sm"
              disabled={!reason.trim()}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="w-full gap-2 transition-opacity"
            style={{ opacity: !reason.trim() ? 0.5 : 1 }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Correction
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your suggestion will be reviewed by the maintainer before being applied.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Small wrapper to handle the add-stop autocomplete with its own local state */
function AddStopInput({ allStops, onAdd }: { allStops: { value: string; label: string }[]; onAdd: (stop: string) => void }) {
  const [value, setValue] = useState('');

  function handleSelect(val: string) {
    if (val) {
      // The autocomplete returns lowercase values, find the original label
      const option = allStops.find(s => s.value.toLowerCase() === val.toLowerCase());
      onAdd(option?.label || val);
      setValue('');
    }
  }

  return (
    <AutoComplete
      options={allStops}
      value={value}
      onValueChange={handleSelect}
      placeholder="Search and select a stop..."
    />
  );
}
