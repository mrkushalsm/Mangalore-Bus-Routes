'use client';

import Link from 'next/link';
import { useSavedJourneys } from '@/hooks/use-saved-journeys';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';
import { SavedJourneysList } from '@/components/saved-journeys-list';

export default function SavedRoutesPage() {
  const { savedJourneys, isLoaded, removeJourney } = useSavedJourneys();

  if (!isLoaded) {
    return (
      <div className="container mx-auto">
        <div className="space-y-2 mb-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-96" />
        </div>
        <div className="grid gap-6">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
       <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
          Your Saved Journeys
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Quickly access your favorite bus journeys.
        </p>
      </div>

      {savedJourneys.length > 0 ? (
        <SavedJourneysList savedJourneys={savedJourneys} removeJourney={removeJourney} />
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground rounded-lg border border-dashed">
            <Star className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Saved Journeys Yet</h2>
            <p className="mb-4">
                You can save journeys from the 'Route Finder' page.
            </p>
            <Button asChild>
                <Link href="/">Find a Route</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
