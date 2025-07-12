'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { BusRoutesList } from '@/components/bus-routes-list';
import { busRoutes } from '@/lib/bus-data';
import { useSavedRoutes } from '@/hooks/use-saved-routes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star } from 'lucide-react';

export default function SavedRoutesPage() {
  const { savedRouteIds, isLoaded } = useSavedRoutes();

  const savedRoutes = useMemo(
    () => busRoutes.filter((route) => savedRouteIds.includes(route.id)),
    [savedRouteIds]
  );
  
  if (!isLoaded) {
    return (
      <div className="container mx-auto">
        <div className="space-y-2 mb-8">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-96" />
        </div>
        <div className="flex justify-center mb-8">
            <Skeleton className="h-10 w-full max-w-lg" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
       <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
          Your Saved Routes
        </h1>
        <p className="text-muted-foreground md:text-lg">
          Quickly access your favorite bus routes.
        </p>
      </div>

      {savedRoutes.length > 0 ? (
        <BusRoutesList allRoutes={savedRoutes} />
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground rounded-lg border border-dashed">
            <Star className="h-12 w-12 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Saved Routes Yet</h2>
            <p className="mb-4">
                You can save routes from the 'All Routes' page.
            </p>
            <Button asChild>
                <Link href="/routes">Explore Routes</Link>
            </Button>
        </div>
      )}
    </div>
  );
}
