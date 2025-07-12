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

const SmartRouteSuggestionOutputSchema = z.object({
  route: z.string().describe('The suggested bus route, including bus numbers and transfer points if any. If no direct route is available, state that.'),
  reasoning: z.string().describe('The AI reasoning for choosing this route. Explain the path, including any transfers.'),
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
  If there is no route, say so clearly.

  Here is the list of all available bus routes and their stops:
  ${allRoutesAsString}

  Source Stop: {{{sourceStop}}}
  Destination Stop: {{{destinationStop}}}

  Based on the list above, provide the best bus route and your reasoning.
  For example, for a query from Statebank to Adyar, the answer should mention bus numbers 10A, 10B, 30A, and 30B as they all travel between these stops.
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

    