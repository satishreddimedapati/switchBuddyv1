'use server';
/**
 * @fileOverview A flow to get salary benchmark data for a job role.
 *
 * - getSalaryBenchmark - Fetches salary benchmark data.
 * - GetSalaryBenchmarkInput - The input type.
 * - GetSalaryBenchmarkOutput - The return type.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { GetSalaryBenchmarkInputSchema, GetSalaryBenchmarkOutputSchema } from '@/lib/types';
import {z} from 'zod';

export type GetSalaryBenchmarkInput = z.infer<typeof GetSalaryBenchmarkInputSchema>;
export type GetSalaryBenchmarkOutput = z.infer<typeof GetSalaryBenchmarkOutputSchema>;


export async function getSalaryBenchmark(input: GetSalaryBenchmarkInput): Promise<GetSalaryBenchmarkOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are a salary and compensation analyst.

Provide an estimated salary range for the job role "{{jobRole}}" in "{{location}}".
Also provide a brief commentary on the market conditions for this role in that location.

Present the salary in the local currency format (e.g., LPA for India).
Base your answer on your general knowledge of compensation data.
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GetSalaryBenchmarkOutputSchema },
  });

  return result.output as GetSalaryBenchmarkOutput;
}





