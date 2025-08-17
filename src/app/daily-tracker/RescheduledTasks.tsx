
'use client';

import type { DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface RescheduledTasksProps {
  tasks: DailyTask[];
}

export function RescheduledTasks({ tasks }: RescheduledTasksProps) {
    const sortedTasks = [...tasks].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (tasks.length === 0) {
        return (
            <div className="text-center py-10 border rounded-lg">
                <p className="text-muted-foreground">No tasks have been rescheduled yet.</p>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rescheduled Tasks Log</CardTitle>
                <CardDescription>A history of all tasks you have rescheduled.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedTasks.map(task => (
                        <div key={task.id} className="p-4 border rounded-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{task.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Originally from <span className="font-medium">{format(new Date(task.rescheduled!.originalDate), 'MMM d')}</span>, moved to <span className="font-medium">{format(new Date(task.date), 'MMM d')}</span>.
                                    </p>
                                </div>
                                <Badge variant="outline">{task.completed ? "Completed" : "Pending"}</Badge>
                            </div>
                             <div className="mt-2 p-2 bg-muted/50 rounded-md">
                                <p className="text-xs italic">&quot;{task.rescheduled!.reason}&quot;</p>
                             </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
