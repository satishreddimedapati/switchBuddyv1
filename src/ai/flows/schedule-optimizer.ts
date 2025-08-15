
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
  prompt: `You are a no-nonsense AI mission commander for a high-stakes operation.

User profile:
- Lazy by default
- Fears interviews
- Must switch to a better-paying job in under 60 days
- Has full family responsibilities
- Wants balance but zero wasted time

Mission:
Generate a strict, full-day plan from 06:00 AM to 10:00 PM that merges:
1. Interview prep topic schedule (rotating: .NET -> Angular -> C# -> Python -> SQL, each for 15 days in logical topic order)
2. Resume upgrades and targeted job applications
3. Current job essentials (minimum required to keep the job until switch)
4. Family commitments
5. Rewards on weekends (Sat/Sun) for completed weekly progress (e.g., movie, outing, special dinner)

Rules:
1. Every task must connect to the mission of getting a new job in 60 days.
2. Include "Day X of 60" countdown in each motivation message.
3. Avoid generic fluff; give urgent, specific commands.
4. Include 2 "mission checkpoints" each day (midday and evening) to review progress.
5. On weekends, schedule a reward task only if >=80% of weekly tasks were completed.
6. Pull today’s interview topic from the rotating 15-day-per-topic plan based on start date.
7. Output ONLY a JSON array assigned to the 'optimizedSchedule' key in the output JSON. The array of objects should have keys: "time", "task", "motivation".

Example:
[
  {
    "time": "06:00 AM",
    "task": "Wake up, drink water, and do light stretching",
    "motivation": "Day 1 of 60 — Small wins early build momentum for the day."
  },
  ...
]
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
