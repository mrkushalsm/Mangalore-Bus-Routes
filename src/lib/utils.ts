import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildMapsUrl(stopName: string): string {
  const query = encodeURIComponent(`${stopName} bus stop, Mangalore, Karnataka`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
