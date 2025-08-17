
'use client';

import { useMemo, useState } from 'react';
import type { DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Coins, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isYesterday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


// We'll start the balance at 0 for a true reflection of net changes.
const STARTING_BALANCE = 0;

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
    if (tasksForDay.length === 0) {
        return { credits: 0, debits: 0, netChange: 0, completedTasksList: [], missedTasksList: [], bonus: 0, penalty: 0 };
    }
    const totalTasks = tasksForDay.length;
    const completed = tasksForDay.filter(t => t.completed);
    
    // Only count debits for tasks on or before today
    const taskDate = startOfDay(new Date(tasksForDay[0].date));
    const isPastOrToday = isBefore(taskDate, new Date()) || isToday(taskDate);

    const missed = isPastOrToday ? tasksForDay.filter(t => !t.completed) : [];

    const credits = completed.length;
    const debits = missed.length;

    const completionBonus = totalTasks > 0 && (completed.length / totalTasks) >= 0.8 ? 5 : 0;
    const missPenalty = isPastOrToday && totalTasks > 0 && (missed.length / totalTasks) >= 0.5 ? 5 : 0;

    const calculatedCredits = credits + completionBonus;
    const calculatedDebits = debits + missPenalty;

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
    const [filter, setFilter] = useState('this-week');
    
    const filteredTasks = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (filter) {
            case 'today':
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                break;
            case 'this-week':
                startDate = startOfWeek(now, { weekStartsOn: 1 });
                endDate = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'this-month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            default: // Default to this week
                 startDate = startOfWeek(now, { weekStartsOn: 1 });
                 endDate = endOfWeek(now, { weekStartsOn: 1 });
        }

        return tasks.filter(task => {
            const taskDate = new Date(task.date);
            return taskDate >= startDate && taskDate <= endDate;
        });

    }, [tasks, filter]);

    const activityByDay = useMemo(() => {
        const groupedByDate = filteredTasks.reduce((acc, task) => {
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
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [filteredTasks]);

    const currentBalance = useMemo(() => {
        // Group all tasks by date to calculate total balance, not just filtered ones.
        const groupedByDate = tasks.reduce((acc, task) => {
            const date = task.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(task);
            return acc;
        }, {} as Record<string, DailyTask[]>);

        // Calculate net change for each day and sum it up.
        const totalNetChange = Object.values(groupedByDate)
            .reduce((total, tasksForDay) => {
                const { netChange } = calculateDayActivity(tasksForDay);
                return total + netChange;
            }, 0);
            
        return STARTING_BALANCE + totalNetChange;
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

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2"><Coins /> Focus Wallet History</CardTitle>
                        <CardDescription>Your productivity log. Current Balance: <span className="font-bold">{currentBalance} 🧘</span></CardDescription>
                    </div>
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select a range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="this-week">This Week</SelectItem>
                            <SelectItem value="this-month">This Month</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {activityByDay.length === 0 ? (
                    <div className="text-center py-10 border rounded-lg">
                        <p className="text-muted-foreground">No activity for the selected period.</p>
                    </div>
                ) : (
                    <Accordion type="single" defaultValue={activityByDay[activityByDay.length -1]?.date} collapsible className="w-full space-y-2">
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
                                                     {day.completedTasksList.length === 0 && day.bonus === 0 && <p className="text-xs text-muted-foreground">No credits earned this day.</p>}
                                                </AccordionContent>
                                            </AccordionItem>
                                            {day.debits > 0 && (
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
                                            )}
                                    </Accordion>
                                    </AccordionContent>
                                </Card>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}
