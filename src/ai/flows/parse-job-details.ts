
'use server';

/**
 * @fileOverview An AI flow to parse company, role, and tech stack from a resume and job description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { ParseJobDetailsInputSchema, ParseJobDetailsOutputSchema } from '@/lib/types';

export type ParseJobDetailsInput = z.infer<typeof ParseJobDetailsInputSchema>;
export type ParseJobDetailsOutput = z.infer<typeof ParseJobDetailsOutputSchema>;

export async function parseJobDetails(input: ParseJobDetailsInput): Promise<ParseJobDetailsOutput> {
  return parseJobDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseJobDetailsPrompt',
  input: { schema: ParseJobDetailsInputSchema },
  output: { schema: ParseJobDetailsOutputSchema },
  prompt: `You are an expert at parsing job-related documents. Analyze the provided resume and job description.

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
`,
});

const parseJobDetailsFlow = ai.defineFlow(
  {
    name: 'parseJobDetailsFlow',
    inputSchema: ParseJobDetailsInputSchema,
    outputSchema: ParseJobDetailsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
