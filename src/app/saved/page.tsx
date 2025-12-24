'use client';

import Link from 'next/link';
import { useSavedJourneys } from '@/hooks/use-saved-journeys';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Search, Bookmark } from 'lucide-react';
import { SavedJourneysList } from '@/components/saved-journeys-list';

export default function SavedRoutesPage() {
  const { savedJourneys, isLoaded, removeJourney } = useSavedJourneys();

  if (!isLoaded) {
    return (
      <div className="min-h-full">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="space-y-2 mb-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-transparent" />
        
        <div className="relative container mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-accent/10">
                  <Bookmark className="h-5 w-5 text-accent" />
                </div>
                <span className="text-sm font-medium text-accent">Your Collection</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Saved Journeys
              </h1>
              <p className="text-muted-foreground max-w-lg">
                Quickly access your favorite bus routes and journeys.
              </p>
            </div>
            
            {/* Stats badge */}
            {savedJourneys.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border/50">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{savedJourneys.length} saved</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 pb-8">
        {savedJourneys.length > 0 ? (
          <SavedJourneysList savedJourneys={savedJourneys} removeJourney={removeJourney} />
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-2xl border border-dashed border-border/50 bg-secondary/30">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Saved Journeys Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start by finding a route and saving it for quick access later.
            </p>
            <Button asChild className="gap-2">
              <Link href="/">
                <Search className="h-4 w-4" />
                Find a Route
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
