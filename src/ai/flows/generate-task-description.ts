'use server';

/**
 * @fileOverview A flow to generate a short description for a given task title.
 *
 * - generateTaskDescription - A function that generates the description.
 * - GenerateTaskDescriptionInput - The input type for the function.
 * - GenerateTaskDescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTaskDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
});
export type GenerateTaskDescriptionInput = z.infer<typeof GenerateTaskDescriptionInputSchema>;

const GenerateTaskDescriptionOutputSchema = z.object({
  description: z.string().describe('A short, one-sentence description for the task.'),
});
export type GenerateTaskDescriptionOutput = z.infer<typeof GenerateTaskDescriptionOutputSchema>;

export async function generateTaskDescription(input: GenerateTaskDescriptionInput): Promise<GenerateTaskDescriptionOutput> {
  return generateTaskDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTaskDescriptionPrompt',
  input: {schema: GenerateTaskDescriptionInputSchema},
  output: {schema: GenerateTaskDescriptionOutputSchema},
  prompt: `Based on the following task title, generate a concise, one-sentence description that clarifies the task's objective.

Task Title: {{{title}}}
`,
});

const generateTaskDescriptionFlow = ai.defineFlow(
  {
    name: 'generateTaskDescriptionFlow',
    inputSchema: GenerateTaskDescriptionInputSchema,
    outputSchema: GenerateTaskDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
