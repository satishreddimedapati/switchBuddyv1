
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import type { LearningRoadmap } from '@/lib/types';
import { getLearningRoadmap, updateLearningRoadmap } from '@/services/learning-roadmaps';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  topic: z.string().min(1, 'Topic is required.'),
  timePerDay: z.number(),
  duration: z.number(),
  startDate: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

function LoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    );
}

export default function EditRoadmapPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const roadmapId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    useEffect(() => {
        if (!roadmapId || !user) return;
        setLoading(true);
        getLearningRoadmap(roadmapId).then(roadmap => {
            if (roadmap && roadmap.userId === user.uid) {
                form.reset({
                    topic: roadmap.topic,
                    timePerDay: roadmap.timePerDay,
                    duration: roadmap.duration,
                    startDate: parseISO(roadmap.startDate),
                });
            } else {
                toast({ title: "Error", description: "Roadmap not found or permission denied.", variant: "destructive" });
                router.push('/ai-learning');
            }
            setLoading(false);
        });
    }, [roadmapId, user, form, router, toast]);

    const onSubmit = async (data: FormValues) => {
        if (!user || !roadmapId) return;

        setIsSubmitting(true);
        try {
            await updateLearningRoadmap(roadmapId, {
                ...data,
                startDate: data.startDate.toISOString(),
            }, user.uid);
            toast({ title: "Success", description: "Roadmap updated successfully." });
            router.push('/ai-learning');
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update roadmap.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const watchedDuration = form.watch('duration');
    const watchedTimePerDay = form.watch('timePerDay');

    if (loading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Edit Learning Roadmap
                </h1>
                <p className="text-muted-foreground">
                    Fine-tune your learning plan. Note: Changing these values will not regenerate the weekly content.
                </p>
            </div>
             <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Core Plan Details</CardTitle>
                        <CardDescription>Adjust the basic parameters of your roadmap.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Main Topic / Track</Label>
                            <Input
                                id="topic"
                                placeholder="Ex: .NET Full Stack with Angular"
                                {...form.register('topic')}
                            />
                             {form.formState.errors.topic && <p className="text-destructive text-sm mt-1">{form.formState.errors.topic.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <Label>Time Commitment Per Day</Label>
                                <Slider
                                    value={[watchedTimePerDay || 90]}
                                    onValueChange={(value) => form.setValue('timePerDay', value[0])}
                                    min={30} max={180} step={30}
                                />
                                <div className="text-center font-medium">{watchedTimePerDay / 60} hours</div>
                            </div>
                            <div className="space-y-4">
                                <Label>Total Duration</Label>
                                <Slider
                                    value={[watchedDuration || 30]}
                                    onValueChange={(value) => form.setValue('duration', value[0])}
                                    min={7} max={90} step={1}
                                />
                                <div className="text-center font-medium">{watchedDuration} {watchedDuration > 1 ? 'days' : 'day'}</div>
                            </div>
                            <div className="space-y-4">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !form.watch('startDate') && "text-muted-foreground")}
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

                         <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                            Studying <span className="font-bold text-primary">{watchedTimePerDay / 60} hours/day</span> for <span className="font-bold text-primary">{watchedDuration} {watchedDuration > 1 ? 'days' : 'day'}</span> will result in approximately <span className="font-bold text-primary">{watchedDuration}</span> learning sessions.
                        </div>

                    </CardContent>
                </Card>
                 <div className="flex justify-end mt-6">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}

