
'use server';

/**
 * @fileOverview A flow to generate interesting historical facts about a technology topic.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { TopicHistoryInputSchema, TopicHistoryOutputSchema, TopicHistoryOutput } from '@/lib/types';

export async function generateTopicHistory(input: z.infer<typeof TopicHistoryInputSchema>): Promise<TopicHistoryOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error('API Key is missing. Please configure it in AI Settings.');

  const ai = createAI(apiKey, provider);

  const finalPrompt = `You are an expert technology historian.

Provide 7 concise, interesting historical facts about the topic: "{{topic}}".

Each fact should include:
- an emoji
- a short title
- a compelling fact sentence

Return the result as a JSON object matching the schema exactly.
`;

  const prompt = finalPrompt.replace(/{{\s*topic\s*}}/g, input.topic);

  const result = await ai.generate({
    prompt,
    output: { schema: TopicHistoryOutputSchema },
  });

  return result.output as TopicHistoryOutput;
}




