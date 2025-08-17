

'use client'

import { DailyTrackerTabs } from "./DailyTrackerTabs";
import { MissedTasksGate } from "./MissedTasksGate";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { DailyTask, UserReward } from "@/lib/types";
import { toSerializableUserReward } from "@/lib/types";
import { getMissedTasks } from "@/services/daily-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays } from 'date-fns';
import { FocusWalletHistory } from "./FocusWalletHistory";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getUserRewards } from "@/services/user-rewards";
import { getFocusCoinBalance } from "@/services/user-rewards";

function FocusWalletFAB({ balance, tasks, rewards, loading }: { balance: number, tasks: DailyTask[], rewards: UserReward[], loading: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg flex-col gap-1" variant="primary">
                    <Coins className="h-6 w-6" />
                    <span className="font-bold text-lg">{loading ? '...' : balance}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Focus Wallet History</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <FocusWalletHistory tasks={tasks} rewards={rewards} loading={loading} />
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function DailyTrackerPage() {
    const { user } = useAuth();
    const [missedTasks, setMissedTasks] = useState<DailyTask[]>([]);
    const [recentTasks, setRecentTasks] = useState<DailyTask[]>([]); // Will hold last 30 days of tasks
    const [rewards, setRewards] = useState<UserReward[]>([]);
    const [balance, setBalance] = useState(0);

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
        
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const tasksQuery = query(
            collection(db, "daily_tasks"), 
            where("userId", "==", user.uid),
            where("date", ">=", thirtyDaysAgo)
        );
        const rewardsQuery = query(
            collection(db, "redeemed_rewards"), 
            where("userId", "==", user.uid)
        );
        
        const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
            const fetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
            setRecentTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recent tasks: ", error);
            setLoading(false);
        });

        const unsubscribeRewards = onSnapshot(rewardsQuery, (querySnapshot) => {
            const fetchedRewards = querySnapshot.docs.map(doc => toSerializableUserReward({ id: doc.id, ...doc.data() }));
            setRewards(fetchedRewards);
        }, (error) => {
            console.error("Error fetching rewards: ", error);
        });

        return () => {
            unsubscribeTasks();
            unsubscribeRewards();
        };
    }, [user]);

     useEffect(() => {
        if (user) {
            const calculateBalance = async () => {
                const newBalance = await getFocusCoinBalance(user.uid);
                setBalance(newBalance);
            }
            calculateBalance();
        }
    }, [recentTasks, rewards, user]);
    
    const todaysTasks = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return recentTasks.filter(task => task.date === todayStr);
    }, [recentTasks]);


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
                <DailyTrackerTabs tasks={todaysTasks} loading={loading} />
                <FocusWalletFAB balance={balance} tasks={recentTasks} rewards={rewards} loading={loading} />
                </>
            )}
        </div>
    );
}
