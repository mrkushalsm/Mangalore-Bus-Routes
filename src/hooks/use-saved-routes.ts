'use client';
import { useState, useEffect, useCallback } from 'react';

const SAVED_ROUTES_KEY = 'mangalore-bus-routes-saved';

export function useSavedRoutes() {
  const [savedRouteIds, setSavedRouteIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SAVED_ROUTES_KEY);
      if (item) {
        setSavedRouteIds(new Set(JSON.parse(item)));
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  const saveRoute = useCallback((routeId: string) => {
    setSavedRouteIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(routeId);
      try {
        window.localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Error writing to localStorage', error);
      }
      return newSet;
    });
  }, []);

  const unsaveRoute = useCallback((routeId: string) => {
    setSavedRouteIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(routeId);
      try {
        window.localStorage.setItem(SAVED_ROUTES_KEY, JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Error writing to localStorage', error);
      }
      return newSet;
    });
  }, []);
  
  const isRouteSaved = useCallback((routeId: string) => {
    return savedRouteIds.has(routeId);
  }, [savedRouteIds]);

  const toggleSaveRoute = useCallback((routeId: string) => {
    if (isRouteSaved(routeId)) {
      unsaveRoute(routeId);
    } else {
      saveRoute(routeId);
    }
  }, [isRouteSaved, saveRoute, unsaveRoute]);

  return { savedRouteIds: Array.from(savedRouteIds), toggleSaveRoute, isRouteSaved, isLoaded };
}
