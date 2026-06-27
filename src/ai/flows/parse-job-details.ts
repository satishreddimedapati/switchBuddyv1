'use server';

/**
 * @fileOverview An AI flow to parse company, role, and tech stack from a resume and job description.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ParseJobDetailsInputSchema, ParseJobDetailsOutputSchema } from '@/lib/types';

export type ParseJobDetailsInput = z.infer<typeof ParseJobDetailsInputSchema>;
export type ParseJobDetailsOutput = z.infer<typeof ParseJobDetailsOutputSchema>;

export async function parseJobDetails(input: ParseJobDetailsInput): Promise<ParseJobDetailsOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert at parsing job-related documents. Analyze the provided resume and job description.

Your task is to extract the following information:
1.  **company**: The name of the company from the job description.
2.  **role**: The specific job title from the job description.
3.  **techStack**: A list of the most important technologies, frameworks, and skills mentioned in BOTH the resume and the job description. This should be a consolidated list of the key overlapping skills.

---
Resume:
{{{resume}}}
---
Job Description:
{{{jobDescription}}}
---
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\\s*' + key + '\\s*}}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: ParseJobDetailsOutputSchema },
  });

  return result.output as ParseJobDetailsOutput;
}
