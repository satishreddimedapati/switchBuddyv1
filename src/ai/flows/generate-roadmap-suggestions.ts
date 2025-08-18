
'use server';

/**
 * @fileOverview A flow to suggest an optimal learning schedule based on a topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RoadmapSuggestionInputSchema = z.object({
  topic: z.string().describe('The main topic the user wants to learn.'),
});
export type RoadmapSuggestionInput = z.infer<typeof RoadmapSuggestionInputSchema>;

const RoadmapSuggestionOutputSchema = z.object({
  suggestedTimePerDay: z.number().int().describe('The suggested number of minutes to study per day (e.g., 90 for 1.5 hours).'),
  suggestedDurationDays: z.number().int().describe('The suggested total number of days for the learning plan.'),
  totalEffortHours: z.number().describe("The AI's estimated total hours required to learn the topic."),
  reasoning: z.string().describe('A brief explanation for the suggestions.'),
});
export type RoadmapSuggestionOutput = z.infer<typeof RoadmapSuggestionOutputSchema>;

export async function generateRoadmapSuggestions(input: RoadmapSuggestionInput): Promise<RoadmapSuggestionOutput> {
    return generateRoadmapSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRoadmapSuggestionsPrompt',
  input: { schema: RoadmapSuggestionInputSchema },
  output: { schema: RoadmapSuggestionOutputSchema },
  prompt: `You are an expert curriculum planner for a tech learning platform.

Your task is to suggest a realistic and effective learning schedule (daily time commitment and total duration) for the given topic, and estimate the total effort required.

Topic: {{{topic}}}

Consider the complexity and breadth of the topic. A complex topic like "Full Stack .NET" will require more time than a simple one like "CSS Flexbox".

- Suggest a reasonable 'timePerDay' in minutes (between 30 and 180).
- Suggest a realistic 'duration' in days (between 7 and 90).
- Estimate the 'totalEffortHours' required to master this topic for a beginner.
- Provide a brief 'reasoning' for your suggestion.

For example, for ".NET Full Stack with Angular", you might suggest 90 minutes per day for 60 days, with a total effort of 90 hours. For "SQL Basics", you might suggest 45 minutes per day for 15 days, with a total effort of 12 hours.
`,
});

const generateRoadmapSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateRoadmapSuggestionsFlow',
    inputSchema: RoadmapSuggestionInputSchema,
    outputSchema: RoadmapSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
