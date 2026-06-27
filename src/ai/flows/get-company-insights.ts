'use server';
/**
 * @fileOverview A flow to get insights about a company.
 *
 * - getCompanyInsights - Fetches insights about a company's culture and interview process.
 * - GetCompanyInsightsInput - The input type.
 * - GetCompanyInsightsOutput - The return type.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { GetCompanyInsightsInputSchema, GetCompanyInsightsOutputSchema } from '@/lib/types';
import { z } from 'zod';

export type GetCompanyInsightsInput = z.infer<typeof GetCompanyInsightsInputSchema>;
export type GetCompanyInsightsOutput = z.infer<typeof GetCompanyInsightsOutputSchema>;


export async function getCompanyInsights(input: GetCompanyInsightsInput): Promise<GetCompanyInsightsOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are a career analyst with deep knowledge of corporate cultures and hiring processes.

Provide a brief, high-level summary of the company culture, interview process, and common pros/cons for the following company: {{{companyName}}}.

Base your answer on publicly available information and general sentiment. Be balanced and objective.
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GetCompanyInsightsOutputSchema },
  });

  return result.output as GetCompanyInsightsOutput;
}





