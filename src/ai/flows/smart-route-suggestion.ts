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

const SmartRouteSuggestionInputSchema = z.object({
  sourceStop: z.string().describe('The starting bus stop.'),
  destinationStop: z.string().describe('The destination bus stop.'),
});
export type SmartRouteSuggestionInput = z.infer<typeof SmartRouteSuggestionInputSchema>;

const SmartRouteSuggestionOutputSchema = z.object({
  route: z.string().describe('The suggested bus route, including bus numbers and transfer points if any.'),
  reasoning: z.string().describe('The AI reasoning for choosing this route.'),
});
export type SmartRouteSuggestionOutput = z.infer<typeof SmartRouteSuggestionOutputSchema>;

export async function smartRouteSuggestion(input: SmartRouteSuggestionInput): Promise<SmartRouteSuggestionOutput> {
  return smartRouteSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartRouteSuggestionPrompt',
  input: {schema: SmartRouteSuggestionInputSchema},
  output: {schema: SmartRouteSuggestionOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting the best bus routes between two stops in Mangalore.
  Consider all possible routes and transfers to provide the most efficient route with the fewest transfers.
  Explain your reasoning for choosing the route.

  Source Stop: {{{sourceStop}}}
  Destination Stop: {{{destinationStop}}}

  Provide the bus route and your reasoning.`,
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
