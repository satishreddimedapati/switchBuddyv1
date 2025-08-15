'use server';

/**
 * @fileOverview AI flows for conducting mock interviews.
 *
 * - generateInterviewQuestion: Creates a single interview question.
 * - evaluateAnswer: Evaluates a user's answer to a question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { InterviewQuestionRequestSchema, InterviewQuestionResponseSchema, AnswerEvaluationRequestSchema, AnswerEvaluationResponseSchema } from '@/lib/types';

export type InterviewQuestionRequest = z.infer<typeof InterviewQuestionRequestSchema>;
export type InterviewQuestionResponse = z.infer<typeof InterviewQuestionResponseSchema>;
export type AnswerEvaluationRequest = z.infer<typeof AnswerEvaluationRequestSchema>;
export type AnswerEvaluationResponse = z.infer<typeof AnswerEvaluationResponseSchema>;


// Flow to generate a single interview question
const generateQuestionPrompt = ai.definePrompt({
  name: 'generateInterviewQuestionPrompt',
  input: {schema: InterviewQuestionRequestSchema},
  output: {schema: InterviewQuestionResponseSchema},
  prompt: `You are an expert interviewer for a top tech company.

Generate ONE interview question based on the following criteria:
- Topic: {{{topic}}}
- Difficulty: {{{difficulty}}}

The question should be clear, concise, and relevant to the specified topic and difficulty level.
Do not add any preamble or explanation, just the question itself.
`,
});

export const generateInterviewQuestionFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionFlow',
    inputSchema: InterviewQuestionRequestSchema,
    outputSchema: InterviewQuestionResponseSchema,
  },
  async (input) => {
    const {output} = await generateQuestionPrompt(input);
    return output!;
  }
);

export async function generateInterviewQuestion(
  input: InterviewQuestionRequest
): Promise<InterviewQuestionResponse> {
  return generateInterviewQuestionFlow(input);
}


// Flow to evaluate an answer
const evaluateAnswerPrompt = ai.definePrompt({
    name: 'evaluateAnswerPrompt',
    input: {schema: AnswerEvaluationRequestSchema},
    output: {schema: AnswerEvaluationResponseSchema},
    prompt: `You are an expert interviewer providing feedback.

Question:
"{{{question}}}"

Candidate's Answer:
"{{{answer}}}"

Your task is to:
1.  Provide constructive, specific feedback on the answer. Mention what was good and what could be improved.
2.  Give a rating from 1 to 10, where 1 is a very poor answer and 10 is an excellent, comprehensive answer.
3.  Your feedback should be encouraging but also direct and helpful for the candidate to improve.
`
});

export const evaluateAnswerFlow = ai.defineFlow(
    {
        name: 'evaluateAnswerFlow',
        inputSchema: AnswerEvaluationRequestSchema,
        outputSchema: AnswerEvaluationResponseSchema,
    },
    async (input) => {
        const {output} = await evaluateAnswerPrompt(input);
        return output!;
    }
);

export async function evaluateAnswer(
    input: AnswerEvaluationRequest
): Promise<AnswerEvaluationResponse> {
    return evaluateAnswerFlow(input);
}
