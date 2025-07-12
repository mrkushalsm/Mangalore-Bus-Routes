'use client';
import type { SavedJourney } from '@/hooks/use-saved-journeys';
import { SuggestedRouteCard } from './suggested-route-card';

type SavedJourneysListProps = {
  savedJourneys: SavedJourney[];
  removeJourney: (journeyId: string) => void;
};

export function SavedJourneysList({ savedJourneys, removeJourney }: SavedJourneysListProps) {
  return (
    <div className="space-y-6">
      {savedJourneys.map((journey, index) => (
        <div key={journey.id} className="p-4 border rounded-lg bg-card">
            <div className="mb-4">
                <h3 className="font-semibold text-lg">{journey.sourceStop} to {journey.destinationStop}</h3>
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
