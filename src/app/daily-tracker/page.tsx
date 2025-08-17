
'use client'

import { DailyTrackerTabs } from "./DailyTrackerTabs";
import { MissedTasksGate } from "./MissedTasksGate";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import type { DailyTask } from "@/lib/types";
import { getTasksForWeek } from "@/services/daily-tasks";
import { subDays, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyTrackerPage() {
    const { user } = useAuth();
    const [missedTasks, setMissedTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [gateCleared, setGateCleared] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        
        const fetchMissedTasks = async () => {
            setLoading(true);
            const today = new Date();
            const todayStr = format(today, 'yyyy-MM-dd');
            const sevenDaysAgo = format(subDays(today, 7), 'yyyy-MM-dd');
            
            try {
                const pastWeekTasks = await getTasksForWeek(sevenDaysAgo, format(subDays(today, 1), 'yyyy-MM-dd'), user.uid);
                const incompleteTasks = pastWeekTasks.filter(task => !task.completed && !task.rescheduled);
                
                // Sort by date, oldest first
                incompleteTasks.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setMissedTasks(incompleteTasks);
                if (incompleteTasks.length === 0) {
                    setGateCleared(true);
                }
            } catch (error) {
                console.error("Failed to fetch missed tasks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMissedTasks();
    }, [user]);

    const handleGateCleared = () => {
        setGateCleared(true);
        setMissedTasks([]);
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
            {gateCleared ? (
                <DailyTrackerTabs />
            ) : (
                <MissedTasksGate initialTasks={missedTasks} onGateCleared={handleGateCleared} />
            )}
        </div>
    );
}
