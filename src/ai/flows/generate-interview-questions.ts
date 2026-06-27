'use server';

/**
 * @fileOverview A flow to generate interview questions based on a job description.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { z } from 'zod';

const GenerateInterviewQuestionsInputSchema = z.object({
  jobDescription: z.string().describe('The job description for which to generate interview questions.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  interviewQuestions: z.array(z.string()).describe('An array of potential interview questions based on the job description.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert career coach specializing in helping candidates prepare for job interviews.

  Based on the job description provided, generate a list of potential interview questions that the candidate is likely to be asked. The questions should be tailored to assess the candidate's suitability for the role based on the job requirements and responsibilities.

  Job Description: {{{jobDescription}}}

  Interview Questions:
  `;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\\s*' + key + '\\s*}}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GenerateInterviewQuestionsOutputSchema },
  });

  return result.output as GenerateInterviewQuestionsOutput;
}
