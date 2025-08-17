
'use client';

import { useMemo, useState } from 'react';
import type { DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Coins, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data, in a real app this would come from a user profile service
const MOCK_CURRENT_BALANCE = 95;

interface FocusWalletProps {
    tasks: DailyTask[];
}

export function FocusWallet({ tasks }: FocusWalletProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const {
        credits,
        debits,
        netChange,
        loading,
        completedTasksList,
        missedTasksList,
        bonus,
        penalty
    } = useMemo(() => {
        if (!tasks) {
            return { credits: 0, debits: 0, netChange: 0, loading: true, completedTasksList: [], missedTasksList: [], bonus: 0, penalty: 0 };
        }

        const totalTasks = tasks.length;
        const completed = tasks.filter(t => t.completed);
        const missed = tasks.filter(t => !t.completed);
        
        const completionBonus = totalTasks > 0 && (completed.length / totalTasks) >= 0.8 ? 5 : 0;
        const missPenalty = totalTasks > 0 && (missed.length / totalTasks) >= 0.5 ? 5 : 0;

        const calculatedCredits = completed.length + completionBonus;
        const calculatedDebits = missed.length + missPenalty;
        
        const net = calculatedCredits - calculatedDebits;

        return {
            credits: calculatedCredits,
            debits: calculatedDebits,
            netChange: net,
            loading: false,
            completedTasksList: completed,
            missedTasksList: missed,
            bonus: completionBonus,
            penalty: missPenalty,
        };
    }, [tasks]);

    if (loading) {
        return <Skeleton className="h-full w-full" />
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                     <CardHeader className="cursor-pointer">
                        <div className="flex justify-between items-center">
                             <div className='flex items-center gap-2'>
                                <Coins />
                                <CardTitle className="text-lg">Focus Wallet</CardTitle>
                             </div>
                             <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className={cn("transition-transform", isOpen && "rotate-180")} />
                                <span className="sr-only">Toggle wallet details</span>
                            </Button>
                        </div>
                        <p className="text-3xl font-bold pt-2">{MOCK_CURRENT_BALANCE} 🧘</p>
                        <CardDescription>Click to see today's activity.</CardDescription>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                        <Separator />
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="flex justify-between items-center font-semibold text-green-600">
                                    <span className="flex items-center gap-2"><ArrowUp /> Today&apos;s Credits</span>
                                    <span>+{credits}</span>
                                </div>
                                <ul className="list-none space-y-1 mt-2 text-muted-foreground pl-4">
                                    {completedTasksList.map(task => (
                                        <li key={task.id} className="flex items-center gap-2 text-xs">
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                            <span className="flex-grow truncate">{task.title}</span>
                                            <Badge variant="outline" className="font-mono text-green-600">+1</Badge>
                                        </li>
                                    ))}
                                    {bonus > 0 && (
                                         <li className="flex items-center gap-2 text-xs font-medium">
                                            <CheckCircle className="h-3 w-3 text-green-500" />
                                            <span className="flex-grow">Completion Bonus (&gt;80%)</span>
                                            <Badge variant="outline" className="font-mono text-green-600">+{bonus}</Badge>
                                        </li>
                                    )}
                                </ul>
                            </div>
                             <div>
                                <div className="flex justify-between items-center font-semibold text-red-600">
                                    <span className="flex items-center gap-2"><ArrowDown /> Today&apos;s Debits</span>
                                    <span>-{debits}</span>
                                </div>
                                <ul className="list-none space-y-1 mt-2 text-muted-foreground pl-4">
                                    {missedTasksList.map(task => (
                                        <li key={task.id} className="flex items-center gap-2 text-xs">
                                            <XCircle className="h-3 w-3 text-red-500" />
                                            <span className="flex-grow truncate">{task.title}</span>
                                            <Badge variant="outline" className="font-mono text-red-600">-1</Badge>
                                        </li>
                                    ))}
                                    {penalty > 0 && (
                                         <li className="flex items-center gap-2 text-xs font-medium">
                                            <XCircle className="h-3 w-3 text-red-500" />
                                            <span className="flex-grow">Miss Penalty (&gt;50%)</span>
                                            <Badge variant="outline" className="font-mono text-red-600">-{penalty}</Badge>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center font-semibold">
                            <span>Net Change</span>
                            <span className={cn(
                                netChange > 0 && "text-green-600",
                                netChange < 0 && "text-red-600",
                            )}>
                                {netChange > 0 ? `+${netChange}` : netChange} 🧘
                            </span>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    )
}
