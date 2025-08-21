// This file uses server-side code.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant materials from the catalog.
 *
 * - suggestMaterials - A function that suggests materials based on the job description and task type.
 * - SuggestMaterialsInput - The input type for the suggestMaterials function.
 * - SuggestMaterialsOutput - The return type for the suggestMaterials function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { MaterialCatalogItem } from '@/lib/types';

const SuggestMaterialsInputSchema = z.object({
  jobDescription: z.string().describe('The description of the fencing job.'),
  taskType: z.string().describe('The type of task being performed (e.g., post installation, rail installation).'),
  previouslyUsedMaterials: z.array(z.string()).optional().describe('List of material names that have been used in similar jobs'),
  materialCatalog: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    unit: z.string(),
    cost: z.number(),
  })).describe('The full list of available materials in the catalog.'),
});
export type SuggestMaterialsInput = z.infer<typeof SuggestMaterialsInputSchema>;

const SuggestMaterialsOutputSchema = z.object({
  suggestedMaterials: z.array(z.string()).describe('A list of suggested material names from the catalog.'),
  reasoning: z.string().optional().describe('The AI reasoning for suggesting these materials.'),
});
export type SuggestMaterialsOutput = z.infer<typeof SuggestMaterialsOutputSchema>;

export async function suggestMaterials(input: SuggestMaterialsInput): Promise<SuggestMaterialsOutput> {
  return suggestMaterialsFlow(input);
}

const suggestMaterialsPrompt = ai.definePrompt({
  name: 'suggestMaterialsPrompt',
  input: {schema: SuggestMaterialsInputSchema},
  output: {schema: SuggestMaterialsOutputSchema},
  prompt: `You are an AI assistant helping a fencing worker suggest materials for a job.

  Based on the job description and task type, suggest a list of relevant materials from the provided catalog.
  Consider materials that have been previously used in similar jobs. Only use names of actual materials from the catalog. Output the names in an array.

  Job Description: {{{jobDescription}}}
  Task Type: {{{taskType}}}

  Available Materials Catalog:
  {{#each materialCatalog}}
  - {{this.name}} (SKU: {{this.sku}})
  {{/each}}

  {{#if previouslyUsedMaterials}}
  Previously Used Materials: {{{previouslyUsedMaterials}}}
  {{/if}}
  `,
});

const suggestMaterialsFlow = ai.defineFlow(
  {
    name: 'suggestMaterialsFlow',
    inputSchema: SuggestMaterialsInputSchema,
    outputSchema: SuggestMaterialsOutputSchema,
  },
  async input => {
    const {output} = await suggestMaterialsPrompt(input);
    return output!;
  }
);
