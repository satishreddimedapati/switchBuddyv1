
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
- 'pros_cons': List 2-3 key advantages (pros) and disadvantages (cons). Format as "Pros:\n- ...\n\nCons:\n- ...".
- 'when_to_use': Provide clear scenarios for when this is a good choice vs. a bad choice.
- 'interview_qa': Provide 2-3 common interview questions and their concise answers. Format as "Q: ...\nA: ...".
- 'fun_fact': A surprising or little-known piece of trivia.
- 'company_use_cases': Name 2-3 companies and briefly explain how they use this technology.

For EVERY card:
- "card_type", "title", "content", and "visual" (a single emoji) are required.
- Do not include any text, markdown, or formatting outside of the single, final JSON object.

Example Output Structure:
{
  "title": "Learning About [Topic]",
  "cards": [
    {
      "card_type": "simple_explanation",
      "title": "What is it?",
      "content": "A simple explanation with an analogy.",
      "visual": "💡"
    },
    // ... more cards ...
    {
      "card_type": "interview_qa",
      "title": "Interview Prep",
      "content": "Q: First question?\\nA: Answer to first question.\\nQ: Second question?\\nA: Answer to second question.",
      "visual": "🤔"
    }
  ]
}
`,
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
      
      if (!output.title || !output.cards || !Array.isArray(output.cards)) {
        console.error("Malformed AI response:", output);
        // Attempt recovery from a common failure mode where it just returns the cards array
        if ((output as any).cards && Array.isArray((output as any).cards)) {
            console.warn("Attempting to recover from malformed JSON by adding a title.");
            return {
                title: `Interactive Lesson: ${input.topic}`,
                cards: (output as any).cards,
            };
        }
        throw new Error("The AI failed to generate a valid lesson with a title and cards array. Please check the AI's response format.");
      }
      
      return output;
      
    } catch (e: any) {
      console.error("Error in generateInteractiveLessonFlow:", e);
      
      let rawOutput = '';
      if (e.cause?.output) {
        rawOutput = String(e.cause.output);
      } else if (e.message) {
        rawOutput = e.message;
      }
      
      // Attempt to recover if the AI output includes junk text before the JSON
      if (rawOutput) {
        try {
          const startIndex = rawOutput.indexOf('{');
          const endIndex = rawOutput.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1) {
            const jsonString = rawOutput.substring(startIndex, endIndex + 1);
            const parsedOutput = JSON.parse(jsonString) as InteractiveLesson;

            if (!parsedOutput.title && parsedOutput.cards && Array.isArray(parsedOutput.cards)) {
                parsedOutput.title = `Interactive Lesson: ${input.topic}`;
                console.warn("Recovered from malformed AI response. Added missing title.");
                return parsedOutput;
            }

            if (parsedOutput.title && parsedOutput.cards && Array.isArray(parsedOutput.cards)) {
                console.warn("Recovered from malformed AI response. Returning parsed JSON.");
                return parsedOutput;
            }
          }
        } catch (parseError) {
           throw new Error(`Failed to generate a valid lesson. The AI returned malformed JSON that could not be recovered. Original error: ${e.message}`);
        }
      }
      
      throw new Error(`Could not generate lesson: ${e.message || 'An unknown error occurred.'}`);
    }
  }
);
