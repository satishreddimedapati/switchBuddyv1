
'use server';

/**
 * @fileOverview A flow to suggest relevant YouTube channels for a learning topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ChannelSuggestionInputSchema = z.object({
  topic: z.string().describe('The main topic the user wants to learn.'),
});
export type ChannelSuggestionInput = z.infer<typeof ChannelSuggestionInputSchema>;

export const ChannelSuggestionOutputSchema = z.object({
  channels: z.array(z.string()).describe('A list of 3-5 recommended YouTube channel or creator names.'),
});
export type ChannelSuggestionOutput = z.infer<typeof ChannelSuggestionOutputSchema>;

export async function generateChannelSuggestions(input: ChannelSuggestionInput): Promise<ChannelSuggestionOutput> {
    return generateChannelSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChannelSuggestionsPrompt',
  input: { schema: ChannelSuggestionInputSchema },
  output: { schema: ChannelSuggestionOutputSchema },
  prompt: `You are an expert at recommending educational content on YouTube.

Based on the topic "{{topic}}", suggest a list of 3 to 5 of the best YouTube channels or creators for learning this topic.

Return only the names of the channels/creators. For example: "freeCodeCamp.org", "Mosh Hamedani", "Traversy Media".
`,
});

const generateChannelSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateChannelSuggestionsFlow',
    inputSchema: ChannelSuggestionInputSchema,
    outputSchema: ChannelSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
