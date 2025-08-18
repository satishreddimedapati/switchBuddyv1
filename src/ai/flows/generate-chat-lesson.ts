
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

{{#if intent}}
The user has a specific request: "{{intent}}". You MUST tailor your response to this request.
- If the intent is "Explain for interview", focus on the key points, definitions, and examples that are common in technical interviews.
- If the intent is "Interview Q&A", provide 2-3 likely interview questions about the current topic and a brief, ideal answer for each.
- If the intent is "Easy remembering shortcuts", provide mnemonic devices, analogies, or simple rules of thumb.
- If the intent is "Fun way of explanation", use a creative analogy, a short story, or a very casual, humorous tone.
- If the intent is a language translation, translate your last response into that language (e.g., "Translate to Telugu").
{{/if}}


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
