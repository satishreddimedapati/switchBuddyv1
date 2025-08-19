
'use server';

/**
 * @fileOverview A flow to generate a follow-up question based on a user's answer.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { 
    GenerateFollowUpQuestionRequestSchema,
    GenerateFollowUpQuestionResponseSchema,
} from '@/lib/types';

export type GenerateFollowUpQuestionRequest = z.infer<typeof GenerateFollowUpQuestionRequestSchema>;
export type GenerateFollowUpQuestionResponse = z.infer<typeof GenerateFollowUpQuestionResponseSchema>;

export async function generateFollowUpQuestion(input: GenerateFollowUpQuestionRequest): Promise<GenerateFollowUpQuestionResponse> {
  return generateFollowUpQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFollowUpQuestionPrompt',
  input: {schema: GenerateFollowUpQuestionRequestSchema},
  output: {schema: GenerateFollowUpQuestionResponseSchema},
  prompt: `You are an expert interviewer who provides subtle hints to encourage deeper thinking.

Based on the user's answer to the original question, provide one short, encouraging hint or a "what if" scenario. Your goal is to prompt the user to think more deeply, not to ask another direct question.

- If the answer seems correct, suggest an edge case or an optimization to consider.
- If the answer seems vague, gently prompt for more detail without asking "why" or "how".
- If the answer seems partially wrong, pose a "what if" scenario that challenges the incorrect part.

Original Question:
"{{{question}}}"

User's Answer:
"{{{answer}}}"

Your response should be a hint, not a question. For example: "That's a good start. Now, consider how that approach would handle very large datasets." or "Interesting. What if the input array contained duplicate values?"
`,
});

const generateFollowUpQuestionFlow = ai.defineFlow(
  {
    name: 'generateFollowUpQuestionFlow',
    inputSchema: GenerateFollowUpQuestionRequestSchema,
    outputSchema: GenerateFollowUpQuestionResponseSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

