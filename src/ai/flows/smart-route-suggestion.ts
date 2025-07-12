// Implemented the smartRouteSuggestion flow that suggests bus routes between two stops, potentially involving transfers, using the Gemini AI model.

'use server';
/**
 * @fileOverview A smart route suggestion AI agent.
 *
 * - smartRouteSuggestion - A function that handles the route suggestion process.
 * - SmartRouteSuggestionInput - The input type for the smartRouteSuggestion function.
 * - SmartRouteSuggestionOutput - The return type for the smartRouteSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { busRoutes } from '@/lib/bus-data';

const SmartRouteSuggestionInputSchema = z.object({
  sourceStop: z.string().describe('The starting bus stop.'),
  destinationStop: z.string().describe('The destination bus stop.'),
});
export type SmartRouteSuggestionInput = z.infer<typeof SmartRouteSuggestionInputSchema>;

const RouteSegmentSchema = z.object({
    busNumber: z.string().describe('The bus number for this segment of the journey.'),
    startStop: z.string().describe('The boarding stop for this segment.'),
    endStop: z.string().describe('The alighting stop for this segment.'),
});

const SmartRouteSuggestionOutputSchema = z.object({
  isRoutePossible: z.boolean().describe('Set to false if no route can be found.'),
  route: z.array(RouteSegmentSchema).describe('An array of route segments. If the route is direct, this array will have one segment. For transfers, it will have multiple segments.'),
  reasoning: z.string().describe('The AI reasoning for choosing this route. Explain the path, including any transfers. If no route is found, explain why.'),
});
export type SmartRouteSuggestionOutput = z.infer<typeof SmartRouteSuggestionOutputSchema>;

export async function smartRouteSuggestion(input: SmartRouteSuggestionInput): Promise<SmartRouteSuggestionOutput> {
  return smartRouteSuggestionFlow(input);
}

const allRoutesAsString = busRoutes.map(r => `Bus ${r.busNumber}: ${r.stops.join(' -> ')}`).join('\n');

const prompt = ai.definePrompt({
  name: 'smartRouteSuggestionPrompt',
  input: {schema: SmartRouteSuggestionInputSchema},
  output: {schema: SmartRouteSuggestionOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting the best bus routes between two stops in Mangalore.
  Your task is to find a route from a given source stop to a destination stop using the provided list of bus routes.
  Consider all possible routes and transfers to provide the most efficient route with the fewest transfers.
  Explain your reasoning for choosing the route.

  Here is the list of all available bus routes and their stops:
  ${allRoutesAsString}

  Source Stop: {{{sourceStop}}}
  Destination Stop: {{{destinationStop}}}

  Based on the list above, provide the best bus route.
  - If a direct route exists (or multiple direct routes on different buses), provide a single segment in the 'route' array. If multiple buses serve the same direct route, list them all in the busNumber field (e.g., "10A, 10B, 30A").
  - If the route requires a transfer, provide multiple segments in the 'route' array. Each segment represents one part of the journey on a single bus.
  - If no route is possible, set 'isRoutePossible' to false and explain why in the 'reasoning' field. The 'route' array can be empty.
  `,
});

const smartRouteSuggestionFlow = ai.defineFlow(
  {
    name: 'smartRouteSuggestionFlow',
    inputSchema: SmartRouteSuggestionInputSchema,
    outputSchema: SmartRouteSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
