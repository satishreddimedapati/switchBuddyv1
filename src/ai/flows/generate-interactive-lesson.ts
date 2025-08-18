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

Your task is to generate a complete, 5-card interactive learning deck for the given topic.

Topic: {{{topic}}}
Experience Level: {{{experienceLevel}}}

The entire response MUST be a single JSON object. This object must contain:
1.  A "title" property: An engaging title for the lesson, matching the topic.
2.  A "cards" property: An array containing exactly 5 cards in a logical learning sequence.

The card types must follow this exact order and content:
1.  **Simple Explanation**: A card with 'card_type': 'simple_explanation'. Explain the topic in a very simple, crisp, and easy-to-understand way. Use an analogy.
2.  **Real-world Example**: A card with 'card_type': 'real_world_example'. Provide a clear, real-world example of how this topic is applied in a practical scenario.
3.  **Pros & Cons**: A card with 'card_type': 'pros_cons'. List 2-3 key advantages (pros) and 2-3 key disadvantages (cons) of the topic.
4.  **When to Use / When Not to Use**: A card with 'card_type': 'when_to_use'. Provide clear scenarios for when this technology is a good choice, and when it's better to use an alternative.
5.  **Interview Q&A**: A card with 'card_type': 'interview_qa'. Provide 2-3 common interview questions related to this topic along with their concise answers.

For EVERY card:
- "card_type" is required.
- "title" is required.
- "content" is required.
- "visual" is required (use a single, relevant emoji).
- No extra properties outside the schema.

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
      
      let rawOutput = '';
      if (e.output) {
          rawOutput = String(e.output);
      } else if (e.message) {
          rawOutput = e.message;
      }
      
      // Attempt to recover if the AI output includes junk text before the JSON
      if (rawOutput) {
        try {
          // Find the first '{' and the last '}' to extract the JSON object
          const startIndex = rawOutput.indexOf('{');
          const endIndex = rawOutput.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1) {
            const jsonString = rawOutput.substring(startIndex, endIndex + 1);
            const parsedOutput = JSON.parse(jsonString);

            // If the root 'title' is missing but 'cards' are present, fix it.
            if (!parsedOutput.title && parsedOutput.cards) {
                parsedOutput.title = `Interactive Lesson: ${input.topic}`;
                console.warn("Recovered from malformed AI response. Added missing title.");
                return parsedOutput;
            }

            // Validate the recovered JSON
             if (parsedOutput.title && parsedOutput.cards && Array.isArray(parsedOutput.cards)) {
                console.warn("Recovered from malformed AI response. Returning parsed JSON.");
                return parsedOutput;
            }
          }
        } catch (parseError) {
           throw new Error(`Failed to generate a valid lesson. The AI returned malformed JSON that could not be recovered. Original error: ${e.message}`);
        }
      }
      
      // Re-throw the original error if recovery is not possible
      throw new Error(`Could not generate lesson: ${e.message || 'An unknown error occurred.'}`);
    }
  }
);