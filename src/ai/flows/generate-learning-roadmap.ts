
'use server';

/**
 * @fileOverview A flow to generate a personalized learning roadmap.
 */

import { ai } from '@/ai/genkit';
import { RoadmapGenerationInputSchema, RoadmapGenerationOutputSchema } from '@/lib/types';
import { z } from 'zod';
import { addDays, format } from 'date-fns';

export type RoadmapGenerationInput = z.infer<typeof RoadmapGenerationInputSchema>;
export type RoadmapGenerationOutput = z.infer<typeof RoadmapGenerationOutputSchema>;

export async function generateLearningRoadmap(input: RoadmapGenerationInput): Promise<RoadmapGenerationOutput> {
    return generateLearningRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningRoadmapPrompt',
  input: { schema: RoadmapGenerationInputSchema },
  output: { schema: RoadmapGenerationOutputSchema },
  prompt: `You are an expert curriculum designer for a tech learning platform. Your task is to generate a detailed, week-by-week learning roadmap based on the user's inputs.

User Inputs:
- Main Topic/Track: {{{topic}}}
- Time Commitment: {{{timePerDay}}} minutes per day
- Total Duration: {{{duration}}} days
- Start Date: {{{startDate}}}
- Learn on Weekends: {{{learnOnWeekends}}}
- Goals: {{#each goals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Experience Level: {{{experienceLevel}}}
- Tech Focus: {{#each techFocus}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Preferred Learning Style: {{{learningStyle}}}

Based on these inputs, create a structured roadmap. The roadmap should be broken down into weeks. Each week should have a clear theme. Each day within the week should have a specific topic, a suggested resource type (e.g., 'Video', 'Article', 'Interactive Tutorial'), a small challenge or exercise, and a calculated date.

Rules:
1. The total number of daily tasks must match the user's selected 'duration'.
2. If 'learnOnWeekends' is false, the calculated dates for tasks must skip Saturdays and Sundays.
3. Group the daily tasks into weeks.
4. The content and complexity must be appropriate for the user's experience level.
5. The resource types and challenges should align with the user's preferred learning style.
6. If the learning style is Video, suggest a conceptual YouTube link. If it's reading, suggest a blog or documentation link.
7. For each daily_task, calculate and include a 'date' field in "YYYY-MM-DD" format. The date calculation must start from the provided 'startDate' and respect the 'learnOnWeekends' preference.
8. The 'day' field should be the day of the week, e.g., 'Monday'.
9. Be creative and motivating in your topic descriptions and challenges! Make learning fun.

Generate the output as a valid JSON object matching the defined schema.
`,
});

const generateLearningRoadmapFlow = ai.defineFlow(
  {
    name: 'generateLearningRoadmapFlow',
    inputSchema: RoadmapGenerationInputSchema,
    outputSchema: RoadmapGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    
    // Post-process dates to ensure they are correct according to weekend preference
    if (output && output.weeks) {
        let currentDate = new Date(input.startDate);
        // Adjust for timezone offset to prevent date shifting
        currentDate = new Date(currentDate.valueOf() + currentDate.getTimezoneOffset() * 60 * 1000);

        output.weeks.forEach(week => {
            week.daily_tasks.forEach(task => {
                 // Find the next valid learning day
                if (!input.learnOnWeekends) {
                    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) { // 0 is Sunday, 6 is Saturday
                        currentDate = addDays(currentDate, 1);
                    }
                }
                task.date = format(currentDate, 'yyyy-MM-dd');
                task.day = format(currentDate, 'EEEE');
                currentDate = addDays(currentDate, 1);
            });
        });
    }

    return output!;
  }
);
