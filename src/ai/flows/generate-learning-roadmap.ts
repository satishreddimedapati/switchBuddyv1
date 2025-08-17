
'use server';

/**
 * @fileOverview A flow to generate a personalized learning roadmap.
 */

import { ai } from '@/ai/genkit';
import { RoadmapGenerationInputSchema, RoadmapGenerationOutputSchema, WeeklyPlan } from '@/lib/types';
import { z } from 'zod';
import { addDays, format, getISOWeek } from 'date-fns';

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
1.  Generate a plan that is approximately the user's selected 'duration'. It's okay to be a few days over or under. The code will handle the exact count.
2.  If 'learnOnWeekends' is false, the calculated dates for tasks must skip Saturdays and Sundays.
3.  Group the daily tasks into weeks.
4.  The content and complexity must be appropriate for the user's experience level.
5.  The resource types and challenges should align with the user's preferred learning style.
6.  For each daily_task, find a high-quality, relevant resource link (e.g., YouTube, official docs, a popular blog) and include it in the 'resource_link' field.
7.  For each daily_task, calculate and include a 'date' field in "YYYY-MM-DD" format. The date calculation must start from the provided 'startDate' and respect the 'learnOnWeekends' preference.
8.  The 'day' field should be the day of the week, e.g., 'Monday'.
9.  Be creative and motivating in your topic descriptions and challenges! Make learning fun.

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

    if (!output || !output.weeks || output.weeks.length === 0) {
        throw new Error("The AI failed to generate a valid roadmap structure. Please try again.");
    }

    // Flatten all tasks into a single array
    const allTasks = output.weeks.flatMap(week => week.daily_tasks);
    
    // Check if the AI generated at least enough tasks
    if (allTasks.length < input.duration) {
      console.warn(`AI generated fewer tasks (${allTasks.length}) than requested (${input.duration}). The roadmap will be shorter.`);
    }

    // Truncate to the exact duration if AI provides more, or use the generated amount if less.
    const tasks = allTasks.slice(0, input.duration);

    let currentDate = new Date(input.startDate);
    // Adjust for timezone offset to prevent date shifting
    currentDate = new Date(currentDate.valueOf() + currentDate.getTimezoneOffset() * 60 * 1000);

    const newWeeksMap = new Map<number, WeeklyPlan>();

    tasks.forEach((task) => {
        // Find the next valid learning day
        if (!input.learnOnWeekends) {
            let dayOfWeek = currentDate.getDay();
            while (dayOfWeek === 0 || dayOfWeek === 6) { // 0 is Sunday, 6 is Saturday
                currentDate = addDays(currentDate, 1);
                dayOfWeek = currentDate.getDay();
            }
        }

        task.date = format(currentDate, 'yyyy-MM-dd');
        task.day = format(currentDate, 'EEEE');

        const weekNumber = getISOWeek(currentDate);
        
        if (!newWeeksMap.has(weekNumber)) {
            // Find the original week theme if it exists
            const originalWeek = output.weeks.find(w => w.daily_tasks.some(dt => dt.topic === task.topic));
            newWeeksMap.set(weekNumber, {
                week: newWeeksMap.size + 1, // Simple week counter
                theme: originalWeek?.theme || `Week ${newWeeksMap.size + 1} Learning`,
                daily_tasks: [],
            });
        }
        
        newWeeksMap.get(weekNumber)!.daily_tasks.push(task);
        
        // IMPORTANT: Increment the date AFTER assigning it to the task
        currentDate = addDays(currentDate, 1);
    });

    const finalRoadmap: RoadmapGenerationOutput = { weeks: Array.from(newWeeksMap.values()) };
    
    // Sort weeks just in case
    finalRoadmap.weeks.sort((a,b) => a.week - b.week);
    
    return finalRoadmap;
  }
);
