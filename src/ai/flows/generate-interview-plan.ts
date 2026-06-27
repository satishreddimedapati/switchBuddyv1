
'use server';

/**
 * @fileOverview A flow to generate a full interview practice plan from a resume and job description.
 *
 * - generateInterviewPlan - A function that generates the plan.
 * - GenerateInterviewPlanInput - The input type for the function.
 * - GenerateInterviewPlanOutput - The return type for the function.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import {z} from 'genkit';
import { GenerateInterviewPlanInputSchema, GenerateInterviewPlanOutputSchema } from '@/lib/types';

export type GenerateInterviewPlanInput = z.infer<typeof GenerateInterviewPlanInputSchema>;
export type GenerateInterviewPlanOutput = z.infer<typeof GenerateInterviewPlanOutputSchema>;


export async function generateInterviewPlan(input: GenerateInterviewPlanInput): Promise<GenerateInterviewPlanOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert career coach and technical interviewer.

Your task is to analyze the user's resume and the provided job description to create a comprehensive and actionable interview practice plan.

Based on the inputs, generate the following:
1.  **topic**: A concise, relevant interview topic based on the core requirements of the job. Examples: "React & State Management", ".NET Core APIs", "System Design for E-commerce".
2.  **difficulty**: The most appropriate difficulty level ('Easy', 'Medium', or 'Hard') based on the seniority and skills mentioned in the job description.
3.  **questions**: A newline-separated string of 5 challenging, open-ended interview questions that directly test the skills mentioned in both the resume and the job description. These should not be simple "yes/no" questions.

---
Resume:
{{{resume}}}
---
Job Description:
{{{jobDescription}}}
---
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GenerateInterviewPlanOutputSchema },
  });

  return result.output as GenerateInterviewPlanOutput;
}






    