
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
      response = await prompt(input);
      const output = response.output;

      // Happy path: valid output
      if (output && output.title && output.cards && Array.isArray(output.cards)) {
        return output;
      }
      
      // Recovery Path 1: Output is an object but missing title
      if (output && !output.title && (output as any).cards && Array.isArray((output as any).cards)) {
         console.warn("Attempting to recover from malformed JSON by adding a title.");
         return {
            title: `Interactive Lesson: ${input.topic}`,
            cards: (output as any).cards,
         };
      }
      
      // If we reach here, something is wrong with the output format.
      // We will let the catch block handle it.
      throw new Error("Initial validation failed, proceeding to catch block.");

    } catch (e: any) {
      console.error("Error in generateInteractiveLessonFlow, attempting recovery:", e.message);

      // Recovery Path 2: The error contains the raw output string that might be fixable
      const rawOutput = response?.output as any || e.cause?.output || e.message || '';
      const rawString = String(rawOutput);

      try {
        const startIndex = rawString.indexOf('{');
        const endIndex = rawString.lastIndexOf('}');
        if (startIndex !== -1 && endIndex > startIndex) {
          const jsonString = rawString.substring(startIndex, endIndex + 1);
          const parsedOutput = JSON.parse(jsonString) as InteractiveLesson;

          if (parsedOutput.cards && Array.isArray(parsedOutput.cards)) {
            if (!parsedOutput.title) {
                parsedOutput.title = `Interactive Lesson: ${input.topic}`;
                console.warn("Recovered from malformed AI response (string parsing). Added missing title.");
            } else {
                 console.warn("Recovered from malformed AI response (string parsing).");
            }
            return parsedOutput;
          }
        }
      } catch (parseError) {
         throw new Error(`Failed to generate a valid lesson. The AI returned malformed JSON that could not be recovered. Original error: ${e.message}`);
      }
      
      // If all recovery attempts fail, throw final error.
      throw new Error(`Could not generate lesson. The AI response was not in the expected format and could not be repaired. Please try again.`);
    }
  }
);
