'use server';
/**
 * @fileOverview A flow to get insights about a company.
 *
 * - getCompanyInsights - Fetches insights about a company's culture and interview process.
 * - GetCompanyInsightsInput - The input type.
 * - GetCompanyInsightsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const GetCompanyInsightsInputSchema = z.object({
  companyName: z.string().describe('The name of the company to get insights for.'),
});
export type GetCompanyInsightsInput = z.infer<typeof GetCompanyInsightsInputSchema>;

export const GetCompanyInsightsOutputSchema = z.object({
  culture: z.string().describe("A summary of the company's work culture."),
  interviewProcess: z.string().describe('A summary of the typical interview process.'),
  pros: z.array(z.string()).describe('A list of common pros of working at the company.'),
  cons: z.array(z.string()).describe('A list of common cons of working at the company.'),
});
export type GetCompanyInsightsOutput = z.infer<typeof GetCompanyInsightsOutputSchema>;

export async function getCompanyInsights(
  input: GetCompanyInsightsInput
): Promise<GetCompanyInsightsOutput> {
  return getCompanyInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCompanyInsightsPrompt',
  input: {schema: GetCompanyInsightsInputSchema},
  output: {schema: GetCompanyInsightsOutputSchema},
  prompt: `You are a career analyst with deep knowledge of corporate cultures and hiring processes.

Provide a brief, high-level summary of the company culture, interview process, and common pros/cons for the following company: {{{companyName}}}.

Base your answer on publicly available information and general sentiment. Be balanced and objective.
`,
});

const getCompanyInsightsFlow = ai.defineFlow(
  {
    name: 'getCompanyInsightsFlow',
    inputSchema: GetCompanyInsightsInputSchema,
    outputSchema: GetCompanyInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
