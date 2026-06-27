
'use server';

/**
 * @fileOverview A flow to generate a follow-up question based on a user's answer.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import {z} from 'zod';
import { 
    GenerateFollowUpQuestionRequestSchema,
    GenerateFollowUpQuestionResponseSchema,
} from '@/lib/types';

export type GenerateFollowUpQuestionRequest = z.infer<typeof GenerateFollowUpQuestionRequestSchema>;
export type GenerateFollowUpQuestionResponse = z.infer<typeof GenerateFollowUpQuestionResponseSchema>;


export async function generateFollowUpQuestion(input: GenerateFollowUpQuestionRequest): Promise<GenerateFollowUpQuestionResponse> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert interviewer who provides subtle hints to encourage deeper thinking.

Based on the user's answer to the original question, provide one short, encouraging hint or a "what if" scenario. Your goal is to prompt the user to think more deeply, not to ask another direct question.

- If the answer seems correct, suggest an edge case or an optimization to consider.
- If the answer seems vague, gently prompt for more detail without asking "why" or "how".
- If the answer seems partially wrong, pose a "what if" scenario that challenges the incorrect part.

Original Question:
"{{{question}}}"

User's Answer:
"{{{answer}}}"

Your response should be a hint, not a question. For example: "That's a good start. Now, consider how that approach would handle very large datasets." or "Interesting. What if the input array contained duplicate values?"
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GenerateFollowUpQuestionResponseSchema },
  });

  return result.output as GenerateFollowUpQuestionResponse;
}






