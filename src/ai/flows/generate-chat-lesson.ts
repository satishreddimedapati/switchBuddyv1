
'use server';

/**
 * @fileOverview A flow to generate a conversational, chat-based lesson on a given topic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { GenerateChatLessonInputSchema, GenerateChatLessonOutputSchema } from '@/lib/types';

export type GenerateChatLessonInput = z.infer<typeof GenerateChatLessonInputSchema>;
export type GenerateChatLessonOutput = z.infer<typeof GenerateChatLessonOutputSchema>;

export async function generateChatLesson(input: GenerateChatLessonInput): Promise<GenerateChatLessonOutput> {
    return generateChatLessonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateChatLessonPrompt',
  input: { schema: GenerateChatLessonInputSchema },
  output: { schema: GenerateChatLessonOutputSchema },
  prompt: `You are an expert, friendly tutor explaining a technical concept. Your goal is to sound like a knowledgeable friend messaging on WhatsApp.

You are having a conversation about the topic: "{{topic}}"

The user's last message is at the end of the history. Your task is to provide a clear, concise, and friendly response to that message, keeping the conversation flowing.

Rules:
- Keep your tone conversational and encouraging.
- Use simple language and avoid jargon where possible.
- Use emojis to make it engaging (e.g., 👋, 📦, 😊).
- Break down complex ideas into small, easy-to-digest paragraphs, like a series of chat messages.
- If the user asks a question, answer it directly.
- If the user is just saying hello or starting the conversation, provide an initial, friendly explanation of the topic with an analogy.

Conversation History:
{{#each history}}
- {{this.role}}: {{{this.content}}}
{{/each}}
`,
});

const generateChatLessonFlow = ai.defineFlow(
  {
    name: 'generateChatLessonFlow',
    inputSchema: GenerateChatLessonInputSchema,
    outputSchema: GenerateChatLessonOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
