'use server';
/**
 * @fileOverview A flow to get a personalized salary estimate based on user inputs.
 *
 * - getPersonalizedSalaryEstimate - Fetches a salary estimate.
 * - GetPersonalizedSalaryEstimateInput - The input type.
 * - GetPersonalizedSalaryEstimateOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import { GetPersonalizedSalaryEstimateInputSchema, GetPersonalizedSalaryEstimateOutputSchema } from '@/lib/types';
import {z} from 'zod';

export type GetPersonalizedSalaryEstimateInput = z.infer<typeof GetPersonalizedSalaryEstimateInputSchema>;
export type GetPersonalizedSalaryEstimateOutput = z.infer<typeof GetPersonalizedSalaryEstimateOutputSchema>;

export async function getPersonalizedSalaryEstimate(
  input: GetPersonalizedSalaryEstimateInput
): Promise<GetPersonalizedSalaryEstimateOutput> {
  return getPersonalizedSalaryEstimateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getPersonalizedSalaryEstimatePrompt',
  input: {schema: GetPersonalizedSalaryEstimateInputSchema},
  output: {schema: GetPersonalizedSalaryEstimateOutputSchema},
  prompt: `You are an expert salary analyst for the tech industry in India.

Your task is to calculate a personalized salary range based on the following user inputs:
- Job Role: {{{jobRole}}}
- Years of Experience: {{{yearsOfExperience}}}
- Location: {{{location}}}
- Key Skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on these inputs, provide:
1.  A realistic, estimated salary range in Lakhs Per Annum (LPA).
2.  A brief commentary explaining how the user's specific experience and skills (or lack thereof) impact their earning potential compared to the market average for this role. For example, mention if a particular skill like "Azure" commands a premium.
`,
});

const getPersonalizedSalaryEstimateFlow = ai.defineFlow(
  {
    name: 'getPersonalizedSalaryEstimateFlow',
    inputSchema: GetPersonalizedSalaryEstimateInputSchema,
    outputSchema: GetPersonalizedSalaryEstimateOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
