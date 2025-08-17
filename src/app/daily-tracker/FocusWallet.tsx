
'use client';

import { useMemo } from 'react';
import type { DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Coins } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data, in a real app this would come from a user profile service
const MOCK_CURRENT_BALANCE = 95;

interface FocusWalletProps {
    tasks: DailyTask[];
}

export function FocusWallet({ tasks }: FocusWalletProps) {
    const {
        credits,
        debits,
        netChange,
        loading,
    } = useMemo(() => {
        if (!tasks) {
            return { credits: 0, debits: 0, netChange: 0, loading: true };
        }

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        
        // This logic assumes "missed" tasks are those not completed by the end of the day.
        // For a real-time view, we can consider all non-completed tasks as potentially "missed".
        const missedTasks = totalTasks - completedTasks;

        let calculatedCredits = 0;
        let calculatedDebits = 0;

        // Credit Rules
        calculatedCredits += completedTasks; // +1 per completed task
        if (totalTasks > 0 && (completedTasks / totalTasks) >= 0.8) {
            calculatedCredits += 5; // +5 bonus for >= 80% completion
        }

        // Debit Rules
        calculatedDebits += missedTasks; // -1 per missed task
        if (totalTasks > 0 && (missedTasks / totalTasks) >= 0.5) {
            calculatedDebits += 5; // -5 penalty for >= 50% missed
        }
        
        const net = calculatedCredits - calculatedDebits;

        return {
            credits: calculatedCredits,
            debits: calculatedDebits,
            netChange: net,
            loading: false,
        };
    }, [tasks]);

    if (loading) {
        return <Skeleton className="h-full w-full" />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Coins /> Focus Wallet
                </CardTitle>
                <CardDescription>Productivity rewards for today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold">{MOCK_CURRENT_BALANCE} 🧘</p>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                   <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><ArrowUp className="text-green-500" /> Today&apos;s Credits</span>
                        <span className="font-semibold text-green-500">+{credits}</span>
                   </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><ArrowDown className="text-red-500" /> Today&apos;s Debits</span>
                        <span className="font-semibold text-red-500">-{debits}</span>
                   </div>
                </div>
                 <Separator />
                <div className="flex justify-between items-center font-semibold">
                    <span>Net Change</span>
                    <span className={cn(
                        netChange > 0 && "text-green-500",
                        netChange < 0 && "text-red-500",
                    )}>
                        {netChange > 0 ? `+${netChange}` : netChange} 🧘
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
