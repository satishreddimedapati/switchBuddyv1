
'use client';

import { useState } from 'react';
import type { DailyTask } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { updateTask } from '@/services/daily-tasks';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CalendarCheck, CalendarClock, Loader2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface MissedTaskItemProps {
    task: DailyTask;
    onTaskHandled: (taskId: string) => void;
}

function MissedTaskItem({ task, onTaskHandled }: MissedTaskItemProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [reason, setReason] = useState('');
    const [rescheduleOption, setRescheduleOption] = useState<'today' | 'tomorrow'>('today');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReschedule = async () => {
        if (!user || !reason) {
            toast({ title: "Reason Required", description: "Please provide a reason why this task was missed.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const newDate = rescheduleOption === 'today' ? new Date() : addDays(new Date(), 1);
            
            const updates: Partial<DailyTask> = {
                date: format(newDate, 'yyyy-MM-dd'),
                completed: false,
                rescheduled: {
                    originalDate: task.date,
                    reason: reason,
                }
            };
            
            await updateTask(task.id, updates, user.uid);
            
            toast({ title: "Task Rescheduled", description: `"${task.title}" has been moved to ${rescheduleOption}.`});
            onTaskHandled(task.id);

        } catch (error) {
            console.error("Failed to reschedule task:", error);
            toast({ title: "Error", description: "Could not reschedule the task.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-400">
            <CardHeader>
                <CardTitle className="text-base">{task.title}</CardTitle>
                <CardDescription>Missed on: {format(new Date(task.date), 'EEEE, MMM d')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea 
                    placeholder="Why was this task missed? (Required)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center gap-4">
                 <ToggleGroup type="single" value={rescheduleOption} onValueChange={(value: 'today' | 'tomorrow') => value && setRescheduleOption(value)} className="w-full sm:w-auto">
                    <ToggleGroupItem value="today" aria-label="Reschedule for today" className="flex-1">Today</ToggleGroupItem>
                    <ToggleGroupItem value="tomorrow" aria-label="Reschedule for tomorrow" className="flex-1">Tomorrow</ToggleGroupItem>
                </ToggleGroup>
                <Button onClick={handleReschedule} disabled={!reason || isSubmitting} className="w-full sm:w-auto ml-auto">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <CalendarClock />}
                    Reschedule
                </Button>
            </CardFooter>
        </Card>
    )
}


interface MissedTasksGateProps {
    initialTasks: DailyTask[];
    onGateCleared: () => void;
}

export function MissedTasksGate({ initialTasks, onGateCleared }: MissedTasksGateProps) {
    const [missedTasks, setMissedTasks] = useState(initialTasks);

    const handleTaskHandled = (taskId: string) => {
        const remainingTasks = missedTasks.filter(t => t.id !== taskId);
        setMissedTasks(remainingTasks);
        if (remainingTasks.length === 0) {
            onGateCleared();
        }
    };

    if (initialTasks.length === 0) {
        onGateCleared();
        return null; // Should be handled by parent, but as a fallback.
    }

    return (
        <div className="space-y-6">
            <Card className="border-destructive">
                <CardHeader className="flex flex-row items-center gap-4">
                     <AlertTriangle className="h-10 w-10 text-destructive" />
                     <div>
                        <CardTitle className="text-destructive">Accountability Check!</CardTitle>
                        <CardDescription>You have {missedTasks.length} incomplete task(s) from the past week. Please address them before continuing.</CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-4">
                {missedTasks.map(task => (
                    <MissedTaskItem key={task.id} task={task} onTaskHandled={handleTaskHandled} />
                ))}
            </div>
             <div className="flex justify-center pt-4">
                <p className="text-sm text-muted-foreground">Once all tasks are handled, your schedule will unlock.</p>
            </div>
        </div>
    );
}
