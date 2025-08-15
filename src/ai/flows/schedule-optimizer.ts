
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
  prompt: `You are an extremely strict and motivational AI productivity coach.
Your job is to create a FULL DAY schedule for a person who:
- Is naturally lazy and procrastinates.
- Is planning to switch companies soon.
- Has fear of interviews and tends to avoid preparation.
- Has full family responsibilities.
- MUST secure a better package within the next 2-3 months.

Your output must be a JSON array of objects, where each object represents a scheduled item. The array should be assigned to the 'optimizedSchedule' key in the output JSON.

Each object in the array must contain these keys:
- "time": string (e.g., "06:00 AM")
- "task": string
- "motivation": string

Your generated schedule must:
1. Cover the entire day from 6:00 AM to 10:00 PM.
2. Include both personal/family responsibilities and interview preparation.
3. Dedicate focused time to:
   - Coding practice
   - System design
   - Behavioral interview prep
   - Resume improvement
4. Include short motivational notes for each major task block.
5. Include small rewards or breaks to keep motivation high.
6. Have strict time slots — no vague timings.
7. Push the person to overcome laziness and fear by starting with easier tasks, then moving to challenging ones.
8. End the day with a short reflection activity.
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
