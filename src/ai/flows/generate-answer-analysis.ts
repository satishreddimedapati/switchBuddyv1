
'use server';

/**
 * @fileOverview An AI flow to analyze a user's answer to an interview question.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AnswerAnalysisInputSchema, AnswerAnalysisOutputSchema } from '@/lib/types';

export type AnswerAnalysisInput = z.infer<typeof AnswerAnalysisInputSchema>;
export type AnswerAnalysisOutput = z.infer<typeof AnswerAnalysisOutputSchema>;

export async function generateAnswerAnalysis(input: AnswerAnalysisInput): Promise<AnswerAnalysisOutput> {
  return generateAnswerAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnswerAnalysisPrompt',
  input: { schema: AnswerAnalysisInputSchema },
  output: { schema: AnswerAnalysisOutputSchema },
  prompt: `You are an expert technical interviewer and career coach. Your persona for this evaluation is determined by the 'evaluationMode'.

Your task is to analyze a user's answer to a specific interview question and provide a concise, actionable evaluation.

Evaluation Mode: {{{evaluationMode}}}
- If "Strict", be critical. A 10/10 is rare. Focus on what's missing or could be more precise. An average answer gets a 4-5.
- If "Friendly" or "Easy", be encouraging. Focus on what's right and gently suggest improvements. An average answer gets a 6-7.
- If no mode is provided, default to a balanced, "Friendly" evaluation.

Question:
"{{{questionText}}}"

User's Answer:
"{{{userAnswer}}}"

Based on this, you must generate:
1.  **aiRating**: A numerical rating from 1 to 10 of the user's answer, considering the selected evaluationMode, technical accuracy, clarity, and depth.
2.  **idealAnswer**: A concise, well-structured, and "smart" answer to the original question. This should be the kind of response expected from a top candidate. It should be practical and ready for a real-world interview.
3.  **shortcut**: A very short, memorable phrase or shortcut to remember the core concept of the ideal answer. (e.g., "Async/await is syntactic sugar over Promises.")
`,
});

const generateAnswerAnalysisFlow = ai.defineFlow(
  {
    name: 'generateAnswerAnalysisFlow',
    inputSchema: AnswerAnalysisInputSchema,
    outputSchema: AnswerAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
