'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarIcon, Loader2, Sparkles, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition } from 'react';
import { GenerateInterviewTopicScheduleOutput, InterviewPrepTaskSchema } from '@/lib/types';
import { generateInterviewTopicSchedule } from '@/ai/flows/interview-topic-scheduler';
import { addTask } from '@/services/daily-tasks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
    topic: z.string().min(1, 'Topic is required.'),
    numberOfDays: z.coerce.number().int().min(1, 'At least 1 day is required.'),
    startDate: z.date({ required_error: 'Start date is required.' }),
});

type FormValues = z.infer<typeof formSchema>;

const timeSlots = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

export function InterviewTopicScheduler() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isGenerating, startGenerateTransition] = useTransition();
    const [isSaving, startSaveTransition] = useTransition();
    const [result, setResult] = useState<GenerateInterviewTopicScheduleOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState('19:00');

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            topic: '',
            numberOfDays: 15,
            startDate: new Date(),
        },
    });

    const onSubmit = (data: FormValues) => {
        startGenerateTransition(async () => {
            setError(null);
            setResult(null);
            try {
                const res = await generateInterviewTopicSchedule({
                    ...data,
                    startDate: format(data.startDate, 'yyyy-MM-dd'),
                });
                if (res) {
                    setResult(res);
                } else {
                    setError('The AI could not generate a schedule. Please try again.');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while generating the schedule.');
            }
        });
    };

    const handleAddToSchedule = () => {
        if (!result || !user) return;

        startSaveTransition(async () => {
            try {
                const tasksToAdd = result.schedule.map(item => ({
                    title: item.subtopic,
                    description: `Interview prep for ${item.topic}.`,
                    date: item.date,
                    time: selectedTime,
                    type: 'interview' as const,
                    completed: false,
                }));

                await Promise.all(tasksToAdd.map(task => addTask(task, user.uid)));
                
                toast({
                    title: 'Success!',
                    description: `${result.schedule.length} interview prep tasks have been added to your schedule.`,
                });
                setResult(null);
            } catch (err) {
                console.error(err);
                toast({
                    title: 'Error',
                    description: 'Failed to save tasks to your schedule.',
                    variant: 'destructive',
                });
            }
        });
    }

    return (
        <div className="space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="topic">Topic</Label>
                        <Input id="topic" {...form.register('topic')} placeholder="e.g., React, .NET" />
                        {form.formState.errors.topic && <p className="text-destructive text-sm mt-1">{form.formState.errors.topic.message}</p>}
                    </div>
                    <div>
                        <Label htmlFor="numberOfDays">Number of Days</Label>
                        <Input id="numberOfDays" type="number" {...form.register('numberOfDays')} />
                        {form.formState.errors.numberOfDays && <p className="text-destructive text-sm mt-1">{form.formState.errors.numberOfDays.message}</p>}
                    </div>
                    <div>
                        <Label>Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !form.watch('startDate') && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {form.watch('startDate') ? format(form.watch('startDate'), "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={form.watch('startDate')}
                                    onSelect={(date) => form.setValue('startDate', date || new Date())}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <Button type="submit" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Sparkles className="mr-2" />}
                    Generate Study Plan
                </Button>
            </form>

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isGenerating && (
                <div className="mt-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            )}

            {result && (
                <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold">Generated Interview Prep Plan</h3>
                    <div className="border rounded-md">
                         <ul className="space-y-1 p-4 max-h-96 overflow-y-auto">
                            {result.schedule.map((item, index) => (
                                <li key={index} className="flex items-center gap-4 p-2 border-b last:border-b-0">
                                    <span className="font-mono text-sm text-muted-foreground w-24">
                                        {format(new Date(item.date), 'EEE, MMM d')}
                                    </span>
                                    <p className="font-medium">{item.subtopic}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                   
                    <div className="flex flex-wrap items-center gap-4 p-4 border-t bg-muted/50 rounded-b-md">
                        <div className="flex-grow">
                            <p className="font-semibold">Ready to commit?</p>
                            <p className="text-sm text-muted-foreground">Add these tasks to your daily schedule.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="task-time" className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Time</Label>
                             <Select value={selectedTime} onValueChange={setSelectedTime}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeSlots.map(slot => (
                                        <SelectItem key={slot} value={slot}>
                                            {format(new Date(`1970-01-01T${slot}`), "h:mm a")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleAddToSchedule} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Check className="mr-2" />}
                            Add to Daily Schedule
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
