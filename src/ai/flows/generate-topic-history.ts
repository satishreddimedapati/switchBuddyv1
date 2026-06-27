
'use server';

/**
 * @fileOverview A flow to generate interesting historical facts about a technology topic.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { TopicHistoryInputSchema, TopicHistoryOutputSchema, TopicHistoryOutput } from '@/lib/types';


export async function generateTopicHistory(input: z.infer<typeof TopicHistoryInputSchema>): Promise<TopicHistoryOutput> {
    return generateTopicHistoryFlow(input);
}




