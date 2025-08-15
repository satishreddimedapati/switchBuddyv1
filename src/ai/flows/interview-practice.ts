'use server';

/**
 * @fileOverview AI flows for conducting mock interviews.
 *
 * - generateInterviewQuestion: Creates a single interview question.
 * - evaluateAnswer: Evaluates a user's answer to a question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { 
    InterviewQuestionRequestSchema,
    GenerateInterviewQuestionsRequestSchema,
    GenerateInterviewQuestionsResponseSchema,
    AnswerEvaluationRequestSchema, 
    AnswerEvaluationResponseSchema,
    EvaluateInterviewAnswersRequestSchema,
    EvaluateInterviewAnswersResponseSchema
} from '@/lib/types';

export type InterviewQuestionRequest = z.infer<typeof InterviewQuestionRequestSchema>;
export type GenerateInterviewQuestionsRequest = z.infer<typeof GenerateInterviewQuestionsRequestSchema>;
export type GenerateInterviewQuestionsResponse = z.infer<typeof GenerateInterviewQuestionsResponseSchema>;
export type AnswerEvaluationRequest = z.infer<typeof AnswerEvaluationRequestSchema>;
export type AnswerEvaluationResponse = z.infer<typeof AnswerEvaluationResponseSchema>;
export type EvaluateInterviewAnswersRequest = z.infer<typeof EvaluateInterviewAnswersRequestSchema>;
export type EvaluateInterviewAnswersResponse = z.infer<typeof EvaluateInterviewAnswersResponseSchema>;


// Flow to generate a list of interview questions
const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsRequestSchema},
  output: {schema: GenerateInterviewQuestionsResponseSchema},
  prompt: `You are an expert interviewer for a top tech company.

Generate {{numberOfQuestions}} interview questions based on the following criteria:
- Topic: {{{topic}}}
- Difficulty: {{{difficulty}}}

The questions should be clear, concise, and relevant to the specified topic and difficulty level.
Do not add any preamble or explanation, just the questions.
`,
});

export const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsRequestSchema,
    outputSchema: GenerateInterviewQuestionsResponseSchema,
  },
  async (input) => {
    const {output} = await generateQuestionsPrompt(input);
    return output!;
  }
);

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsRequest
): Promise<GenerateInterviewQuestionsResponse> {
  return generateInterviewQuestionsFlow(input);
}


// Flow to evaluate a list of answers
const evaluateAnswersPrompt = ai.definePrompt({
    name: 'evaluateInterviewAnswersPrompt',
    input: {schema: EvaluateInterviewAnswersRequestSchema},
    output: {schema: EvaluateInterviewAnswersResponseSchema},
    prompt: `You are an expert interviewer providing feedback on a series of mock interview questions.

Evaluate each question and answer pair provided in the input. For each pair:
1.  Provide constructive, specific feedback on the answer. Mention what was good and what could be improved.
2.  Give a rating from 1 to 10, where 1 is a very poor answer and 10 is an excellent, comprehensive answer.
3.  Your feedback should be encouraging but also direct and helpful for the candidate to improve.
4.  Return an array of evaluations in the exact same order as the questions were provided.

Here is the interview session:
{{#each qa_pairs}}
---
Question {{this.qNo}}:
"{{{this.question}}}"

Candidate's Answer:
"{{{this.answer}}}"
---
{{/each}}
`
});

export const evaluateInterviewAnswersFlow = ai.defineFlow(
    {
        name: 'evaluateInterviewAnswersFlow',
        inputSchema: EvaluateInterviewAnswersRequestSchema,
        outputSchema: EvaluateInterviewAnswersResponseSchema,
    },
    async (input) => {
        const {output} = await evaluateAnswersPrompt(input);
        return output!;
    }
);

export async function evaluateInterviewAnswers(
    input: EvaluateInterviewAnswersRequest
): Promise<EvaluateInterviewAnswersResponse> {
    return evaluateInterviewAnswersFlow(input);
}
