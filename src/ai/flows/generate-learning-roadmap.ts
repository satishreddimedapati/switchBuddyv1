
'use server';

/**
 * @fileOverview A flow to generate a personalized learning roadmap.
 */

import { ai } from '@/ai/genkit';
import { RoadmapGenerationInputSchema, RoadmapGenerationOutputSchema } from '@/lib/types';
import { z } from 'zod';

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
- Goals: {{#each goals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Experience Level: {{{experienceLevel}}}
- Tech Focus: {{#each techFocus}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Preferred Learning Style: {{{learningStyle}}}

Based on these inputs, create a structured roadmap. The roadmap should be broken down into weeks. Each week should have a clear theme. Each day within the week should have a specific topic, a suggested resource type (e.g., 'Video', 'Article', 'Interactive Tutorial'), a small challenge or exercise, and a calculated date.

Rules:
1. The total number of days in the plan must match the user's selected 'duration'.
2. Group the daily tasks into weeks (7 days per week). The last week might have fewer than 7 days.
3. The daily tasks should be realistic for the user's specified time commitment.
4. The content and complexity must be appropriate for the user's experience level.
5. The resource types and challenges should align with the user's preferred learning style.
6. If the learning style is Video, suggest a conceptual YouTube link. If it's reading, suggest a blog or documentation link.
7. The goals should influence the focus of the roadmap. A 'Job Switch' goal should prioritize practical, interview-centric topics. A 'Startup Project' goal should include project-building milestones.
8. For each daily_task, calculate and include a 'date' field in "YYYY-MM-DD" format. The first task should have the provided 'startDate', and each subsequent task should be one day after the previous one.
9. The 'day' field should be the day of the week, e.g., 'Monday'.

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
    return output!;
  }
);
