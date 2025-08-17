
'use client';

import { useMemo } from 'react';
import type { DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Coins, CheckCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isYesterday } from 'date-fns';

// Mock data, in a real app this would come from a user profile service
const MOCK_CURRENT_BALANCE = 95;

interface FocusWalletHistoryProps {
    tasks: DailyTask[];
    loading: boolean;
}

interface DayActivity {
    date: string;
    label: string;
    credits: number;
    debits: number;
    netChange: number;
    completedTasksList: DailyTask[];
    missedTasksList: DailyTask[];
    bonus: number;
    penalty: number;
}

const calculateDayActivity = (tasksForDay: DailyTask[]): Omit<DayActivity, 'date' | 'label'> => {
    const totalTasks = tasksForDay.length;
    const completed = tasksForDay.filter(t => t.completed);
    const missed = tasksForDay.filter(t => !t.completed);

    const completionBonus = totalTasks > 0 && (completed.length / totalTasks) >= 0.8 ? 5 : 0;
    const missPenalty = totalTasks > 0 && (missed.length / totalTasks) >= 0.5 ? 5 : 0;

    const calculatedCredits = completed.length + completionBonus;
    const calculatedDebits = missed.length + missPenalty;

    const net = calculatedCredits - calculatedDebits;

    return {
        credits: calculatedCredits,
        debits: calculatedDebits,
        netChange: net,
        completedTasksList: completed,
        missedTasksList: missed,
        bonus: completionBonus,
        penalty: missPenalty,
    };
};

function formatActivityDate(dateString: string): string {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'EEEE, MMM d');
}


export function FocusWalletHistory({ tasks, loading }: FocusWalletHistoryProps) {
    
    const activityByDay = useMemo(() => {
        const groupedByDate = tasks.reduce((acc, task) => {
            const date = task.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(task);
            return acc;
        }, {} as Record<string, DailyTask[]>);

        return Object.entries(groupedByDate)
            .map(([date, tasksForDay]) => ({
                date,
                label: formatActivityDate(date),
                ...calculateDayActivity(tasksForDay),
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [tasks]);

    if (loading) {
        return (
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                <CardContent>
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (activityByDay.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Coins /> Focus Wallet</CardTitle>
                    <CardDescription>No activity recorded in the last 7 days.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Coins /> Focus Wallet History</CardTitle>
                <CardDescription>Your productivity log for the last 7 days. Current Balance: <span className="font-bold">{MOCK_CURRENT_BALANCE} 🧘</span></CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" defaultValue={activityByDay[0]?.date} collapsible className="w-full space-y-2">
                    {activityByDay.map(day => (
                         <AccordionItem key={day.date} value={day.date} className="border-b-0">
                            <Card className="bg-muted/50">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="w-full flex justify-between items-center text-sm sm:text-base">
                                        <p className="font-semibold">{day.label}</p>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className="font-mono bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">+{day.credits}</Badge>
                                            <Badge variant="outline" className="font-mono bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">-{day.debits}</Badge>
                                            <Badge className={cn(
                                                day.netChange > 0 && "bg-green-600",
                                                day.netChange < 0 && "bg-red-600",
                                            )}>
                                                Net: {day.netChange > 0 ? `+${day.netChange}` : day.netChange}
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                   <Accordion type="multiple" className="w-full space-y-2">
                                        <AccordionItem value="credits">
                                            <AccordionTrigger className="p-3 bg-background rounded-md text-base">
                                                <span className="flex items-center gap-2 font-semibold text-green-600"><ArrowUp /> Credits Earned (+{day.credits})</span>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 border rounded-b-md space-y-2 text-sm">
                                                {day.completedTasksList.map(task => (
                                                    <div key={task.id} className="flex items-center gap-2 text-xs">
                                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                                        <span className="flex-grow truncate">{task.title}</span>
                                                        <Badge variant="outline" className="font-mono text-green-600">+1</Badge>
                                                    </div>
                                                ))}
                                                {day.bonus > 0 && (
                                                    <div className="flex items-center gap-2 text-xs font-medium pt-1 mt-1 border-t">
                                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                                        <span className="flex-grow">Completion Bonus (&gt;80%)</span>
                                                        <Badge variant="outline" className="font-mono text-green-600">+{day.bonus}</Badge>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                         <AccordionItem value="debits">
                                            <AccordionTrigger className="p-3 bg-background rounded-md text-base">
                                                <span className="flex items-center gap-2 font-semibold text-red-600"><ArrowDown /> Debits Incurred (-{day.debits})</span>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 border rounded-b-md space-y-2 text-sm">
                                                {day.missedTasksList.map(task => (
                                                    <div key={task.id} className="flex items-center gap-2 text-xs">
                                                        <XCircle className="h-3 w-3 text-red-500" />
                                                        <span className="flex-grow truncate">{task.title}</span>
                                                        <Badge variant="outline" className="font-mono text-red-600">-1</Badge>
                                                    </div>
                                                ))}
                                                {day.penalty > 0 && (
                                                    <div className="flex items-center gap-2 text-xs font-medium pt-1 mt-1 border-t">
                                                        <XCircle className="h-3 w-3 text-red-500" />
                                                        <span className="flex-grow">Miss Penalty (&gt;50%)</span>
                                                        <Badge variant="outline" className="font-mono text-red-600">-{day.penalty}</Badge>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                   </Accordion>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}
