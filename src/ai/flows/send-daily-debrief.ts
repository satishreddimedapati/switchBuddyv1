'use server';

/**
 * @fileOverview A flow to send a daily debrief message to Telegram.
 */

import {z} from 'genkit';
import { GenerateDailySummaryOutputSchema, SendDailyDebriefInputSchema, SendDailyDebriefOutputSchema } from '@/lib/types';


export type SendDailyDebriefInput = z.infer<typeof SendDailyDebriefInputSchema>;
export type SendDailyDebriefOutput = z.infer<typeof SendDailyDebriefOutputSchema>;

export async function sendDailyDebrief(
    summary: SendDailyDebriefInput
): Promise<SendDailyDebriefOutput> {
    const botToken = '8081926267:AAGr--3L2kQNxrTghvq5S2C22RgnBFJp22Q';
    const chatId = '821974194';

    let messageText = `📝 Daily Debrief\n`;
    messageText += `✅ Today’s Summary: ${summary.completedTasks}/${summary.totalTasks} tasks completed\n`;
    messageText += `🔥 Streak: ${summary.streak} days\n`;

    if (summary.missedTasks.length > 0) {
        messageText += `📌 Missed Tasks:\n`;
        summary.missedTasks.forEach(task => {
            messageText += `- ${task.title} → ${task.rescheduledTime}\n`;
        });
    }

    if (summary.nextDayPriorities.length > 0) {
        messageText += `🎯 Top 3 Priorities for Tomorrow:\n`;
        summary.nextDayPriorities.forEach((priority, index) => {
            messageText += `${index + 1}. ${priority}\n`;
        });
    }
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
            }),
        });

        const result = await response.json();

        if (!result.ok) {
            console.error('Telegram API Error:', result.description);
            return { success: false, message: `Telegram API Error: ${result.description}` };
        }

        return { success: true, message: 'Message sent successfully.' };

    } catch (error) {
        console.error("Failed to send Telegram message:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: `Failed to send message: ${errorMessage}` };
    }
}
