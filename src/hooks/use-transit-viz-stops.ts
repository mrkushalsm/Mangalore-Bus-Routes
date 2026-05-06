'use client';

import { useCallback, useEffect, useState } from 'react';

type StopCoordinates = {
  lat: number;
  lng: number;
};

type TransitVizGeoJson = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry?: {
      type: string;
      coordinates?: [number, number];
    };
    properties?: {
      id?: string;
      name?: string;
    };
  }>;
};

const TRANSIT_VIZ_GEOJSON_URL = 'https://mangalore-transit-viz.vercel.app/data/bus-network-geo.json';

let cachedStopLookup: Record<string, StopCoordinates> | null = null;
let cachedLoadPromise: Promise<Record<string, StopCoordinates>> | null = null;

function normalizeStopKey(stopName: string): string {
  return stopName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function addStopKey(lookup: Record<string, StopCoordinates>, key: string | undefined, coordinates: StopCoordinates) {
  if (!key) {
    return;
  }

  const normalizedKey = normalizeStopKey(key);
  if (normalizedKey && !lookup[normalizedKey]) {
    lookup[normalizedKey] = coordinates;
  }
}

async function loadTransitVizStopLookup(): Promise<Record<string, StopCoordinates>> {
  if (cachedStopLookup) {
    return cachedStopLookup;
  }

  if (!cachedLoadPromise) {
    cachedLoadPromise = fetch(TRANSIT_VIZ_GEOJSON_URL)
      .then(async response => {
        if (!response.ok) {
          throw new Error(`Failed to load Transit Viz stops: ${response.status} ${response.statusText}`);
        }

        return response.json() as Promise<TransitVizGeoJson>;
      })
      .then(data => {
        const lookup: Record<string, StopCoordinates> = {};

        data.features.forEach(feature => {
          if (feature.geometry?.type !== 'Point' || !feature.geometry.coordinates) {
            return;
          }

          const [lng, lat] = feature.geometry.coordinates;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
          }

          const coordinates = { lat, lng };
          addStopKey(lookup, feature.properties?.id, coordinates);
          addStopKey(lookup, feature.properties?.name, coordinates);
        });

        cachedStopLookup = lookup;
        return lookup;
      })
      .catch(error => {
        cachedLoadPromise = null;
        throw error;
      });
  }

  return cachedLoadPromise;
}

function formatCoordinates(coordinates: StopCoordinates): string {
  return `${coordinates.lat},${coordinates.lng}`;
}

function buildGoogleMapsSearchUrl(stopName: string, lookup?: Record<string, StopCoordinates>): string {
  const coordinates = lookup?.[normalizeStopKey(stopName)];

  if (coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatCoordinates(coordinates))}`;
  }

  const query = encodeURIComponent(`${stopName} bus stop, Mangalore, Karnataka`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function buildGoogleMapsDirectionsUrl(stops: string[], lookup?: Record<string, StopCoordinates>): string {
  if (stops.length === 0) {
    return '';
  }

  if (stops.length === 1) {
    return buildGoogleMapsSearchUrl(stops[0], lookup);
  }

  const formattedStops = stops.map(stop => {
    const coordinates = lookup?.[normalizeStopKey(stop)];
    return coordinates ? formatCoordinates(coordinates) : `${stop} bus stop, Mangalore, Karnataka`;
  });

  const origin = encodeURIComponent(formattedStops[0]);
  const destination = encodeURIComponent(formattedStops[formattedStops.length - 1]);

  if (formattedStops.length <= 2) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  }

  const waypoints = formattedStops
    .slice(1, -1)
    .map(stop => encodeURIComponent(stop))
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
}

export function useTransitVizStops() {
  const [lookup, setLookup] = useState<Record<string, StopCoordinates> | null>(cachedStopLookup);
  const [isLoaded, setIsLoaded] = useState(Boolean(cachedStopLookup));

  useEffect(() => {
    let isActive = true;

    loadTransitVizStopLookup()
      .then(stopLookup => {
        if (!isActive) {
          return;
        }

        setLookup(stopLookup);
        setIsLoaded(true);
      })
      .catch(error => {
        console.error('Error loading Transit Viz stop coordinates', error);
        if (isActive) {
          setIsLoaded(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const buildGoogleMapsStopUrl = useCallback((stopName: string) => {
    return buildGoogleMapsSearchUrl(stopName, lookup ?? undefined);
  }, [lookup]);

  const buildGoogleMapsDirectionsUrlForStops = useCallback((stops: string[]) => {
    return buildGoogleMapsDirectionsUrl(stops, lookup ?? undefined);
  }, [lookup]);

  return {
    isLoaded,
    buildGoogleMapsStopUrl,
    buildGoogleMapsDirectionsUrl: buildGoogleMapsDirectionsUrlForStops,
  };
}