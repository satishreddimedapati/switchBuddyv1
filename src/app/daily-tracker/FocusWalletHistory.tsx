
'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { DailyTask, UserReward } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Coins, CheckCircle, XCircle, Gift, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isYesterday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, parseISO, isValid, isWithinInterval } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PurchasedRewardsSummary } from './PurchasedRewardsSummary';
import { ScrollArea } from '@/components/ui/scroll-area';


interface FocusWalletHistoryProps {
    tasks: DailyTask[];
    rewards: UserReward[];
    loading: boolean;
}

const STARTING_BALANCE = 0;

interface DayActivity {
    date: string;
    label: string;
    credits: number;
    debits: number;
    netChange: number;
    completedTasksList: DailyTask[];
    missedTasksList: DailyTask[];
    redeemedRewardsList: UserReward[];
    bonus: number;
    penalty: number;
}

const calculateDayActivity = (tasksForDay: DailyTask[], allTasks: DailyTask[], rewardsForDay: UserReward[]): Omit<DayActivity, 'date' | 'label'> => {
    const day = tasksForDay.length > 0 ? tasksForDay[0].date : (rewardsForDay.length > 0 && rewardsForDay[0].redeemedAt ? format(parseISO(rewardsForDay[0].redeemedAt), 'yyyy-MM-dd') : '');
    
    const rescheduledAwayFromThisDay = allTasks.filter(t => t.rescheduled?.originalDate === day);
    const tasksOnThisDay = tasksForDay;

    const completedOnThisDay = tasksOnThisDay.filter(t => t.completed);

    const taskDate = day ? startOfDay(parseISO(day)) : new Date();
    const isPastOrToday = isBefore(taskDate, new Date()) || isToday(taskDate);
    
    const missedOnThisDay = isPastOrToday ? tasksOnThisDay.filter(t => !t.completed) : [];
    
    const allMissedAndRescheduled = [...missedOnThisDay, ...rescheduledAwayFromThisDay];
    const totalTasksForDay = completedOnThisDay.length + allMissedAndRescheduled.length;

    const taskCredits = completedOnThisDay.length;
    const taskDebits = allMissedAndRescheduled.length;
    const rewardDebits = rewardsForDay.reduce((sum, reward) => sum + reward.cost, 0);

    const completionBonus = totalTasksForDay > 0 && (taskCredits / totalTasksForDay) >= 0.8 ? 5 : 0;
    const missPenalty = isPastOrToday && totalTasksForDay > 0 && (taskDebits / totalTasksForDay) >= 0.5 ? 5 : 0;

    const calculatedCredits = taskCredits + completionBonus;
    const calculatedDebits = taskDebits + missPenalty + rewardDebits;

    const net = calculatedCredits - calculatedDebits;

    return {
        credits: calculatedCredits,
        debits: calculatedDebits,
        netChange: net,
        completedTasksList: completedOnThisDay,
        missedTasksList: allMissedAndRescheduled,
        redeemedRewardsList: rewardsForDay,
        bonus: completionBonus,
        penalty: missPenalty,
    };
};

function formatActivityDate(dateString: string): string {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, 'EEEE, MMM d');
}


