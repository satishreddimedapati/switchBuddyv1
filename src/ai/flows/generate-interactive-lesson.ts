'use server';

/**
 * @fileOverview A flow to generate an interactive, card-based lesson dynamically.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { GenerateInteractiveLessonInputSchema, InteractiveLessonSchema } from '@/lib/types';

export type GenerateInteractiveLessonInput = z.infer<typeof GenerateInteractiveLessonInputSchema>;
export type InteractiveLesson = z.infer<typeof InteractiveLessonSchema>;

export async function generateInteractiveLesson(input: GenerateInteractiveLessonInput): Promise<InteractiveLesson> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert curriculum designer creating engaging, interactive micro-learning experiences.

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
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\\s*' + key + '\\s*}}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt
  });

  try {
    let rawText = result.text;
    const startIndex = rawText.indexOf('{');
    const endIndex = rawText.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("Could not find a valid JSON object in the AI response.");
    }
    const jsonString = rawText.substring(startIndex, endIndex + 1);
    const parsedJson = JSON.parse(jsonString);
    const validationResult = InteractiveLessonSchema.safeParse(parsedJson);

    if (validationResult.success) {
      if (!validationResult.data.title && validationResult.data.cards) {
          validationResult.data.title = `Interactive Lesson: ${input.topic}`;
      }
      return validationResult.data;
    } else {
      throw new Error(`Parsed JSON failed validation: ${validationResult.error.message}`);
    }
  } catch (e: any) {
    console.error("Error in generateInteractiveLesson:", e);
    throw new Error(`Failed to generate a valid lesson. Original error: ${e.message}`);
  }
}
