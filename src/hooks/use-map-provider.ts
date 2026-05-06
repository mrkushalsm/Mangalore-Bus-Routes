'use client';
import { useState, useEffect, useCallback } from 'react';

export type MapProvider = 'transit-viz' | 'google-maps';

const MAP_PROVIDER_KEY = 'mangalore-bus-map-provider';
const DEFAULT_PROVIDER: MapProvider = 'transit-viz';

export function useMapProvider() {
  const [provider, setProviderState] = useState<MapProvider>(DEFAULT_PROVIDER);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load provider from localStorage on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(MAP_PROVIDER_KEY);
      if (stored && (stored === 'transit-viz' || stored === 'google-maps')) {
        setProviderState(stored as MapProvider);
      }
    } catch (error) {
      console.error('Error reading map provider from localStorage', error);
    }
    setIsLoaded(true);
  }, []);

  // Persist provider to localStorage
  const setProvider = useCallback((newProvider: MapProvider) => {
    setProviderState(newProvider);
    try {
      window.localStorage.setItem(MAP_PROVIDER_KEY, newProvider);
    } catch (error) {
      console.error('Error writing map provider to localStorage', error);
    }
  }, []);

  return { provider, setProvider, isLoaded };
}
