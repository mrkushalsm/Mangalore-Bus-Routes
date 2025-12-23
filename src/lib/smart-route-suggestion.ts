'use server';
/**
 * @fileOverview A smart route suggestion agent (algorithmic).
 */

import { z } from 'zod';
import { getBusRoutes } from '@/lib/bus-data';
import { findRoutes, type RouteFinderOutput } from '@/lib/route-finder';

// Input Schema matches the form
const SmartRouteSuggestionInputSchema = z.object({
    sourceStop: z.string().describe('The starting bus stop.'),
    destinationStop: z.string().describe('The destination bus stop.'),
});
export type SmartRouteSuggestionInput = z.infer<typeof SmartRouteSuggestionInputSchema>;

// Re-export the output type to maintain compatibility with the frontend
export type SmartRouteSuggestionOutput = RouteFinderOutput;

/**
 * Server Action to find bus routes using the deterministic algorithm.
 */
export async function smartRouteSuggestion(input: SmartRouteSuggestionInput): Promise<SmartRouteSuggestionOutput> {
    const { sourceStop, destinationStop } = input;

    // 1. Fetch data
    const busRoutes = await getBusRoutes();

    // 2. Run Algorithm
    const result = findRoutes(sourceStop, destinationStop, busRoutes);

    return result;
}
