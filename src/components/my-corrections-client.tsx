'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { BusRoute } from '@/lib/bus-data';
import type { ReviewComment } from '@/lib/server/corrections-store';
import type { EnrichedCorrectionSubmission } from '@/app/api/my-corrections/route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AutoComplete } from '@/components/ui/autocomplete';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SuggestCorrectionForm } from '@/components/suggest-correction-form';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Edit3,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Lock,
  GitPullRequest,
  User,
  LogOut,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Route,
  Info,
} from 'lucide-react';

interface MyCorrectionsClientProps {
  allRoutes: BusRoute[];
  allStops: { value: string; label: string }[];
}

export function MyCorrectionsClient({ allRoutes, allStops }: MyCorrectionsClientProps) {
  const { toast } = useToast();

  // Auth state
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<EnrichedCorrectionSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'closed'>('all');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [githubConfigured, setGithubConfigured] = useState(true);

  // Revision state
  const [revisionTarget, setRevisionTarget] = useState<EnrichedCorrectionSubmission | null>(null);
  const [revisionBusNumber, setRevisionBusNumber] = useState('');
  const [revisionDescription, setRevisionDescription] = useState('');
  const [revisionStops, setRevisionStops] = useState<string[]>([]);
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);

  // Check current auth status on mount
  async function checkAuth() {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        fetchSubmissions();
      } else {
        setUser(null);
        setSubmissions([]);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    checkAuth();

    const handleGlobalSubmission = () => {
      fetchSubmissions();
    };

    window.addEventListener('route-correction-submitted', handleGlobalSubmission);
    return () => {
      window.removeEventListener('route-correction-submitted', handleGlobalSubmission);
    };
  }, []);

  // Fetch submissions for the logged in user
  async function fetchSubmissions() {
    setLoadingSubmissions(true);
    try {
      const res = await fetch('/api/my-corrections', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.submissions) {
        setSubmissions(data.submissions);
        if (data.githubConfigured !== undefined) {
          setGithubConfigured(data.githubConfigured);
        }
      } else if (res.status === 401) {
        setUser(null);
        setSubmissions([]);
      } else {
        toast({
          title: 'Notice',
          description: data.error || 'Failed to load corrections.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Network error while fetching submissions.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSubmissions(false);
    }
  }

  // Handle Login / Register
  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthSubmitting(true);
    const endpoint = authTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = authTab === 'login'
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

      setUser(data.user);
      toast({
        title: authTab === 'login' ? 'Welcome back!' : 'Account created!',
        description: `Logged in as ${data.user.name}`,
      });
      fetchSubmissions();
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

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setSubmissions([]);
      toast({ title: 'Logged out', description: 'You have been signed out.' });
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  // Toggle card expansion
  function toggleExpand(id: string) {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // Open Revision modal
  function startRevision(sub: EnrichedCorrectionSubmission) {
    setRevisionTarget(sub);
    setRevisionBusNumber(sub.busNumber);
    setRevisionDescription(sub.description);
    setRevisionStops([...sub.stops]);
    setRevisionReason(sub.reason);
    setRevisionNote('');
  }

  // Handle Revision Submission
  async function handleRevisionSubmit() {
    if (!revisionTarget) return;

    if (!revisionBusNumber.trim()) {
      toast({ title: 'Validation Error', description: 'Bus number is required.', variant: 'destructive' });
      return;
    }
    if (!revisionDescription.trim()) {
      toast({ title: 'Validation Error', description: 'Route description is required.', variant: 'destructive' });
      return;
    }
    if (revisionTarget.type !== 'remove' && revisionStops.length < 2) {
      toast({ title: 'Validation Error', description: 'At least 2 stops are required.', variant: 'destructive' });
      return;
    }
    if (!revisionReason.trim()) {
      toast({ title: 'Validation Error', description: 'Reason is required.', variant: 'destructive' });
      return;
    }

    setRevisionSubmitting(true);
    try {
      const res = await fetch(`/api/suggest-correction/${revisionTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busNumber: revisionBusNumber.trim(),
          description: revisionDescription.trim(),
          stops: revisionStops,
          reason: revisionReason.trim(),
          revisionNote: revisionNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit revision.');
      }

      toast({
        title: '✅ Correction Revised!',
        description: data.message || `Updated pull request #${revisionTarget.prNumber}`,
      });

      setRevisionTarget(null);
      fetchSubmissions();
    } catch (err: any) {
      toast({
        title: 'Revision Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setRevisionSubmitting(false);
    }
  }

  // Revision stops manipulation
  function moveRevisionStop(index: number, direction: 'up' | 'down') {
    setRevisionStops(prev => {
      const copy = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= copy.length) return prev;
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function removeRevisionStop(index: number) {
    setRevisionStops(prev => prev.filter((_, i) => i !== index));
  }

  function addRevisionStop(stopName: string) {
    if (stopName && !revisionStops.includes(stopName)) {
      setRevisionStops(prev => [...prev, stopName]);
    }
  }

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    return submissions.filter(s => s.status === statusFilter);
  }, [submissions, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      accepted: submissions.filter(s => s.status === 'accepted').length,
      closed: submissions.filter(s => s.status === 'closed').length,
    };
  }, [submissions]);

  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-transparent pointer-events-none" />
        <div className="relative container mx-auto max-w-4xl px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                  <GitPullRequest className="h-3.5 w-3.5" />
                  Contributor Portal
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                My Corrections
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Track your proposed route changes, read reviewer comments, and revise active pull requests.
              </p>
            </div>

            {user && (
              <div className="flex items-center gap-3 bg-card border rounded-xl p-3 shadow-sm">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold leading-tight">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight truncate max-w-[140px]">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleLogout}
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Checking contributor session...</p>
          </div>
        ) : !user ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg border-primary/20">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Lock className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Sign in to track your corrections</CardTitle>
                <CardDescription>
                  Your submissions and revisions are associated securely with your contributor account.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex p-1 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      authTab === 'login' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      authTab === 'register' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-3">
                  {authTab === 'register' && (
                    <div className="space-y-1">
                      <Label htmlFor="auth-name" className="text-xs">Full Name</Label>
                      <Input
                        id="auth-name"
                        type="text"
                        placeholder="e.g. Pratham Kumar"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="auth-email" className="text-xs">Email Address</Label>
                    <Input
                      id="auth-email"
                      type="email"
                      placeholder="you@example.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="auth-password" className="text-xs">Password</Label>
                    <Input
                      id="auth-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2 mt-4" disabled={authSubmitting}>
                    {authSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Please wait...
                      </>
                    ) : authTab === 'login' ? (
                      'Sign In & View Submissions'
                    ) : (
                      'Create Contributor Account'
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="bg-muted/30 border-t py-3 text-center text-xs text-muted-foreground justify-center">
                <span>Credentials & ownership are verified safely on the server.</span>
              </CardFooter>
            </Card>
          </div>
        ) : (
          /* Submissions List Screen */
          <div className="space-y-6">
            {!githubConfigured && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs flex items-start gap-2.5">
                <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">Local Contributor Mode</span>
                  <p className="text-muted-foreground">
                    GitHub integration is currently running in local demonstration mode because <code>GITHUB_TOKEN</code> in <code>.env.local</code> is unconfigured or using the placeholder. Submissions and revisions are tracked locally in this dashboard. To create live pull requests on GitHub, add a GitHub Personal Access Token to <code>.env.local</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs h-8"
                  onClick={() => setStatusFilter('all')}
                >
                  All ({counts.all})
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs h-8 gap-1.5"
                  onClick={() => setStatusFilter('pending')}
                >
                  <Clock className="h-3 w-3 text-amber-500" />
                  Pending Review ({counts.pending})
                </Button>
                <Button
                  variant={statusFilter === 'accepted' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs h-8 gap-1.5"
                  onClick={() => setStatusFilter('accepted')}
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Accepted ({counts.accepted})
                </Button>
                <Button
                  variant={statusFilter === 'closed' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full text-xs h-8 gap-1.5"
                  onClick={() => setStatusFilter('closed')}
                >
                  <XCircle className="h-3 w-3 text-rose-500" />
                  Closed ({counts.closed})
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={fetchSubmissions}
                  disabled={loadingSubmissions}
                  title="Check for newest GitHub comments & status"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>

                <SuggestCorrectionForm
                  allRoutes={allRoutes}
                  allStops={allStops}
                  onSuccess={fetchSubmissions}
                  trigger={
                    <Button size="sm" className="h-8 gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Suggest Correction
                    </Button>
                  }
                />
              </div>
            </div>

            {/* List */}
            {loadingSubmissions && submissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your route corrections...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <Card className="border-dashed py-12 text-center">
                <CardContent className="space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <Route className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">No corrections found</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                      {statusFilter === 'all'
                        ? "You haven't submitted any route corrections yet. Help improve the Mangalore bus network data!"
                        : `You have no corrections with status "${statusFilter}".`}
                    </p>
                  </div>
                  <SuggestCorrectionForm
                    allRoutes={allRoutes}
                    allStops={allStops}
                    onSuccess={fetchSubmissions}
                    trigger={
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Suggest Your First Correction
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSubmissions.map((sub) => {
                  const isExpanded = Boolean(expandedCards[sub.id]);

                  return (
                    <Card
                      key={sub.id}
                      className={`transition-all duration-200 border ${
                        sub.status === 'accepted'
                          ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                          : sub.status === 'pending'
                          ? 'border-amber-500/30 bg-amber-500/[0.02]'
                          : 'border-border/60'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="font-bold text-sm px-2.5 py-0.5">
                                Bus {sub.busNumber}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`capitalize text-xs ${
                                  sub.type === 'add'
                                    ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                                    : sub.type === 'edit'
                                    ? 'border-blue-500/40 text-blue-600 dark:text-blue-400'
                                    : 'border-rose-500/40 text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {sub.type === 'edit' ? '✏️ Route Edit' : sub.type === 'add' ? '➕ New Route' : '❌ Route Removal'}
                              </Badge>

                              {/* PR Status Badge */}
                              {sub.status === 'accepted' ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1 text-xs">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Accepted & Merged
                                </Badge>
                              ) : sub.status === 'pending' ? (
                                <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-xs">
                                  <Clock className="h-3 w-3" />
                                  Pending Review
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1 text-xs">
                                  <XCircle className="h-3 w-3" />
                                  Closed (Not Merged)
                                </Badge>
                              )}
                            </div>

                            <CardTitle className="text-base sm:text-lg font-semibold pt-1">
                              {sub.description}
                            </CardTitle>

                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>Submitted {new Date(sub.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              {sub.updatedAt !== sub.createdAt && (
                                <span>• Revised {new Date(sub.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              )}
                            </p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2">
                            {sub.prUrl && (
                              <a
                                href={sub.prUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium border rounded-lg px-2.5 py-1.5 bg-background shadow-xs hover:bg-secondary/50 transition-colors"
                              >
                                PR #{sub.prNumber}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}

                            {sub.canRevise ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10"
                                onClick={() => startRevision(sub)}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Revise Proposal
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="text-[11px] text-muted-foreground py-1">
                                Read-only
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-1">
                        {/* Reason quote */}
                        <div className="bg-muted/40 rounded-lg p-3 text-xs sm:text-sm text-foreground/90 border border-border/40">
                          <span className="font-semibold text-xs text-muted-foreground block mb-1">Reason for correction:</span>
                          <p className="italic">"{sub.reason}"</p>
                        </div>

                        {/* Collapsible Details */}
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleExpand(sub.id)}
                            className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground py-1 transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              {isExpanded ? 'Hide Route Stops' : `View Proposed Stops (${sub.stops.length})`}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {sub.comments.length} review comment{sub.comments.length === 1 ? '' : 's'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="pt-3 pb-1 border-t border-border/40 mt-2 space-y-3">
                              {/* Stops Sequence */}
                              {sub.type !== 'remove' && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-semibold text-muted-foreground">Proposed Stop Sequence:</span>
                                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-muted/20 rounded-lg border">
                                    {sub.stops.map((stop, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs font-normal gap-1">
                                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                                          {idx + 1}
                                        </span>
                                        {stop}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Reviewer Comments Thread */}
                              <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                    Reviewer Feedback & Discussion
                                  </span>
                                  {sub.latestCommentDate && (
                                    <span className="text-[11px] text-muted-foreground">
                                      Latest: {new Date(sub.latestCommentDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>

                                {sub.comments.length === 0 ? (
                                  <div className="p-4 rounded-lg bg-muted/20 border border-border/40 text-center text-xs text-muted-foreground space-y-1">
                                    <p>No reviewer comments yet.</p>
                                    <p className="text-[11px]">
                                      {sub.status === 'pending'
                                        ? 'Maintainers will review your proposed changes shortly. Check back here for updates!'
                                        : 'No written comments were recorded for this pull request.'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {sub.comments.map((comment) => (
                                      <div
                                        key={comment.id}
                                        className="p-3 rounded-lg bg-card border border-border/60 space-y-1 text-xs shadow-xs"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-1.5">
                                            {comment.authorAvatar ? (
                                              <img
                                                src={comment.authorAvatar}
                                                alt={comment.author}
                                                className="w-4 h-4 rounded-full"
                                              />
                                            ) : (
                                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                            <span className="font-semibold text-foreground">
                                              @{comment.author}
                                            </span>
                                            {comment.isReview && (
                                              <Badge variant="outline" className="text-[10px] py-0 px-1">
                                                Review
                                              </Badge>
                                            )}
                                          </div>
                                          <span className="text-[10px] text-muted-foreground">
                                            {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                        </div>
                                        <p className="text-foreground/90 whitespace-pre-wrap pl-5 text-xs">
                                          {comment.body}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>

                      <CardFooter className="bg-muted/10 border-t border-border/40 py-2.5 px-6 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" />
                          {sub.status === 'pending'
                            ? 'PR is open. You can edit this proposal anytime to incorporate feedback.'
                            : sub.status === 'accepted'
                            ? 'Merged into repository. The revised stops are now live in the route finder!'
                            : 'This PR was closed without merging.'}
                        </span>

                        {sub.canRevise && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary hover:text-primary gap-1"
                            onClick={() => startRevision(sub)}
                          >
                            <Edit3 className="h-3 w-3" />
                            Revise
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revision Dialog */}
      <Dialog open={Boolean(revisionTarget)} onOpenChange={(open) => !open && setRevisionTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Edit3 className="h-5 w-5 text-primary" />
              Revise Route Proposal
            </DialogTitle>
            <DialogDescription>
              Update your proposal for <strong>Bus {revisionTarget?.busNumber}</strong> on pull request #{revisionTarget?.prNumber}. This directly updates the open PR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Bus Number & Description */}
            <div className="space-y-2">
              <Label htmlFor="rev-bus-number" className="text-xs">Bus Number</Label>
              <Input
                id="rev-bus-number"
                value={revisionBusNumber}
                onChange={(e) => setRevisionBusNumber(e.target.value)}
                placeholder="e.g. 44B"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rev-desc" className="text-xs">Route Description</Label>
              <Input
                id="rev-desc"
                value={revisionDescription}
                onChange={(e) => setRevisionDescription(e.target.value)}
                placeholder="e.g. Statebank to Surathkal via Highway"
              />
            </div>

            {/* Stops list for add/edit */}
            {revisionTarget?.type !== 'remove' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Route Stops ({revisionStops.length})</Label>
                  <span className="text-[11px] text-muted-foreground">Order matters</span>
                </div>

                {/* Add Stop Input */}
                <div className="flex gap-2">
                  <AddRevisionStopInput allStops={allStops} onAdd={addRevisionStop} />
                </div>

                {/* Stops container */}
                <div className="border rounded-lg divide-y max-h-56 overflow-y-auto bg-muted/10">
                  {revisionStops.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No stops added. Add at least 2 stops.
                    </div>
                  ) : (
                    revisionStops.map((stop, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 text-xs hover:bg-muted/40">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-foreground">{stop}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveRevisionStop(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-30"
                            title="Move Up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRevisionStop(idx, 'down')}
                            disabled={idx === revisionStops.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-30"
                            title="Move Down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRevisionStop(idx)}
                            className="p-1 rounded hover:bg-destructive/10 text-destructive"
                            title="Remove Stop"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="rev-reason" className="text-xs">Reason / Correction Context</Label>
              <Input
                id="rev-reason"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Why is this route being corrected?"
              />
            </div>

            {/* Revision Note for Reviewers */}
            <div className="space-y-2 pt-1 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="rev-notes" className="text-xs font-semibold text-primary">
                  Note for Reviewers (Optional)
                </Label>
                <span className="text-[11px] text-muted-foreground">Posted to PR discussion</span>
              </div>
              <Input
                id="rev-notes"
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="e.g. Added Hampankatta stop as requested in review comments"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevisionTarget(null)}
              disabled={revisionSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleRevisionSubmit}
              disabled={revisionSubmitting}
              className="gap-2"
            >
              {revisionSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating Pull Request...
                </>
              ) : (
                'Update Pull Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddRevisionStopInput({
  allStops,
  onAdd,
}: {
  allStops: { value: string; label: string }[];
  onAdd: (stop: string) => void;
}) {
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
      placeholder="Search and select a stop to add..."
    />
  );
}
