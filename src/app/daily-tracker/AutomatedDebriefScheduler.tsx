'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { DailyTask, GenerateDailySummaryOutput } from '@/lib/types';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { format as formatDateFns } from 'date-fns';
import { generateDailySummary } from '@/ai/flows/schedule-optimizer';
import { sendDailyDebrief } from '@/ai/flows/send-daily-debrief';
import { useToast } from '@/hooks/use-toast';

export function AutomatedDebriefScheduler() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [hasRunToday, setHasRunToday] = useState(false);

    useEffect(() => {
        if (!user || hasRunToday) {
            return;
        }

        const checkAndRun = () => {
            const now = new Date();
            const targetHour = 14;
            const targetMinute = 40;
            
            // For this simulation, we'll run it once shortly after the component mounts
            // In a real app with a cron job, you would check the time.
            // if (now.getHours() === targetHour && now.getMinutes() === targetMinute) {

            // To prevent multiple runs, we check a flag in local storage.
            const lastRunDate = localStorage.getItem('automatedDebriefLastRun');
            const todayStr = formatDateFns(now, 'yyyy-MM-dd');
            
            if (lastRunDate === todayStr) {
                setHasRunToday(true);
                return;
            }

            // Simulate the cron job firing
            console.log("Simulating daily automated debrief...");
            setHasRunToday(true);
            localStorage.setItem('automatedDebriefLastRun', todayStr);

            // Fetch today's tasks to generate summary
            const q = query(
                collection(db, 'daily_tasks'),
                where('date', '==', todayStr),
                where('userId', '==', user.uid)
            );

            getDocs(q).then(async (querySnapshot) => {
                if (querySnapshot.empty) {
                    console.log("No tasks for today, skipping automated debrief.");
                    return;
                }

                const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
                
                toast({ title: 'Automated Debrief', description: 'Generating and sending your daily summary...' });

                try {
                    const summary = await generateDailySummary({ tasks });
                    if (summary) {
                        await sendDailyDebrief(summary);
                        toast({ title: 'Success', description: 'Your automated daily debrief was sent to Telegram.' });
                    }
                } catch (error) {
                    console.error("Failed to run automated debrief:", error);
                    toast({ title: 'Error', description: 'Could not send automated debrief.', variant: 'destructive' });
                }
            });
        };
        
        // In a real cron job, the server would just run this.
        // Here, we'll use a timeout to simulate it happening in the background after page load.
        const timer = setTimeout(checkAndRun, 5000); // Run 5 seconds after mount

        return () => clearTimeout(timer);

    }, [user, hasRunToday, toast]);

    // This component doesn't render anything to the UI
    return null;
}
