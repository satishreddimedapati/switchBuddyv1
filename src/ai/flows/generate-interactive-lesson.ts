
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
  prompt: `You are an expert curriculum designer creating engaging, interactive micro-learning experiences.

Your task is to generate a complete, card-based interactive learning deck for the given topic, tailored to the user's experience level.

Topic: {{{topic}}}
Experience Level: {{{experienceLevel}}}

The entire response MUST be a single JSON object. This object must contain:
1.  A 'title' property: A main, engaging title for the entire lesson deck.
2.  A 'cards' property: An array containing exactly 7 cards in a logical learning sequence.

The card types must follow this exact order to create a compelling learning flow:
1.  **concept**: Start with a simple, visual analogy.
2.  **concept**: Follow up with a more formal definition and brief explanation.
3.  **code_snippet**: Provide a clear, simple code example. For this card, you MUST provide 'code' and 'language' properties.
4.  **challenge_mcq**: A multiple-choice question to check basic understanding. For this card, you MUST provide 'options' (an array of 3 strings), a 'correct_option_index' (0, 1, or 2), and a brief 'explanation'.
5.  **scenario**: A short, real-world scenario question that requires applying the knowledge.
6.  **reflection**: An open-ended question to make the user think and articulate the concept in their own words.
7.  **concept**: A final recap or summary card to reinforce the key takeaway.

For EVERY card, you must provide:
- A valid 'card_type'.
- A 'title'.
- 'content' (the main text for the card).
- A relevant 'visual' emoji.

Example of the required final JSON structure:
{
  "title": "Your Engaging Lesson Title Here",
  "cards": [
    {
      "card_type": "concept",
      "title": "Card 1 Title",
      "content": "Card 1 content...",
      "visual": "💡"
    },
    {
      "card_type": "concept",
      "title": "Card 2 Title",
      "content": "Card 2 content...",
      "visual": "🧠"
    }
    // ...and so on for all 7 cards in the correct order
  ]
}

Generate the output as a single, valid JSON object that strictly follows all rules and the provided schema.
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
    if (!output || !output.title || !output.cards || output.cards.length === 0) {
        throw new Error("The AI failed to generate a valid lesson deck with a title and cards. Please try again.");
    }
    return output;
  }
);
