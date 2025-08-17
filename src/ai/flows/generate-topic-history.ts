
'use server';

/**
 * @fileOverview A flow to generate interesting historical facts about a technology topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TopicHistoryInputSchema = z.object({
  topic: z.string().describe('The technology topic to get history for.'),
});

export const TopicHistorySchema = z.object({
    emoji: z.string().describe("A single emoji that represents the fact."),
    title: z.string().describe("A short, catchy title for the fact (e.g., 'The Inventor')."),
    fact: z.string().describe("A single, interesting fact or piece of trivia about the topic."),
});
export type TopicHistory = z.infer<typeof TopicHistorySchema>;

const TopicHistoryOutputSchema = z.object({
  history: z.array(TopicHistorySchema).length(7).describe('An array of 7 interesting historical facts about the topic.'),
});

export type TopicHistoryOutput = z.infer<typeof TopicHistoryOutputSchema>;


export async function generateTopicHistory(input: z.infer<typeof TopicHistoryInputSchema>): Promise<TopicHistoryOutput> {
    return generateTopicHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTopicHistoryPrompt',
  input: { schema: TopicHistoryInputSchema },
  output: { schema: TopicHistoryOutputSchema },
  prompt: `You are a tech historian and storyteller. Your goal is to generate exactly 7 engaging, bite-sized facts about a given technology topic.

Make the facts interesting and fun to read, like something you'd see in a museum exhibit or an Instagram story.

For the topic "{{topic}}", provide facts covering:
- Who invented it and when.
- What problem it was designed to solve.
- An early "aha!" moment or breakthrough.
- A major company that famously uses it.
- A surprising or little-known piece of trivia.
- Its original name or a funny codename.
- Its biggest competitor or alternative.

For each fact, provide a relevant emoji, a short title, and the fact itself.
`,
});

const generateTopicHistoryFlow = ai.defineFlow(
  {
    name: 'generateTopicHistoryFlow',
    inputSchema: TopicHistoryInputSchema,
    outputSchema: TopicHistoryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
