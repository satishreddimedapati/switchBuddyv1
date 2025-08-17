
'use client'

import { DailyTrackerTabs } from "./DailyTrackerTabs";
import { MissedTasksGate } from "./MissedTasksGate";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback } from "react";
import type { DailyTask } from "@/lib/types";
import { getMissedTasks } from "@/services/daily-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { FocusWallet } from "./FocusWallet";

export default function DailyTrackerPage() {
    const { user } = useAuth();
    const [missedTasks, setMissedTasks] = useState<DailyTask[]>([]);
    const [todaysTasks, setTodaysTasks] = useState<DailyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [gateLoading, setGateLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMissedTasks = useCallback(async () => {
        if (!user) {
            setGateLoading(false);
            return;
        }
        
        setGateLoading(true);
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
            setGateLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchMissedTasks();
    }, [fetchMissedTasks]);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const today = format(new Date(), 'yyyy-MM-dd');
        const q = query(collection(db, "daily_tasks"), where("date", "==", today), where("userId", "==", user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
            setTodaysTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching today's tasks: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleGateCleared = () => {
        fetchMissedTasks();
    };
    
    if (gateLoading) {
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
                <>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Daily Tracker
                    </h1>
                    <p className="text-muted-foreground">
                        Plan your day, track your progress, and stay productive.
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                   <FocusWallet tasks={todaysTasks} />
                </div>
                <DailyTrackerTabs tasks={todaysTasks} loading={loading} />
                </>
            )}
        </div>
    );
}
