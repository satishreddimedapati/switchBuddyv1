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
import { addInterviewPlan } from '@/services/interview-plans';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Video } from 'lucide-react';
import { addInterviewSession } from '@/services/interview-sessions';
import { generateInterviewQuestions } from '@/ai/flows/interview-practice';

const planSchema = z.object({
  topic: z.string().min(1, 'Topic is required.'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  durationMinutes: z.coerce.number().int().min(1),
  numberOfQuestions: z.coerce.number().int().min(1),
  totalInterviews: z.coerce.number().int().min(1, 'You must plan at least one interview.'),
});

type PlanFormValues = z.infer<typeof planSchema>;

const getNumberOfQuestions = (duration: number) => {
    if (duration <= 15) return 3;
    if (duration <= 30) return 5;
    return 8;
}

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
            numberOfQuestions: 5,
            totalInterviews: 10,
        },
    });

    const watchedDuration = form.watch('durationMinutes');
    useEffect(() => {
        const newNumberOfQuestions = getNumberOfQuestions(watchedDuration);
        form.setValue('numberOfQuestions', newNumberOfQuestions);
    }, [watchedDuration, form]);


    const onSubmit = async (data: PlanFormValues) => {
        if (!user || !user.uid) {
            toast({ title: 'Error', description: 'You must be logged in to create a plan.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            // 1. Create the plan
            const planId = await addInterviewPlan({ ...data, userId: user.uid, completedInterviews: 0 });
            
            toast({ title: 'Plan Created!', description: "Now generating your interview questions..." });
            
            // 2. Generate questions
            const questionResult = await generateInterviewQuestions({
                topic: data.topic,
                difficulty: data.difficulty,
                numberOfQuestions: data.numberOfQuestions,
            });

            if (!questionResult || questionResult.questions.length === 0) {
                 toast({ title: 'Error', description: 'Could not generate interview questions. Please try again.', variant: 'destructive' });
                 setIsSubmitting(false);
                 return;
            }
            
            // 3. Create the session with pre-generated questions
            const newSession = {
                userId: user.uid,
                planId: planId,
                interviewNumber: 1,
                status: 'in-progress' as const,
                questions: questionResult.questions.map((q, i) => ({ qNo: i + 1, question: q })),
            };

            const sessionId = await addInterviewSession(newSession);

            toast({ title: 'Success', description: 'Your interview is ready!' });
            router.push(`/interview-prep/session/${sessionId}`);

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to create interview plan. Check Firestore rules.', variant: 'destructive' });
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
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
                                <Input id="numberOfQuestions" type="number" {...form.register('numberOfQuestions')} readOnly className="bg-muted/50" />
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
