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
  prompt: `You are a world-class career analyst and job market expert for the tech industry in India.

Provide a comprehensive set of insights for the job role of "{{jobRole}}" at company "{{companyName}}" in location(s) "{{location}}".

Generate detailed, actionable insights for ALL of the following categories based on your extensive knowledge of the job market, corporate trends, and career progression.

- Growth Path: What is the typical career ladder for someone in this role? Provide salary ranges in Lakhs Per Annum (LPA) for each level.
- Skills in Demand: What are the top 5-7 most in-demand technical skills and tools for this role right now?
- Location Comparison: Briefly compare the job markets in the specified locations, mentioning salary differences and cost of living factors.
- Top Companies Hiring: Name 3-5 other major companies that are actively hiring for this role in the specified locations.
- Alumni Insights: What is the typical tenure and what are the common next steps or company switches for alumni from this role/company? Provide 1-2 examples.
- Interview Prep: How hard is the interview process? What are 2-3 common question categories they should prepare for?
- Application Strategy: What is the best time to apply? What are the estimated success rates for different application methods (Referral, Direct Apply, etc.)?
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
