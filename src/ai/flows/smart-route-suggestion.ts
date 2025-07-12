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
    stops: z.array(z.string()).describe('The list of all bus stops in this segment, from start to end.'),
});

const SingleRouteSchema = z.object({
  summary: z.string().describe('A very short summary of the route, like "Direct" or "1 Transfer".'),
  segments: z.array(RouteSegmentSchema).describe('An array of route segments for a single complete journey. A direct route will have 1 segment, a transfer route will have 2 or more.'),
});

const SmartRouteSuggestionOutputSchema = z.object({
  isRoutePossible: z.boolean().describe('Set to false if no route can be found.'),
  routes: z.array(SingleRouteSchema).describe('A list of all possible routes from source to destination. This should include all direct and single-transfer options.'),
  reasoning: z.string().describe('If no route is found, explain why. Otherwise, this field is not needed and can be an empty string.'),
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
  prompt: `You are an AI assistant specialized in suggesting all possible bus routes between two stops in Mangalore.
  Your task is to find ALL viable routes from a given source stop to a destination stop using the provided list of bus routes.
  This includes all direct routes and all reasonable single-transfer routes. It is critical that you return every possible combination in a single response. Do not leave any options out.

  Here is the list of all available bus routes and their stops:
  ${allRoutesAsString}

  Source Stop: {{{sourceStop}}}
  Destination Stop: {{{destinationStop}}}

  Based on the list above, provide ALL possible bus routes.
  - For each route segment, you MUST provide the complete list of stops for that segment in the 'stops' field. This includes the start and end stops, and all stops in between.
  - For each direct route, create a route object with a single segment in its 'segments' array.
  - For each route that requires one transfer, create a route object with two segments in its 'segments' array.
  - Populate the 'routes' array with all the direct and single-transfer route objects you find.
  - If no route is possible, set 'isRoutePossible' to false and explain why in the 'reasoning' field. The 'routes' array should be empty.
  - Do not suggest routes with more than one transfer.
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
