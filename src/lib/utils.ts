import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildMapsUrl(stopName: string): string {
  const query = encodeURIComponent(`${stopName} bus stop, Mangalore, Karnataka`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Convert a stop name to a Transit Viz stop ID (lowercase, spaces to hyphens).
 * Example: "Adyar" → "adyar", "Adyar Padav" → "adyar-padav"
 */
export function stopNameToTransitVizId(stopName: string): string {
  return stopName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Build a Transit Viz deep link URL for a route.
 * @param sourceStop The source stop name
 * @param destinationStop The destination stop name
 * @param routeIndex The index of the selected route (defaults to 0)
 */
export function buildTransitVizUrl(
  sourceStop: string,
  destinationStop: string,
  routeIndex: number = 0
): string {
  const from = stopNameToTransitVizId(sourceStop);
  const to = stopNameToTransitVizId(destinationStop);
  const baseUrl = 'https://mangalore-transit-viz.vercel.app';
  const params = new URLSearchParams();
  params.set('from', from);
  params.set('to', to);
  params.set('idx', String(routeIndex));
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Build a Google Maps directions URL.
 * Can include multiple waypoints for each bus leg of the journey.
 * @param sourceStop The source stop name
 * @param destinationStop The destination stop name
 * @param allStops Optional array of all intermediate stops (including source and destination)
 */
export function buildGoogleMapsUrl(
  sourceStop: string,
  destinationStop: string,
  allStops?: string[]
): string {
  const origin = encodeURIComponent(`${sourceStop} bus stop, Mangalore, Karnataka`);
  const destination = encodeURIComponent(`${destinationStop} bus stop, Mangalore, Karnataka`);
  
  if (!allStops || allStops.length <= 2) {
    // Simple case: just origin and destination
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  }

  // Build waypoints from intermediate stops (exclude first and last)
  const waypoints = allStops
    .slice(1, -1)
    .map(stop => encodeURIComponent(`${stop} bus stop, Mangalore, Karnataka`))
    .join('|');

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
}
