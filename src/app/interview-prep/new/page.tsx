'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { addInterviewPlan } from '@/services/interview-plans';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Video } from 'lucide-react';

const planSchema = z.object({
  topic: z.string().min(1, 'Topic is required.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  durationMinutes: z.coerce.number().int().min(1),
  totalInterviews: z.coerce.number().int().min(1, 'You must plan at least one interview.'),
});

type PlanFormValues = z.infer<typeof planSchema>;

export default function NewInterviewPlanPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<PlanFormValues>({
        resolver: zodResolver(planSchema),
        defaultValues: {
            topic: '',
            difficulty: 'Medium',
            durationMinutes: 30,
            totalInterviews: 10,
        },
    });

    const onSubmit = async (data: PlanFormValues) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in to create a plan.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const planId = await addInterviewPlan({ ...data, userId: user.uid, completedInterviews: 0 });
            toast({ title: 'Success', description: 'Your interview plan has been created!' });
            router.push(`/interview-prep/session/new?planId=${planId}`);
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to create interview plan.', variant: 'destructive' });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
             <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Create New Interview Plan
                </h1>
                <p className="text-muted-foreground">
                    Define your practice goals to start your first mock interview.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Plan Details</CardTitle>
                    <CardDescription>Set up the parameters for your mock interview sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div>
                                <Label htmlFor="topic">Topic</Label>
                                <Input id="topic" placeholder="e.g., React, System Design, Behavioral" {...form.register('topic')} />
                                {form.formState.errors.topic && <p className="text-destructive text-sm mt-1">{form.formState.errors.topic.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="difficulty">Difficulty</Label>
                                <Select onValueChange={(value) => form.setValue('difficulty', value as any)} defaultValue={form.getValues('difficulty')}>
                                    <SelectTrigger id="difficulty">
                                        <SelectValue placeholder="Select a difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                                <Select onValueChange={(value) => form.setValue('durationMinutes', parseInt(value))} defaultValue={form.getValues('durationMinutes').toString()}>
                                    <SelectTrigger id="durationMinutes">
                                        <SelectValue placeholder="Select a duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="60">60 minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="totalInterviews">Total Interviews to Take</Label>
                                <Input id="totalInterviews" type="number" {...form.register('totalInterviews')} />
                                {form.formState.errors.totalInterviews && <p className="text-destructive text-sm mt-1">{form.formState.errors.totalInterviews.message}</p>}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Video />}
                                Start Plan
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
