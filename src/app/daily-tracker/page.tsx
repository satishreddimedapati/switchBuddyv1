
'use client'

import { DailyTrackerTabs } from "./DailyTrackerTabs";
import { MissedTasksGate } from "./MissedTasksGate";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import type { DailyTask } from "@/lib/types";
import { getMissedTasks } from "@/services/daily-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DailySchedule } from "./DailySchedule";
import { WeeklyTimetable } from "./WeeklyTimetable";
import { AiScheduler } from "./AiScheduler";
import { MissedAndRescheduledTasks } from "./MissedAndRescheduledTasks";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays, format } from 'date-fns';

type ActiveView = "daily" | "weekly" | "ai-scheduler" | "missed-rescheduled";


export default function DailyTrackerPage() {
    const { user } = useAuth();
    const [missedTasks, setMissedTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<ActiveView>('daily');
    const [pastTasks, setPastTasks] = useState<DailyTask[]>([]);

    useEffect(() => {
        if (!user) return;
        
        const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

        const q = query(
        collection(db, 'daily_tasks'),
        where('userId', '==', user.uid),
        where('date', '>=', sevenDaysAgo)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allPastWeekTasks = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as DailyTask);
            const relevantTasks = allPastWeekTasks.filter(task => task.rescheduled || (!task.completed && task.date < format(new Date(), 'yyyy-MM-dd')));
            setPastTasks(relevantTasks);
        });

        return () => unsubscribe();
    }, [user]);

    const fetchMissedTasks = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const incompleteTasks = await getMissedTasks(user.uid);
            incompleteTasks.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setMissedTasks(incompleteTasks);
        } catch (error: any) {
            console.error("Failed to fetch missed tasks:", error);
            if (error.code === 'failed-precondition') {
                setError("A database index is required. Please check the server console logs for a link to create it.");
            } else {
                setError(`An unexpected error occurred while fetching tasks. Code: ${error.code || 'N/A'}`);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMissedTasks();
    }, [fetchMissedTasks]);

    // This function will be called from the gate when all tasks are handled.
    const handleGateCleared = () => {
        // Refetch to confirm all tasks are gone
        fetchMissedTasks();
    };
    
    if (loading) {
        return (
             <div className="flex flex-col gap-8 h-full">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-64 w-full" />
             </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 border-dashed border-2 rounded-lg border-destructive">
                    <h3 className="text-xl font-semibold text-destructive">Database Error</h3>
                    <p className="text-muted-foreground mt-2">{error}</p>
                </div>
            </div>
        )
    }

    const renderContent = () => {
        switch (activeView) {
            case 'daily':
                return <DailySchedule />;
            case 'weekly':
                return <WeeklyTimetable />;
            case 'ai-scheduler':
                return <AiScheduler />;
            case 'missed-rescheduled':
                return <MissedAndRescheduledTasks tasks={pastTasks} />;
            default:
                return <DailySchedule />;
        }
    }
    
    const pageTitles: Record<ActiveView, {title: string, description: string}> = {
        'daily': { title: "Daily Tracker", description: "Track your daily activities and manage your schedule." },
        'weekly': { title: "Weekly Timetable", description: "View and manage your tasks for the entire week." },
        'ai-scheduler': { title: "AI Smart Scheduler", description: "Let AI help you plan your day and prepare for interviews." },
        'missed-rescheduled': { title: "Missed & Rescheduled", description: "A log of your past incomplete or rescheduled tasks." },
    }

    return (
        <div className="flex flex-col gap-8 h-full">
            {missedTasks.length > 0 ? (
                <MissedTasksGate initialTasks={missedTasks} onGateCleared={handleGateCleared} />
            ) : (
                <>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="font-headline text-3xl font-bold tracking-tight">
                        {pageTitles[activeView].title}
                        </h1>
                        <p className="text-muted-foreground">
                         {pageTitles[activeView].description}
                        </p>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings />
                                <span className="sr-only">Change View</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup value={activeView} onValueChange={(value) => setActiveView(value as ActiveView)}>
                                <DropdownMenuRadioItem value="daily">Daily</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="weekly">Weekly</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="ai-scheduler">AI Smart Scheduler</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="missed-rescheduled">Missed/Rescheduled</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="flex-grow">
                    {renderContent()}
                </div>
                </>
            )}
        </div>
    );
}
