
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
  // We remove the output schema here to get the raw text, which we will parse manually.
  prompt: `You are an expert curriculum designer creating engaging, interactive micro-learning experiences.

Your task is to generate a complete, 7-8 card interactive learning deck for the given topic.

Topic: {{{topic}}}
Experience Level: {{{experienceLevel}}}

The entire response MUST be a single JSON object. This object must contain:
1.  A "title" property: An engaging title for the lesson, matching the topic.
2.  A "cards" property: An array containing 7 to 8 cards in a logical learning sequence.

The card types should follow a logical flow and can include:
- 'simple_explanation': Explain the core concept simply. Use an analogy.
- 'real_world_example': Provide a clear, real-world example.
- 'pros_cons': List 2-3 key advantages (pros) and disadvantages (cons). Format as "Pros:\\n- ...\\n\\nCons:\\n- ...".
- 'when_to_use': Provide clear scenarios for when this is a good choice vs. a bad choice. Format as "Use When:\\n- ...\\n\\nDon't Use When:\\n- ...".
- 'interview_qa': Provide 2-3 common interview questions and their concise answers. Format as "Q: ...\\nA: ...".
- 'fun_fact': A surprising or little-known piece of trivia.
- 'company_use_cases': Name 2-3 companies and briefly explain how they use this technology.

For EVERY card:
- "card_type", "title", "content", and "visual" (a single emoji) are required.
- Do not include any text, markdown, or formatting outside of the single, final JSON object.
`,
});

const generateInteractiveLessonFlow = ai.defineFlow(
  {
    name: 'generateInteractiveLessonFlow',
    inputSchema: GenerateInteractiveLessonInputSchema,
    outputSchema: InteractiveLessonSchema,
  },
  async (input) => {
    let response;
    try {
      // Get the raw text response from the prompt
      response = await prompt(input);
      const rawText = response.text;
      
      // Find the start and end of the JSON object
      const startIndex = rawText.indexOf('{');
      const endIndex = rawText.lastIndexOf('}');
      
      if (startIndex === -1 || endIndex === -1) {
        throw new Error("Could not find a valid JSON object in the AI response.");
      }
      
      const jsonString = rawText.substring(startIndex, endIndex + 1);
      
      // Parse the extracted JSON string
      const parsedJson = JSON.parse(jsonString);

      // Validate the parsed JSON against our Zod schema
      const validationResult = InteractiveLessonSchema.safeParse(parsedJson);

      if (validationResult.success) {
        // If the title is missing but cards are present, add a default title.
        if (!validationResult.data.title && validationResult.data.cards) {
            validationResult.data.title = `Interactive Lesson: ${input.topic}`;
        }
        return validationResult.data;
      } else {
        // Throw the Zod validation error if parsing failed
        throw new Error(`Parsed JSON failed validation: ${validationResult.error.message}`);
      }

    } catch (e: any) {
      console.error("Error in generateInteractiveLessonFlow:", e);
      // Construct a helpful error message
      const finalError = new Error(
        `Failed to generate a valid lesson. The AI returned malformed JSON that could not be repaired. Original error: ${e.message}`
      );
      throw finalError;
    }
  }
);
