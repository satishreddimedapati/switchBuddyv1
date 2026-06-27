
'use server';

/**
 * @fileOverview A flow to suggest relevant YouTube channels for a learning topic.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { ChannelSuggestionInputSchema, ChannelSuggestionOutputSchema } from '@/lib/types';

export type ChannelSuggestionInput = z.infer<typeof ChannelSuggestionInputSchema>;
export type ChannelSuggestionOutput = z.infer<typeof ChannelSuggestionOutputSchema>;


export async function generateChannelSuggestions(input: ChannelSuggestionInput): Promise<ChannelSuggestionOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert at recommending educational content on YouTube.

Based on the topic "{{topic}}", suggest a list of 3 to 5 of the best YouTube channels or creators for learning this topic.

Return only the names of the channels/creators. For example: "freeCodeCamp.org", "Mosh Hamedani", "Traversy Media".
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: ChannelSuggestionOutputSchema },
  });

  return result.output as ChannelSuggestionOutput;
}





