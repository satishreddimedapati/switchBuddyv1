'use server';

/**
 * @fileOverview AI flows for conducting mock interviews.
 *
 * - generateInterviewQuestions: Creates interview questions.
 * - evaluateInterviewAnswers: Evaluates a user's answer to questions.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { z } from 'zod';
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

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsRequest
): Promise<GenerateInterviewQuestionsResponse> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert interviewer for a top tech company. You must adopt one of the following personas based on the user's selection.

Your selected persona is: "{{persona}}"

Here are the available personas and their instructions:
- "Strict": You must be direct, ask only technical questions, and do not provide any encouragement. Your tone is serious and professional.
- "Friendly": You are encouraging and helpful. You can provide hints if the candidate is stuck. Your tone is warm and supportive.
- "Rapid-Fire": You ask short, concise questions in quick succession to test the candidate's speed and breadth of knowledge. Limit answer time implicitly.
- "HR": You focus on soft skills, behavioral questions, and cultural fit. Ask about past experiences, teamwork, and problem-solving approaches.

Based on the selected "{{persona}}", generate {{numberOfQuestions}} interview questions based on the following criteria:
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
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\\s*' + key + '\\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{\\s*' + key + '\\s*}}', 'g'), (input as any)[key]);
  }
  
  if (input.pastQuestions && input.pastQuestions.length > 0) {
    let pastQList = '';
    for (const pq of input.pastQuestions) {
        pastQList += `- ${pq}\n`;
    }
    finalPrompt = finalPrompt.replace('{{#each pastQuestions}}\n- {{{this}}}\n{{/each}}', pastQList);
    finalPrompt = finalPrompt.replace('{{#if allowRepetition}}', '');
    finalPrompt = finalPrompt.replace('{{else}}', '');
    finalPrompt = finalPrompt.replace('{{/if}}', '');
  } else {
    // If no past questions, assume we can repeat
    finalPrompt = finalPrompt.replace(/{{#if allowRepetition}}[\s\S]*?{{else}}/, '');
    finalPrompt = finalPrompt.replace(/{{#each pastQuestions}}[\s\S]*?{{\/if}}/, '');
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GenerateInterviewQuestionsResponseSchema },
  });

  return result.output as GenerateInterviewQuestionsResponse;
}

export async function evaluateInterviewAnswers(
    input: EvaluateInterviewAnswersRequest
): Promise<EvaluateInterviewAnswersResponse> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert interviewer providing feedback on a series of mock interview questions.

Evaluate each question and answer pair provided in the input. For each pair:
1.  Provide constructive, specific feedback on the candidate's answer. If a whiteboard answer is provided, interpret it as a logical explanation (pseudocode, flowchart, etc.) and give feedback on the approach, not just syntax.
2.  Generate a well-structured, ideal answer to the original question. This should be the kind of response you'd expect from a top candidate.
3.  Give a rating from 1 to 10, where 1 is a very poor answer and 10 is an excellent, comprehensive answer.
4.  Your feedback should be encouraging but also direct and helpful for the candidate to improve.
5.  Return an array of evaluations in the exact same order as the questions were provided.

Here is the interview session:
`;
  if (input.qa_pairs) {
      for (const pair of input.qa_pairs) {
          finalPrompt += `---
Question ${pair.qNo}:
"${pair.question}"

Candidate's Text Answer:
"${pair.answer}"

Candidate's Whiteboard Explanation:
"${pair.whiteboard || ''}"
---
`;
      }
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: EvaluateInterviewAnswersResponseSchema },
  });

  return result.output as EvaluateInterviewAnswersResponse;
}
