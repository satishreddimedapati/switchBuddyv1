'use server';

/**
 * @fileOverview A flow to generate a full interview practice plan from a resume and job description.
 *
 * - generateInterviewPlan - A function that generates the plan.
 * - GenerateInterviewPlanInput - The input type for the function.
 * - GenerateInterviewPlanOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateInterviewPlanInputSchema, GenerateInterviewPlanOutputSchema } from '@/lib/types';

export type GenerateInterviewPlanInput = z.infer<typeof GenerateInterviewPlanInputSchema>;
export type GenerateInterviewPlanOutput = z.infer<typeof GenerateInterviewPlanOutputSchema>;

export async function generateInterviewPlan(input: GenerateInterviewPlanInput): Promise<GenerateInterviewPlanOutput> {
  return generateInterviewPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewPlanPrompt',
  input: {schema: GenerateInterviewPlanInputSchema},
  output: {schema: GenerateInterviewPlanOutputSchema},
  prompt: `You are an expert career coach and technical interviewer.

Your task is to analyze the user's resume and the provided job description to create a comprehensive and actionable interview practice plan.

Based on the inputs, generate the following:
1.  **topic**: A concise, relevant interview topic based on the core requirements of the job. Examples: "React & State Management", ".NET Core APIs", "System Design for E-commerce".
2.  **difficulty**: The most appropriate difficulty level ('Easy', 'Medium', or 'Hard') based on the seniority and skills mentioned in the job description.
3.  **questions**: An array of 5 challenging, open-ended interview questions that directly test the skills mentioned in both the resume and the job description. These should not be simple "yes/no" questions.

---
Resume:
{{{resume}}}
---
Job Description:
{{{jobDescription}}}
---
`,
});

const generateInterviewPlanFlow = ai.defineFlow(
  {
    name: 'generateInterviewPlanFlow',
    inputSchema: GenerateInterviewPlanInputSchema,
    outputSchema: GenerateInterviewPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
