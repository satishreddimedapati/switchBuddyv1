'use server';
/**
 * @fileOverview A flow to get a comprehensive set of market intelligence data for a job role.
 *
 * - getMarketIntelligence - Fetches various insights.
 * - GetMarketIntelligenceInput - The input type.
 * - GetMarketIntelligenceOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import { GetMarketIntelligenceInputSchema, GetMarketIntelligenceOutputSchema } from '@/lib/types';
import {z} from 'zod';

export type GetMarketIntelligenceInput = z.infer<typeof GetMarketIntelligenceInputSchema>;
export type GetMarketIntelligenceOutput = z.infer<typeof GetMarketIntelligenceOutputSchema>;

export async function getMarketIntelligence(
  input: GetMarketIntelligenceInput
): Promise<GetMarketIntelligenceOutput> {
  return getMarketIntelligenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMarketIntelligencePrompt',
  input: {schema: GetMarketIntelligenceInputSchema},
  output: {schema: GetMarketIntelligenceOutputSchema},
  prompt: `You are a world-class career analyst and job market expert.

Provide a comprehensive set of insights for the job role of "{{jobRole}}" at company "{{companyName}}" in location "{{location}}".

Generate insights for all of the following categories based on your extensive knowledge of the job market, corporate trends, and career progression.

- Growth Path: What is the typical career ladder for someone in this role?
- Market Demand: How is the demand for this role trending?
- Alumni Insights: What is the typical tenure and what are the common next steps for alumni from this role/company?
- Interview Difficulty: How hard is the interview process for this role at this company?
- Application Strategy: What is the most effective way to apply for this role?
`,
});

const getMarketIntelligenceFlow = ai.defineFlow(
  {
    name: 'getMarketIntelligenceFlow',
    inputSchema: GetMarketIntelligenceInputSchema,
    outputSchema: GetMarketIntelligenceOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
