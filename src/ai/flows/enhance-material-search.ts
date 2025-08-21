'use server';

/**
 * @fileOverview A Genkit flow that enhances material search by understanding synonyms.
 *
 * - enhanceMaterialSearch - A function that enhances material search with synonyms.
 * - EnhanceMaterialSearchInput - The input type for the enhanceMaterialSearch function.
 * - EnhanceMaterialSearchOutput - The return type for the enhanceMaterialSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceMaterialSearchInputSchema = z.object({
  searchTerm: z.string().describe('The search term entered by the user.'),
  taskType: z.string().describe('The type of task for which materials are being searched.'),
  materialsPreviouslyUsed: z
    .string()
    .describe('A comma-separated list of materials previously used for this task type.'),
});
export type EnhanceMaterialSearchInput = z.infer<typeof EnhanceMaterialSearchInputSchema>;

const EnhanceMaterialSearchOutputSchema = z.object({
  enhancedSearchTerm: z
    .string()
    .describe('An enhanced search term that includes synonyms and related terms.'),
});
export type EnhanceMaterialSearchOutput = z.infer<typeof EnhanceMaterialSearchOutputSchema>;

export async function enhanceMaterialSearch(input: EnhanceMaterialSearchInput): Promise<EnhanceMaterialSearchOutput> {
  return enhanceMaterialSearchFlow(input);
}

const enhanceMaterialSearchPrompt = ai.definePrompt({
  name: 'enhanceMaterialSearchPrompt',
  input: {schema: EnhanceMaterialSearchInputSchema},
  output: {schema: EnhanceMaterialSearchOutputSchema},
  prompt: `You are an expert in fencing materials and terminology. Your goal is to enhance the user's search term by adding relevant synonyms and related terms to improve search results.

Task Type: {{{taskType}}}
Search Term: {{{searchTerm}}}
Previously Used Materials: {{{materialsPreviouslyUsed}}}

Based on the above information, generate an enhanced search term that includes synonyms and related terms for the user's search.  The enhanced search term should be a comma separated list of terms.

Enhanced Search Term:`,
});

const enhanceMaterialSearchFlow = ai.defineFlow(
  {
    name: 'enhanceMaterialSearchFlow',
    inputSchema: EnhanceMaterialSearchInputSchema,
    outputSchema: EnhanceMaterialSearchOutputSchema,
  },
  async input => {
    const {output} = await enhanceMaterialSearchPrompt(input);
    return {
      enhancedSearchTerm: output!.enhancedSearchTerm,
    };
  }
);
