
'use client';

import type { DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface MissedAndRescheduledTasksProps {
  tasks: DailyTask[];
}

export function MissedAndRescheduledTasks({ tasks }: MissedAndRescheduledTasksProps) {
    const sortedTasks = [...tasks].sort((a,b) => {
        const dateA = new Date(a.rescheduled?.originalDate || a.date);
        const dateB = new Date(b.rescheduled?.originalDate || b.date);
        return dateB.getTime() - dateA.getTime();
    });

    if (tasks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Missed & Rescheduled Tasks</CardTitle>
                    <CardDescription>A history of all tasks you have missed or rescheduled in the past week.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 border rounded-lg">
                        <p className="text-muted-foreground">No missed or rescheduled tasks in the last 7 days.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getStatus = (task: DailyTask) => {
        if (task.rescheduled) {
            return <Badge variant={task.completed ? "default" : "outline"} className={task.completed ? "bg-green-600" : ""}>{task.completed ? "Completed" : "Rescheduled"}</Badge>;
        }
        if (!task.completed) {
            return <Badge variant="destructive">Missed</Badge>;
        }
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Missed & Rescheduled Tasks</CardTitle>
                <CardDescription>A history of all tasks you have missed or rescheduled in the past week.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedTasks.map(task => (
                        <div key={task.id} className="p-4 border rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{task.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {task.rescheduled 
                                            ? <>Originally for <span className='line-through'>{format(new Date(task.rescheduled.originalDate), 'MMM d')}</span>, moved to {format(new Date(task.date), 'MMM d')}</>
                                            : `Scheduled for ${format(new Date(task.date), 'MMM d')}`
                                        }
                                    </p>
                                </div>
                                {getStatus(task)}
                            </div>
                             {task.rescheduled?.reason && (
                                <div className="mt-2 p-2 bg-muted/50 rounded-md">
                                    <p className="text-xs italic">Your reason: &quot;{task.rescheduled.reason}&quot;</p>
                                </div>
                             )}
                              {!task.rescheduled && !task.completed && (
                                 <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md flex items-center gap-2 text-amber-700 dark:text-amber-300">
                                    <AlertTriangle className="h-4 w-4" />
                                    <p className="text-xs font-semibold">This task needs to be actioned from the accountability gate.</p>
                                 </div>
                              )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
