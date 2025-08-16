'use server';

/**
 * @fileOverview A placeholder flow to send a daily debrief message to WhatsApp.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SendDailyDebriefInputSchema, SendDailyDebriefOutputSchema } from '@/lib/types';


export type SendWhatsAppDebriefInput = z.infer<typeof SendDailyDebriefInputSchema>;
export type SendWhatsAppDebriefOutput = z.infer<typeof SendDailyDebriefOutputSchema>;

export async function sendWhatsAppDebrief(
    input: SendWhatsAppDebriefInput
): Promise<SendWhatsAppDebriefOutput> {
    return sendWhatsAppDebriefFlow(input);
}

const sendWhatsAppDebriefFlow = ai.defineFlow(
    {
        name: 'sendWhatsAppDebriefFlow',
        inputSchema: SendDailyDebriefInputSchema,
        outputSchema: SendDailyDebriefOutputSchema,
    },
    async (summary) => {
        // This is a placeholder for a real WhatsApp API integration (e.g., Twilio).
        // You would need to replace this with actual API call logic.
        const recipientNumber = '7670995678';
        
        let messageText = `*📝 Daily Debrief*\n\n`;
        messageText += `*✅ Today’s Summary:*\n${summary.completedTasks}/${summary.totalTasks} tasks completed\n\n`;
        messageText += `*🔥 Streak:*\n${summary.streak} days\n\n`;

        if (summary.missedTasks.length > 0) {
            messageText += `*📌 Missed Tasks:*\n`;
            summary.missedTasks.forEach(task => {
                messageText += `- ${task.title} → ${task.rescheduledTime}\n`;
            });
            messageText += `\n`;
        }

        if (summary.nextDayPriorities.length > 0) {
            messageText += `*🎯 Top 3 Priorities for Tomorrow:*\n`;
            summary.nextDayPriorities.forEach((priority, index) => {
                messageText += `${index + 1}. ${priority}\n`;
            });
        }
        
        console.log("---- WHATSAPP MESSAGE TO BE SENT ----");
        console.log(`To: ${recipientNumber}`);
        console.log(messageText);
        console.log("------------------------------------");
        
        // Since this is a placeholder, we'll always return a success message.
        // In a real implementation, you would check the response from the WhatsApp API provider.
        return { success: true, message: 'WhatsApp message sent successfully (simulated).' };
    }
);
