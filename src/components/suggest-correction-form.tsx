'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { BusRoute } from '@/lib/bus-data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AutoComplete } from '@/components/ui/autocomplete';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil,
  Plus,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
  Send,
  ChevronRight,
  ExternalLink,
  GitPullRequest,
  Lock,
  User,
  CheckCircle2,
} from 'lucide-react';

type CorrectionType = 'edit' | 'add' | 'remove';

interface SuggestCorrectionFormProps {
  allRoutes: BusRoute[];
  allStops: { value: string; label: string }[];
  trigger: React.ReactNode;
  onSuccess?: (submission?: { prUrl?: string; prNumber?: number; message?: string }) => void;
}

export function SuggestCorrectionForm({ allRoutes, allStops, trigger, onSuccess }: SuggestCorrectionFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CorrectionType>('edit');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Auth state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Success state
  const [submittedResult, setSubmittedResult] = useState<{ prUrl?: string; prNumber?: number; message?: string } | null>(null);

  // Shared form state
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [description, setDescription] = useState('');
  const [stops, setStops] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterContact, setSubmitterContact] = useState('');

  // Check auth whenever modal opens
  useEffect(() => {
    if (open) {
      setSubmittedResult(null);
      setCheckingAuth(true);
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setSubmitterName(data.user.name);
            setSubmitterContact(data.user.email);
          } else {
            setCurrentUser(null);
          }
        })
        .catch(() => setCurrentUser(null))
        .finally(() => setCheckingAuth(false));
    }
  }, [open]);

  // Route selector options
  const routeOptions = useMemo(
    () => allRoutes.map(r => ({ value: r.id, label: `Bus ${r.busNumber} — ${r.description}` })),
    [allRoutes]
  );

  const selectedRoute = useMemo(
    () => allRoutes.find(r => r.id === selectedRouteId),
    [allRoutes, selectedRouteId]
  );

  function clearInputs() {
    setSelectedRouteId('');
    setBusNumber('');
    setDescription('');
    setStops([]);
    setReason('');
  }

  function resetAll() {
    clearInputs();
    setSubmittedResult(null);
    setTab('edit');
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
    clearInputs();
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

  // Handle quick inline auth
  async function handleQuickAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthSubmitting(true);
    const endpoint = authMode === 'signin' ? '/api/auth/login' : '/api/auth/register';
    const payload = authMode === 'signin'
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed.');
      }
      setCurrentUser(data.user);
      setSubmitterName(data.user.name);
      setSubmitterContact(data.user.email);
      toast({
        title: authMode === 'signin' ? 'Signed in!' : 'Account created!',
        description: `Ready to submit as ${data.user.name}`,
      });
    } catch (err: any) {
      toast({
        title: 'Authentication Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in or create an account so you can track and revise your submission.',
        variant: 'destructive',
      });
      return;
    }

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
    if (tab === 'edit' && selectedRoute) {
      const hasNumberChanged = busNumber.trim().toLowerCase() !== selectedRoute.busNumber.toLowerCase();
      const hasDescChanged = description.trim() !== selectedRoute.description;
      const hasStopsChanged = stops.join(';') !== selectedRoute.stops.join(';');

      if (!hasNumberChanged && !hasDescChanged && !hasStopsChanged) {
        toast({
          title: 'No Changes Detected',
          description: 'Please modify the stops, bus number, or description before submitting an edit.',
          variant: 'destructive',
        });
        return;
      }
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
          submitterName: submitterName.trim() || currentUser.name,
          submitterContact: submitterContact.trim() || currentUser.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      const resultData = {
        prUrl: data.prUrl,
        prNumber: data.prNumber,
        message: data.message,
      };

      // Clear the form inputs immediately so they never linger when reopening
      clearInputs();
      setSubmittedResult(resultData);

      // Trigger parent callback
      onSuccess?.(resultData);

      // Broadcast global event so any other component/view updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('route-correction-submitted', { detail: resultData }));
      }

      toast({
        title: '✅ Submitted for Review!',
        description: 'Your route correction has been submitted.',
      });
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

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      resetAll();
    } else {
      if (submittedResult) {
        resetAll();
      }
    }
  }

  function handleGoToDashboard() {
    resetAll();
    setOpen(false);
    onSuccess?.();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('route-correction-submitted'));
    }
    if (pathname !== '/corrections') {
      router.push('/corrections');
    }
  }

  const tabs = [
    { id: 'edit' as CorrectionType, label: 'Edit Route', icon: Pencil },
    { id: 'add' as CorrectionType, label: 'Add New', icon: Plus },
    { id: 'remove' as CorrectionType, label: 'Remove', icon: Trash2 },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-primary" />
            Suggest a Route Correction
          </DialogTitle>
          <DialogDescription>
            Help improve bus route data for everyone in Mangalore.
          </DialogDescription>
        </DialogHeader>

        {submittedResult ? (
          /* Post-Submission Success Screen */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-lg">Correction Submitted!</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {submittedResult.message || 'Your suggestion is now open for review by repository maintainers.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleGoToDashboard}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <GitPullRequest className="h-4 w-4" />
                Track in My Corrections Dashboard →
              </Button>

              {submittedResult.prUrl && (
                <a
                  href={submittedResult.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted/50 transition-colors text-muted-foreground"
                >
                  View Pull Request #{submittedResult.prNumber} on GitHub
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs"
                onClick={() => {
                  resetAll();
                }}
              >
                Submit another correction
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Contributor Authentication Box */}
            {checkingAuth ? (
              <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking contributor session...
              </div>
            ) : currentUser ? (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span>
                    Submitting as <strong>{currentUser.name}</strong> ({currentUser.email})
                  </span>
                </div>
                <Link
                  href="/corrections"
                  onClick={() => setOpen(false)}
                  className="text-primary hover:underline font-medium text-[11px] flex items-center gap-1"
                >
                  My Corrections <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Sign in to track & revise your submission</p>
                    <p className="text-muted-foreground mt-0.5">
                      Submissions require a contributor account so you can track maintainer feedback and revise your pull request.
                    </p>
                  </div>
                </div>

                <div className="flex p-0.5 bg-muted rounded-md text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode('signin')}
                    className={`flex-1 py-1 rounded font-medium ${authMode === 'signin' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`flex-1 py-1 rounded font-medium ${authMode === 'register' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'}`}
                  >
                    Quick Register
                  </button>
                </div>

                <form onSubmit={handleQuickAuth} className="space-y-2">
                  {authMode === 'register' && (
                    <Input
                      placeholder="Your Full Name"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      className="h-8 text-xs bg-background"
                    />
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                      className="h-8 text-xs bg-background flex-1"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-8 text-xs bg-background flex-1"
                    />
                  </div>
                  <Button type="submit" size="sm" className="w-full h-8 text-xs gap-1.5" disabled={authSubmitting}>
                    {authSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <User className="h-3.5 w-3.5" />}
                    {authMode === 'signin' ? 'Sign In as Contributor' : 'Create Account & Continue'}
                  </Button>
                </form>
              </div>
            )}

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
            <div className="space-y-4 pt-1">
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Stops Sequence ({stops.length})
                    </label>
                    <span className="text-xs text-muted-foreground">Min 2 stops</span>
                  </div>

                  {/* Add stop input */}
                  <AddStopInput allStops={allStops} onAdd={addStop} />

                  {/* Stops list */}
                  {stops.length > 0 && (
                    <div className="space-y-1 max-h-56 overflow-y-auto border rounded-lg p-2 divide-y">
                      {stops.map((stop, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group text-sm"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                              {i + 1}.
                            </span>
                            <span className="truncate">{stop}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveStop(i, 'up')}
                              disabled={i === 0}
                              className="p-1 rounded hover:bg-muted disabled:opacity-20 transition-opacity"
                              title="Move up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStop(i, 'down')}
                              disabled={i === stops.length - 1}
                              className="p-1 rounded hover:bg-muted disabled:opacity-20 transition-opacity"
                              title="Move down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStop(i)}
                              className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Reason for Correction <span className="text-destructive">*</span>
                </label>
                <Input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g., Bus now goes via Ladyhill, or Route 15 timings changed"
                />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={submitting || !reason.trim() || !currentUser}
                className="w-full gap-2 transition-opacity"
                style={{ opacity: !reason.trim() || !currentUser ? 0.6 : 1 }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Route Correction
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground text-center">
                Your suggestion will be safely created on a branch and reviewed by maintainers before being merged.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Small wrapper to handle the add-stop autocomplete with its own local state */
function AddStopInput({ allStops, onAdd }: { allStops: { value: string; label: string }[]; onAdd: (stop: string) => void }) {
  const [value, setValue] = useState('');

  function handleSelect(val: string) {
    if (val) {
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
