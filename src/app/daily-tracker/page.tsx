
'use client'

import { DailyTrackerTabs } from "./DailyTrackerTabs";
import { MissedTasksGate } from "./MissedTasksGate";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import type { DailyTask } from "@/lib/types";
import { getTasksForWeek } from "@/services/daily-tasks";
import { subDays, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyTrackerPage() {
    const { user } = useAuth();
    const [missedTasks, setMissedTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMissedTasks = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        const today = new Date();
        const sevenDaysAgo = format(subDays(today, 7), 'yyyy-MM-dd');
        const yesterday = format(subDays(today, 1), 'yyyy-MM-dd');
        
        try {
            const pastWeekTasks = await getTasksForWeek(sevenDaysAgo, yesterday, user.uid);
            const incompleteTasks = pastWeekTasks.filter(task => !task.completed && !task.rescheduled);
            
            incompleteTasks.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setMissedTasks(incompleteTasks);
        } catch (error) {
            console.error("Failed to fetch missed tasks:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMissedTasks();
    }, [fetchMissedTasks]);

    const handleGateCleared = () => {
        // Refetch to confirm all tasks are handled
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

    return (
        <div className="flex flex-col gap-8 h-full">
            {missedTasks.length > 0 ? (
                <MissedTasksGate initialTasks={missedTasks} onGateCleared={handleGateCleared} />
            ) : (
                <DailyTrackerTabs />
            )}
        </div>
    );
}
