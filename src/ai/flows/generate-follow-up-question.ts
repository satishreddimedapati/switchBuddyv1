
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
  prompt: `You are an expert interviewer who asks insightful follow-up questions.

Based on the user's answer to the original question, ask one short, relevant counter-question.

- If the answer seems correct, ask for optimization, an edge case, or an alternative approach.
- If the answer seems vague, ask for a specific example or clarification.
- If the answer seems partially wrong, gently probe the incorrect part by posing a "what if" scenario.

Original Question:
"{{{question}}}"

User's Answer:
"{{{answer}}}"

Your follow-up question should be concise and directly related to the user's response.
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
