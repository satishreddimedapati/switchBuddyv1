
'use server';

/**
 * @fileOverview A flow to generate an interactive, card-based lesson dynamically.
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
1.  A "title" property: A main, engaging title for the entire lesson deck.
2.  A "cards" property: An array containing exactly 7 cards in a logical learning sequence.

The card types must follow this exact order:
1.  concept → Start with a simple analogy or visual explanation.
2.  concept → Formal definition + explanation.
3.  code_snippet → A minimal, clear code example. Must include "code" and "language".
4.  challenge_mcq → A multiple-choice question. Must include "options" (an array of 3 strings), "correct_option_index" (a number from 0–2), and an "explanation" for the answer.
5.  scenario → A short real-world situation to apply the knowledge.
6.  reflection → An open-ended question to make the learner think.
7.  concept → A recap/summary to reinforce the key takeaway.

For EVERY card:
- "card_type" is required.
- "title" is required.
- "content" is required.
- "visual" is required (use a relevant emoji).
- No extra properties outside the schema.

Example of the required JSON structure:
{
  "title": "Learning JavaScript Promises",
  "cards": [
    {
      "card_type": "concept",
      "title": "The Pizza Analogy",
      "content": "A Promise is like ordering a pizza. You get a receipt (the Promise) right away, which isn't the pizza, but it guarantees you'll get it eventually!",
      "visual": "🍕"
    }
  ]
}

Do not include any text, markdown, or formatting outside of the single, final JSON object.`,
});

const generateInteractiveLessonFlow = ai.defineFlow(
  {
    name: 'generateInteractiveLessonFlow',
    inputSchema: GenerateInteractiveLessonInputSchema,
    outputSchema: InteractiveLessonSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);

      if (!output) {
        throw new Error("The AI returned an empty response. Please try again.");
      }
      
      // Explicitly check for the required properties to provide a better error message.
      if (!output.title || !output.cards || !Array.isArray(output.cards)) {
        console.error("Malformed AI response:", output);
        throw new Error("The AI failed to generate a valid lesson with a title and cards array. Please check the AI's response format.");
      }
      
      return output;
      
    } catch (e: any) {
      console.error("Error in generateInteractiveLessonFlow:", e);
      // Attempt to recover if the AI only returned the cards array
      if (e.message && e.message.includes("must have required property 'title'") && e.output) {
        try {
          // Sometimes the raw output from the model is a string that needs to be parsed
          const potentialJson = e.output.replace(/```json\n?/, '').replace(/```$/, '');
          const parsedOutput = JSON.parse(potentialJson);

          if (parsedOutput.cards && Array.isArray(parsedOutput.cards)) {
            console.warn("AI response was missing a title. Adding a default title and returning.");
            return {
              title: `Interactive Lesson: ${input.topic}`,
              cards: parsedOutput.cards,
            };
          }
        } catch (parseError) {
           throw new Error(`Failed to generate a valid lesson. The AI returned malformed JSON. Original error: ${e.message}`);
        }
      }
      // Re-throw the original error if recovery is not possible
      throw new Error(`Could not generate lesson: ${e.message}`);
    }
  }
);
