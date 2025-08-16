'use server';

/**
 * @fileOverview A flow to generate a professional message to a recruiter.
 *
 * - generateRecruiterMessage - A function that generates the message.
 * - GenerateRecruiterMessageInput - The input type for the function.
 * - GenerateRecruiterMessageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { GenerateRecruiterMessageInputSchema, GenerateRecruiterMessageOutputSchema } from '@/lib/types';
import { z } from 'zod';

export type GenerateRecruiterMessageInput = z.infer<typeof GenerateRecruiterMessageInputSchema>;
export type GenerateRecruiterMessageOutput = z.infer<typeof GenerateRecruiterMessageOutputSchema>;

export async function generateRecruiterMessage(input: GenerateRecruiterMessageInput): Promise<GenerateRecruiterMessageOutput> {
  return generateRecruiterMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecruiterMessagePrompt',
  input: {schema: GenerateRecruiterMessageInputSchema},
  output: {schema: GenerateRecruiterMessageOutputSchema},
  prompt: `You are an expert career coach helping a job seeker draft a professional message to a recruiter.

Based on the provided resume and job description, generate a short, human-sounding message. Do NOT make it sound robotic.

The message should be in a {{tone}} tone.

Resume:
{{{resume}}}

Job Description:
{{{jobDescription}}}

Recruiter Message:
`,
});

const generateRecruiterMessageFlow = ai.defineFlow(
  {
    name: 'generateRecruiterMessageFlow',
    inputSchema: GenerateRecruiterMessageInputSchema,
    outputSchema: GenerateRecruiterMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