export function FocusWalletHistory({ tasks, rewards, loading }: FocusWalletHistoryProps) {
    const [filter, setFilter] = useState('this-week');
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const filteredData = useMemo(() => {
        const now = new Date();
        let interval: { start: Date, end: Date };

        switch (filter) {
            case 'today':
                interval = { start: startOfDay(now), end: endOfDay(now) };
                break;
            case 'this-week':
                interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
                break;
            case 'this-month':
                interval = { start: startOfMonth(now), end: endOfMonth(now) };
                break;
            default: // Default to this week
                interval = { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
        }

        const filteredTasks = tasks.filter(task => {
            const taskDate = parseISO(task.date);
            return isWithinInterval(taskDate, interval);
        });

        const filteredRewards = rewards.filter(reward => {
            if (typeof reward.redeemedAt !== 'string' || !reward.redeemedAt) return false;
            const rewardDate = parseISO(reward.redeemedAt);
            if (!isValid(rewardDate)) return false; 
            return isWithinInterval(rewardDate, interval);
        });

        return { tasks: filteredTasks, rewards: filteredRewards };

    }, [tasks, rewards, filter]);

    const activityByDay = useMemo(() => {
        const groupedData: Record<string, { tasks: DailyTask[], rewards: UserReward[] }> = {};

        filteredData.tasks.forEach(task => {
            const date = task.date;
            if (!groupedData[date]) {
                groupedData[date] = { tasks: [], rewards: [] };
            }
            groupedData[date].tasks.push(task);
        });

        filteredData.rewards.forEach(reward => {
             if (typeof reward.redeemedAt !== 'string' || !reward.redeemedAt) return;
            const date = format(parseISO(reward.redeemedAt), 'yyyy-MM-dd');
             if (!groupedData[date]) {
                groupedData[date] = { tasks: [], rewards: [] };
            }
            groupedData[date].rewards.push(reward);
        });

        return Object.entries(groupedData)
            .map(([date, { tasks: tasksForDay, rewards: rewardsForDay }]) => ({
                date,
                label: formatActivityDate(date),
                ...calculateDayActivity(tasksForDay, tasks, rewardsForDay),
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [filteredData, tasks]);


    if (loading) {
        return (
            <div className="space-y-4 p-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            <div className="pb-4 flex flex-wrap gap-2 items-center px-1">
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
                <Button
                    variant="outline"
                    onClick={() => setIsSummaryOpen(true)}
                    disabled={filteredData.rewards.length === 0}
                >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    View Purchases ({filteredData.rewards.length})
                </Button>
                 <PurchasedRewardsSummary 
                    isOpen={isSummaryOpen} 
                    onOpenChange={setIsSummaryOpen}
                    rewards={filteredData.rewards} 
                />
            </div>
           
            <ScrollArea className="flex-grow">
                <div className="pr-4">
                    {activityByDay.length === 0 ? (
                        <div className="text-center py-10 border rounded-lg h-full flex items-center justify-center">
                            <p className="text-muted-foreground">No activity for the selected period.</p>
                        </div>
                    ) : (
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
                                        <AccordionContent className="px-4 pb-4 space-y-4">
                                            {day.credits > 0 && (
                                                <div className='p-3 bg-background rounded-md'>
                                                    <h4 className="flex items-center gap-2 font-semibold text-green-600 mb-2"><ArrowUp /> Credits Earned (+{day.credits})</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {day.completedTasksList.map(task => (
                                                            <div key={task.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/50">
                                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                                <span className="flex-grow truncate">{task.title}</span>
                                                                <Badge variant="outline" className="font-mono text-green-600">+1</Badge>
                                                            </div>
                                                        ))}
                                                        {day.bonus > 0 && (
                                                            <div className="flex items-center gap-2 text-xs font-medium p-2 rounded-md bg-muted/50">
                                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                                                <span className="flex-grow">Completion Bonus (&gt;80%)</span>
                                                                <Badge variant="outline" className="font-mono text-green-600">+{day.bonus}</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {day.debits > 0 && (
                                                <div className='p-3 bg-background rounded-md'>
                                                     <h4 className="flex items-center gap-2 font-semibold text-red-600 mb-2"><ArrowDown /> Debits Incurred (-{day.debits})</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {day.missedTasksList.map(task => (
                                                            <div key={task.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/50">
                                                                <XCircle className="h-3 w-3 text-red-500" />
                                                                <span className="flex-grow truncate">{task.title}</span>
                                                                <Badge variant="outline" className="font-mono text-red-600">-1</Badge>
                                                            </div>
                                                        ))}
                                                        {day.penalty > 0 && (
                                                            <div className="flex items-center gap-2 text-xs font-medium p-2 rounded-md bg-muted/50">
                                                                <XCircle className="h-3 w-3 text-red-500" />
                                                                <span className="flex-grow">Miss Penalty (&gt;50%)</span>
                                                                <Badge variant="outline" className="font-mono text-red-600">-{day.penalty}</Badge>
                                                            </div>
                                                        )}
                                                        {day.redeemedRewardsList.map(reward => (
                                                            <div key={reward.id} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/50">
                                                                <Gift className="h-3 w-3 text-red-500" />
                                                                <span className="flex-grow truncate">Redeemed: {reward.name}</span>
                                                                <Badge variant="outline" className="font-mono text-red-600">-{reward.cost}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </div>
            </ScrollArea>
        </div>
    )

    

    

    