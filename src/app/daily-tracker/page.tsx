
'use client'

import { DailyTrackerTabs } from "./DailyTrackerTabs";
import { MissedTasksGate } from "./MissedTasksGate";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import type { DailyTask } from "@/lib/types";
import { getMissedTasks } from "@/services/daily-tasks";
import { Skeleton } from "@/components/ui/skeleton";

export default function DailyTrackerPage() {
    const { user } = useAuth();
    const [missedTasks, setMissedTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
