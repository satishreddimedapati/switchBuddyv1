
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

Your task is to explain the topic: "{{topic}}"

Rules:
- Keep it conversational and friendly.
- Use simple language and avoid jargon where possible.
- Use emojis to make it engaging.
- Break down the concept into small, easy-to-digest paragraphs, like a series of chat messages.
- Start with a simple analogy or a real-world example.
- Provide a clear, concise explanation of the core concept.
- End with a simple, practical example (like a small code snippet if applicable) to solidify the understanding.

Example for topic "CSS Flexbox":

"Hey there! 👋 So you wanna know about Flexbox?

Imagine you have a bunch of toy blocks you want to line up. Flexbox is like a magic container for those blocks. You can tell the container 'line them up horizontally!' or 'stack them vertically!' and it just does it. Super handy, right? 📦

Basically, it's a layout model in CSS that lets you easily align and distribute items within a container, even when their size is unknown. No more messing with floats or weird positioning hacks!

For example, to make three items sit side-by-side with equal space between them, you'd just do:

.container {
  display: flex;
  justify-content: space-between;
}

That's it! It's a real game-changer for building layouts. Hope that helps! 😊"
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
