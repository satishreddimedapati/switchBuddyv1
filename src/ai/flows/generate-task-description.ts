'use server';

/**
 * @fileOverview A flow to generate a short description for a given task title.
 *
 * - generateTaskDescription - A function that generates the description.
 * - GenerateTaskDescriptionInput - The input type for the function.
 * - GenerateTaskDescriptionOutput - The return type for the function.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import {z} from 'genkit';

const GenerateTaskDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the task.'),
});
export type GenerateTaskDescriptionInput = z.infer<typeof GenerateTaskDescriptionInputSchema>;

const GenerateTaskDescriptionOutputSchema = z.object({
  description: z.string().describe('A short, one-sentence description for the task.'),
});
export type GenerateTaskDescriptionOutput = z.infer<typeof GenerateTaskDescriptionOutputSchema>;


export async function generateTaskDescription(input: GenerateTaskDescriptionInput): Promise<GenerateTaskDescriptionOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `Based on the following task title, generate a concise, one-sentence description that clarifies the task's objective.

Task Title: {{{title}}}
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GenerateTaskDescriptionOutputSchema },
  });

  return result.output as GenerateTaskDescriptionOutput;
}





