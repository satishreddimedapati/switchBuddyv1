'use server';

/**
 * @fileOverview AI flows for scheduling and summarizing daily tasks.
 *
 * - generateDailyPlan - Creates an optimized daily schedule.
 * - generateDailySummary - Summarizes daily progress and suggests next-day priorities.
 */

import {ai} from '@/ai/genkit';
import {
  DailyTask,
  GenerateDailyPlanInput,
  GenerateDailyPlanInputSchema,
  GenerateDailyPlanOutput,
  GenerateDailyPlanOutputSchema,
  GenerateDailySummaryInput,
  GenerateDailySummaryInputSchema,
  GenerateDailySummaryOutput,
  GenerateDailySummaryOutputSchema,
} from '@/lib/types';

const generatePlanPrompt = ai.definePrompt({
  name: 'generateDailyPlanPrompt',
  input: {schema: GenerateDailyPlanInputSchema},
  output: {schema: GenerateDailyPlanOutputSchema},
  prompt: `You are an expert productivity coach. Your job is to create an optimized daily schedule based on a list of tasks.

You will be given a list of tasks and an available time window.

Your task is to:
1.  Analyze the tasks. Pay attention to task types; 'interview' tasks are high priority and their time slots should be respected if already set.
2.  Logically order the tasks to create a productive flow.
3.  Assign a specific time slot for each task within the available hours.
4.  Strategically insert short breaks (10-15 minutes) into the schedule to prevent burnout.
5.  Return the new schedule as an array of tasks and breaks. Ensure the 'type' for breaks is "break".

Available Hours: {{{startTime}}} to {{{endTime}}}
Tasks to schedule:
{{#each tasks}}
- {{this.title}} ({{this.type}}){{#if this.description}}: {{this.description}}{{/if}}
{{/each}}
`,
});

const generateDailyPlanFlow = ai.defineFlow(
  {
    name: 'generateDailyPlanFlow',
    inputSchema: GenerateDailyPlanInputSchema,
    outputSchema: GenerateDailyPlanOutputSchema,
  },
  async (input) => {
    const {output} = await generatePlanPrompt(input);
    return output!;
  }
);

export async function generateDailyPlan(
  input: GenerateDailyPlanInput
): Promise<GenerateDailyPlanOutput> {
  return generateDailyPlanFlow(input);
}

const generateSummaryPrompt = ai.definePrompt({
  name: 'generateDailySummaryPrompt',
  input: {schema: GenerateDailySummaryInputSchema},
  output: {schema: GenerateDailySummaryOutputSchema},
  prompt: `You are an encouraging and insightful productivity coach. Your goal is to help the user reflect on their day and prepare for the next one.

You will be given a list of tasks and their completion status for today.

Your tasks are to:
1.  Write a short, motivational summary of the user's accomplishments. Focus on what they completed.
2.  Based on the incomplete tasks and general productivity principles, identify and suggest the top 3 most important priorities for tomorrow.

Today's Tasks:
{{#each tasks}}
- {{this.title}} (Completed: {{this.completed}})
{{/each}}
`,
});

const generateDailySummaryFlow = ai.defineFlow(
  {
    name: 'generateDailySummaryFlow',
    inputSchema: GenerateDailySummaryInputSchema,
    outputSchema: GenerateDailySummaryOutputSchema,
  },
  async (input) => {
    const {output} = await generateSummaryPrompt(input);
    return output!;
  }
);

export async function generateDailySummary(
  input: GenerateDailySummaryInput
): Promise<GenerateDailySummaryOutput> {
  return generateDailySummaryFlow(input);
}
