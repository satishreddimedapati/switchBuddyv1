'use server';

/**
 * @fileOverview A flow to generate a day-by-day interview preparation schedule.
 *
 * - generateInterviewTopicSchedule - Generates the study plan.
 * - GenerateInterviewTopicScheduleInput - The input type.
 * - GenerateInterviewTopicScheduleOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateInterviewTopicScheduleInputSchema, GenerateInterviewTopicScheduleOutputSchema } from '@/lib/types';
import { format } from 'date-fns';

export type GenerateInterviewTopicScheduleInput = z.infer<typeof GenerateInterviewTopicScheduleInputSchema>;
export type GenerateInterviewTopicScheduleOutput = z.infer<typeof GenerateInterviewTopicScheduleOutputSchema>;

export async function generateInterviewTopicSchedule(input: GenerateInterviewTopicScheduleInput): Promise<GenerateInterviewTopicScheduleOutput> {
  return generateInterviewTopicScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewTopicSchedulePrompt',
  input: {schema: GenerateInterviewTopicScheduleInputSchema},
  output: {schema: GenerateInterviewTopicScheduleOutputSchema},
  prompt: `You are an expert technical interviewer and productivity coach.

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
`,
});


const generateInterviewTopicScheduleFlow = ai.defineFlow(
  {
    name: 'generateInterviewTopicScheduleFlow',
    inputSchema: GenerateInterviewTopicScheduleInputSchema,
    outputSchema: GenerateInterviewTopicScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
