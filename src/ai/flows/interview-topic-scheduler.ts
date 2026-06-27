'use server';

/**
 * @fileOverview A flow to generate a day-by-day interview preparation schedule.
 *
 * - generateInterviewTopicSchedule - Generates the study plan.
 * - GenerateInterviewTopicScheduleInput - The input type.
 * - GenerateInterviewTopicScheduleOutput - The return type.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import {z} from 'genkit';
import { GenerateInterviewTopicScheduleInputSchema, GenerateInterviewTopicScheduleOutputSchema } from '@/lib/types';
import { format } from 'date-fns';

export type GenerateInterviewTopicScheduleInput = z.infer<typeof GenerateInterviewTopicScheduleInputSchema>;
export type GenerateInterviewTopicScheduleOutput = z.infer<typeof GenerateInterviewTopicScheduleOutputSchema>;


export async function generateInterviewTopicSchedule(input: GenerateInterviewTopicScheduleInput): Promise<GenerateInterviewTopicScheduleOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert technical interviewer and productivity coach.

Purpose:
Generate a day-by-day interview preparation schedule for a user-selected topic.

User will provide:
- topic: {{{topic}}}
- number_of_days: {{{numberOfDays}}}
- start_date: {{{startDate}}}

Rules:
1. Create exactly {{number_of_days}} tasks.
2. Each day covers ONE subtopic in logical learning order (from basics to advanced).
3. Include theory and practical aspects (e.g., coding exercises, real-world scenarios).
4. Avoid repeating subtopics.
5. If the topic is a programming language/framework, include at least 2 days for small coding projects or applied exercises.
6. Dates should start from {{start_date}} and increase by 1 day for each entry.
7. Output ONLY a valid JSON array assigned to the 'schedule' key, with no extra text or formatting.

JSON Output Format (inside the 'schedule' key):
[
  {
    "date": "YYYY-MM-DD",
    "topic": "{{topic}}",
    "subtopic": "string - one specific interview prep subtopic"
  }
]
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GenerateInterviewTopicScheduleOutputSchema },
  });

  return result.output as GenerateInterviewTopicScheduleOutput;
}






