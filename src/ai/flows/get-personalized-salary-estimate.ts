'use server';
/**
 * @fileOverview A flow to get a personalized salary estimate based on user inputs.
 *
 * - getPersonalizedSalaryEstimate - Fetches a salary estimate.
 * - GetPersonalizedSalaryEstimateInput - The input type.
 * - GetPersonalizedSalaryEstimateOutput - The return type.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { GetPersonalizedSalaryEstimateInputSchema, GetPersonalizedSalaryEstimateOutputSchema } from '@/lib/types';
import {z} from 'zod';

export type GetPersonalizedSalaryEstimateInput = z.infer<typeof GetPersonalizedSalaryEstimateInputSchema>;
export type GetPersonalizedSalaryEstimateOutput = z.infer<typeof GetPersonalizedSalaryEstimateOutputSchema>;


export async function getPersonalizedSalaryEstimate(input: GetPersonalizedSalaryEstimateInput): Promise<GetPersonalizedSalaryEstimateOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert salary analyst for the tech industry in India.

Your task is to calculate a personalized salary range based on the following user inputs:
- Job Role: {{{jobRole}}}
- Years of Experience: {{{yearsOfExperience}}}
- Location: {{{location}}}
- Key Skills: {{#each skills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Based on these inputs, provide:
1.  A realistic, estimated salary range in Lakhs Per Annum (LPA).
2.  A brief commentary explaining how the user's specific experience and skills (or lack thereof) impact their earning potential compared to the market average for this role. For example, mention if a particular skill like "Azure" commands a premium.
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GetPersonalizedSalaryEstimateOutputSchema },
  });

  return result.output as GetPersonalizedSalaryEstimateOutput;
}





