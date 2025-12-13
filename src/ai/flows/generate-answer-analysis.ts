
'use server';

/**
 * @fileOverview An AI flow to analyze a user's answer to an interview question.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { AnswerAnalysisInputSchema, AnswerAnalysisOutputSchema } from '@/lib/types';

export type AnswerAnalysisInput = z.infer<typeof AnswerAnalysisInputSchema>;
export type AnswerAnalysisOutput = z.infer<typeof AnswerAnalysisOutputSchema>;


// New schema for bulk analysis
const BulkAnalysisInputSchema = z.object({
  questions: z.array(AnswerAnalysisInputSchema),
});

const BulkAnalysisOutputSchema = z.object({
  analyses: z.array(AnswerAnalysisOutputSchema),
});


export async function generateAnswerAnalysis(input: AnswerAnalysisInput): Promise<AnswerAnalysisOutput> {
  return generateAnswerAnalysisFlow(input);
}

// New exported function for bulk analysis
export async function generateBulkAnswerAnalysis(input: z.infer<typeof BulkAnalysisInputSchema>): Promise<z.infer<typeof BulkAnalysisOutputSchema>> {
  return generateBulkAnswerAnalysisFlow(input);
}


// --- Single Analysis Flow ---

const singleAnalysisPrompt = ai.definePrompt({
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
    const { output } = await singleAnalysisPrompt(input);
    return output!;
  }
);


// --- Bulk Analysis Flow ---

const bulkAnalysisPrompt = ai.definePrompt({
    name: 'generateBulkAnswerAnalysisPrompt',
    input: { schema: BulkAnalysisInputSchema },
    output: { schema: BulkAnalysisOutputSchema },
    prompt: `You are an expert technical interviewer. You will be given a list of interview questions, user answers, and an evaluation mode for each.

Your task is to analyze each item in the list and return a corresponding list of analyses. Each analysis must contain an 'aiRating', an 'idealAnswer', and a 'shortcut'.

Follow the rules for each evaluation mode as described:
- "Strict": Be critical. A 10/10 is rare. An average answer gets 4-5.
- "Friendly" or "Easy": Be encouraging. An average answer gets 6-7.
- Default to "Friendly" if no mode is provided.

Here is the list of questions to analyze:
{{#each questions}}
---
Question: "{{this.questionText}}"
Answer: "{{this.userAnswer}}"
Mode: {{this.evaluationMode}}
---
{{/each}}
`
});

const generateBulkAnswerAnalysisFlow = ai.defineFlow(
  {
    name: 'generateBulkAnswerAnalysisFlow',
    inputSchema: BulkAnalysisInputSchema,
    outputSchema: BulkAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await bulkAnalysisPrompt(input);
    return output!;
  }
);
