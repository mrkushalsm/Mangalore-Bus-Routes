'use client';

import type { SavedJourney } from '@/hooks/use-saved-journeys';
import { SuggestedRouteCard } from './suggested-route-card';
import { MapPin, ArrowRight } from 'lucide-react';

type SavedJourneysListProps = {
  savedJourneys: SavedJourney[];
  removeJourney: (journeyId: string) => void;
};

export function SavedJourneysList({ savedJourneys, removeJourney }: SavedJourneysListProps) {
  return (
    <div className="space-y-4">
      {savedJourneys.map((journey, index) => (
        <div 
          key={journey.id} 
          className="p-5 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 text-lg font-semibold mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{journey.sourceStop}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span>{journey.destinationStop}</span>
            </div>
            <p className="text-sm text-muted-foreground">{journey.summary}</p>
          </div>
          <SuggestedRouteCard 
            route={journey} 
            isSavedView={true}
            isLast={index === savedJourneys.length - 1}
          />
        </div>
      ))}
    </div>
  );
}
