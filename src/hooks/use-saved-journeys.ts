'use client';
import { useState, useEffect, useCallback } from 'react';
import type { SmartRouteSuggestionOutput } from '@/lib/smart-route-suggestion';

const SAVED_JOURNEYS_KEY = 'mangalore-bus-journeys-saved';

export type SavedJourney = NonNullable<SmartRouteSuggestionOutput['routes']>[0] & {
  id: string; // Add a unique ID for each saved journey
  sourceStop: string;
  destinationStop: string;
};

export function useSavedJourneys() {
  const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SAVED_JOURNEYS_KEY);
      if (item) {
        setSavedJourneys(JSON.parse(item));
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  const updateLocalStorage = (journeys: SavedJourney[]) => {
    try {
      window.localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(journeys));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  };

  const addJourney = useCallback((journey: SavedJourney) => {
    setSavedJourneys((prev) => {
      const newJourneys = [...prev, journey];
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
