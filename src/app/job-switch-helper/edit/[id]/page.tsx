
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { updateInterviewPlan, getInterviewPlan } from '@/services/interview-plans';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { InterviewPlan } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const planSchema = z.object({
  topic: z.string().min(1, 'Topic is required.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  durationMinutes: z.coerce.number().int().min(1),
  numberOfQuestions: z.coerce.number().int().min(1, 'You must have at least one question.'),
  totalInterviews: z.coerce.number().int().min(1, 'You must plan at least one interview.'),
});

type PlanFormValues = z.infer<typeof planSchema>;

export default function EditInterviewPlanPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const planId = params.id as string;
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
    });

    useEffect(() => {
        if (!user || !planId) return;
        setLoading(true);
        getInterviewPlan(planId).then(plan => {
            if (plan && plan.userId === user.uid) {
                form.reset({
                    topic: plan.topic,
                    difficulty: plan.difficulty,
                    durationMinutes: plan.durationMinutes,
                    numberOfQuestions: plan.numberOfQuestions,
                    totalInterviews: plan.totalInterviews,
                });
            } else {
                toast({ title: "Error", description: "Plan not found or you don't have permission to edit it.", variant: "destructive" });
                router.push('/job-switch-helper?tab=interview-prep');
            }
            setLoading(false);
        });
    }, [planId, user, form, toast, router]);


    const onSubmit = async (data: PlanFormValues) => {
        if (!user || !user.uid || !planId) {
            toast({ title: 'Error', description: 'You must be logged in to update a plan.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            await updateInterviewPlan(planId, data, user.uid);
            toast({ title: 'Success', description: 'Your interview plan has been updated.' });
            router.push(`/job-switch-helper?tab=interview-prep`);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to update interview plan.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
             <div className="flex flex-col gap-8">
                <div>
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
             <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Edit Interview Plan
                </h1>
                <p className="text-muted-foreground">
                    Adjust the details of your practice plan.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Plan Details</CardTitle>
                    <CardDescription>Update the parameters for your mock interview sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="topic">Topic</Label>
                                <Input id="topic" placeholder="e.g., React, System Design" {...form.register('topic')} />
                                {form.formState.errors.topic && <p className="text-destructive text-sm mt-1">{form.formState.errors.topic.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="difficulty">Difficulty</Label>
                                <Controller
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="difficulty">
                                                <SelectValue placeholder="Select a difficulty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Easy">Easy</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="Hard">Hard</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                             <div>
                                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                                 <Controller
                                    control={form.control}
                                    name="durationMinutes"
                                    render={({ field }) => (
                                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                                            <SelectTrigger id="durationMinutes">
                                                <SelectValue placeholder="Select a duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 minutes</SelectItem>
                                                <SelectItem value="30">30 minutes</SelectItem>
                                                <SelectItem value="60">60 minutes</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div>
                                <Label htmlFor="numberOfQuestions">Number of Questions</Label>
                                <Input id="numberOfQuestions" type="number" {...form.register('numberOfQuestions')} />
                                {form.formState.errors.numberOfQuestions && <p className="text-destructive text-sm mt-1">{form.formState.errors.numberOfQuestions.message}</p>}
                            </div>
                            <div className="lg:col-span-2">
                                <Label htmlFor="totalInterviews">Total Interviews to Take</Label>
                                <Input id="totalInterviews" type="number" {...form.register('totalInterviews')} />
                                {form.formState.errors.totalInterviews && <p className="text-destructive text-sm mt-1">{form.formState.errors.totalInterviews.message}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
