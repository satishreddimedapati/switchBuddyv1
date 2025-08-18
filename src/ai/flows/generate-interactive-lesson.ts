
'use server';

/**
 * @fileOverview A flow to generate an interactive, card-based lesson.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateInteractiveLessonInputSchema, InteractiveLessonSchema } from '@/lib/types';

export type GenerateInteractiveLessonInput = z.infer<typeof GenerateInteractiveLessonInputSchema>;
export type InteractiveLesson = z.infer<typeof InteractiveLessonSchema>;

export async function generateInteractiveLesson(input: GenerateInteractiveLessonInput): Promise<InteractiveLesson> {
    return generateInteractiveLessonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInteractiveLessonPrompt',
  input: { schema: GenerateInteractiveLessonInputSchema },
  output: { schema: InteractiveLessonSchema },
  prompt: `You are an expert curriculum designer specializing in creating engaging, interactive micro-learning experiences.

Your task is to generate a complete, card-based interactive learning deck for the given topic, tailored to the user's experience level.

Topic: {{{topic}}}
Experience Level: {{{experienceLevel}}}

The lesson deck must contain:
1.  A main 'title' for the entire lesson deck. The title should be engaging and relevant to the topic.
2.  A 'cards' array containing exactly 7 cards in a logical learning sequence.

The card types must follow this order to create a compelling learning flow:
1.  **concept**: Start with a simple, visual analogy.
2.  **concept**: Follow up with a more formal definition and brief explanation.
3.  **code_snippet**: Provide a clear, simple code example demonstrating the core idea.
4.  **challenge_mcq**: A multiple-choice question to check basic understanding of the code or concept. Provide 3 options.
5.  **scenario**: A short, real-world scenario question that requires applying the knowledge.
6.  **reflection**: An open-ended question to make the user think and articulate the concept in their own words.
7.  **concept**: A final recap or summary card to reinforce the key takeaway.

For each card, you must provide:
- A valid 'card_type'.
- A 'title'.
- 'content' (the main text for the card).
- A relevant 'visual' emoji.
- For 'challenge_mcq' cards, you MUST provide 'options', a 'correct_option_index' (0, 1, or 2), and a brief 'explanation'.
- For 'code_snippet' cards, you MUST provide 'code' and 'language'.

Generate the output as a single, valid JSON object that strictly follows the provided schema.
`,
});

const generateInteractiveLessonFlow = ai.defineFlow(
  {
    name: 'generateInteractiveLessonFlow',
    inputSchema: GenerateInteractiveLessonInputSchema,
    outputSchema: InteractiveLessonSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.cards || output.cards.length === 0) {
        throw new Error("The AI failed to generate a valid lesson deck. Please try again.");
    }
    return output;
  }
);
