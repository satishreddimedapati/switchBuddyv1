

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
  prompt: `You are an expert interviewer for a top tech company, acting with a specific persona.

Your persona is: {{persona}}
{{#if (eq persona "Strict")}}
You must be direct, ask only technical questions, and do not provide any encouragement. Your tone is serious and professional.
{{/if}}
{{#if (eq persona "Friendly")}}
You are encouraging and helpful. You can provide hints if the candidate is stuck. Your tone is warm and supportive.
{{/if}}
{{#if (eq persona "Rapid-Fire")}}
You ask short, concise questions in quick succession to test the candidate's speed and breadth of knowledge. Limit answer time implicitly.
{{/if}}
{{#if (eq persona "HR")}}
You focus on soft skills, behavioral questions, and cultural fit. Ask about past experiences, teamwork, and problem-solving approaches.
{{/if}}


Generate {{numberOfQuestions}} interview questions based on the following criteria:
- Topic: {{{topic}}}
- Difficulty: {{{difficulty}}}

{{#if allowRepetition}}
The questions should be clear, concise, and relevant.
{{else}}
The user wants unique questions. Do NOT repeat any questions from the following list of past questions. Generate new questions that cover different aspects of the topic.

Past Questions:
{{#each pastQuestions}}
- {{{this}}}
{{/each}}
{{/if}}

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
1.  Provide constructive, specific feedback on the candidate's answer. If a whiteboard answer is provided, interpret it as a logical explanation (pseudocode, flowchart, etc.) and give feedback on the approach, not just syntax.
2.  Generate a well-structured, ideal answer to the original question. This should be the kind of response you'd expect from a top candidate.
3.  Give a rating from 1 to 10, where 1 is a very poor answer and 10 is an excellent, comprehensive answer.
4.  Your feedback should be encouraging but also direct and helpful for the candidate to improve.
5.  Return an array of evaluations in the exact same order as the questions were provided.

Here is the interview session:
{{#each qa_pairs}}
---
Question {{this.qNo}}:
"{{{this.question}}}"

Candidate's Text Answer:
"{{{this.answer}}}"

Candidate's Whiteboard Explanation:
"{{{this.whiteboard}}}"
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
