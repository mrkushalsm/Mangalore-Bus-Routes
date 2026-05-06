'use client';
import { useState, useEffect, useCallback } from 'react';
import type { SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';
import { buildGoogleMapsUrl, buildTransitVizUrl } from '@/lib/utils';

const SAVED_JOURNEYS_KEY = 'mangalore-bus-journeys-saved';

export type SavedJourney = NonNullable<SmartRouteSuggestionOutput['routes']>[0] & {
  id: string; // Add a unique ID for each saved journey
  sourceStop: string;
  destinationStop: string;
  idx: number; // Global itinerary index for Transit Viz app
  transitVizUrl: string;
  googleMapsUrl: string;
};

type SavedJourneyInput = Omit<SavedJourney, 'transitVizUrl' | 'googleMapsUrl'> & {
  transitVizUrl?: string;
  googleMapsUrl?: string;
};

const buildAllStopsInJourney = (journey: NonNullable<SmartRouteSuggestionOutput['routes']>[0]): string[] => {
  const stops: string[] = [];

  journey.segments.forEach((segment, segmentIndex) => {
    if (segmentIndex === 0) {
      stops.push(...segment.stops);
      return;
    }

    stops.push(...segment.stops.slice(1));
  });

  return stops;
};

const buildSavedJourneyLinks = (journey: SavedJourneyInput) => {
  const allStops = buildAllStopsInJourney(journey);

  return {
    transitVizUrl: journey.transitVizUrl || buildTransitVizUrl(journey.sourceStop, journey.destinationStop, journey.idx ?? 0),
    googleMapsUrl: journey.googleMapsUrl || buildGoogleMapsUrl(journey.sourceStop, journey.destinationStop, allStops),
  };
};

const normalizeSavedJourney = (journey: SavedJourneyInput): SavedJourney => {
  const links = buildSavedJourneyLinks(journey);

  return {
    ...journey,
    idx: journey.idx ?? 0,
    transitVizUrl: links.transitVizUrl,
    googleMapsUrl: links.googleMapsUrl,
  };
};

export function useSavedJourneys() {
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SAVED_JOURNEYS_KEY);
      if (item) {
        const parsedJourneys = JSON.parse(item) as SavedJourney[];
        setSavedJourneys(parsedJourneys.map(normalizeSavedJourney));
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  const updateLocalStorage = (journeys: SavedJourney[]) => {
    try {
      const normalizedJourneys = journeys.map(normalizeSavedJourney);
      window.localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(normalizedJourneys));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  };

  const addJourney = useCallback((journey: SavedJourneyInput) => {
    setSavedJourneys((prev) => {
      const normalizedJourney = normalizeSavedJourney(journey);
      const newJourneys = [...prev, normalizedJourney];
      updateLocalStorage(newJourneys);
      return newJourneys;
    });
  }, []);

  const removeJourney = useCallback((journeyId: string) => {
    setSavedJourneys((prev) => {
      const newJourneys = prev.filter(j => j.id !== journeyId);
      updateLocalStorage(newJourneys);
      return newJourneys;
    });
  }, []);

  const isJourneySaved = useCallback((journeyId: string) => {
    return savedJourneys.some(j => j.id === journeyId);
  }, [savedJourneys]);

  return { savedJourneys, addJourney, removeJourney, isJourneySaved, isLoaded };
}
