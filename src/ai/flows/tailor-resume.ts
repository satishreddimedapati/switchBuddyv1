'use server';

/**
 * @fileOverview AI tool that analyzes a user's resume and a job description to suggest edits tailored for the job.
 *
 * - tailorResume - A function that handles the resume tailoring process.
 * - TailorResumeInput - The input type for the tailorResume function.
 * - TailorResumeOutput - The return type for the tailorResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { TailorResumeInputSchema, TailorResumeOutputSchema } from '@/lib/types';

export type TailorResumeInput = z.infer<typeof TailorResumeInputSchema>;
export type TailorResumeOutput = z.infer<typeof TailorResumeOutputSchema>;

export async function tailorResume(input: TailorResumeInput): Promise<TailorResumeOutput> {
  return tailorResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tailorResumePrompt',
  input: {schema: TailorResumeInputSchema},
  output: {schema: TailorResumeOutputSchema},
  prompt: `You are an expert resume analyzer and editor for the tech industry. Your task is to analyze a user's resume against a job description and provide a comprehensive analysis and a tailored resume.

Analyze the provided resume and job description, then generate the following output:

1.  **fitScore**: An estimated percentage of how well the resume matches the job description (e.g., 75).
2.  **breakdown**: A short, one-sentence analysis for each category:
    *   skillsMatch: e.g., "Good alignment on core web technologies but could highlight cloud experience more."
    *   experienceMatch: e.g., "Relevant project experience but could be quantified better."
    *   educationMatch: e.g., "Educational background is a solid fit for this role."
3.  **missingSkills**: An array of 3-5 key skills or technologies from the job description that are missing from the resume.
4.  **tailoredResume**: The full text of the user's resume, rewritten and optimized to be a perfect fit for the job description. Integrate missing skills where appropriate, use action verbs, and quantify achievements. Use placeholders like '[Your Company]' or '[Start Date]' if information is missing.

---
Resume:
{{{resume}}}
---
Job Description:
{{{jobDescription}}}
---
`,
});

const tailorResumeFlow = ai.defineFlow(
  {
    name: 'tailorResumeFlow',
    inputSchema: TailorResumeInputSchema,
    outputSchema: TailorResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
