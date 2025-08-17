
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GenerateInterviewPlanOutput, GenerateInterviewPlanOutputSchema } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { addInterviewPlan } from '@/services/interview-plans';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';

interface InterviewPlanFormProps {
    planData: GenerateInterviewPlanOutput;
}

export function InterviewPlanForm({ planData }: InterviewPlanFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<GenerateInterviewPlanOutput>({
        resolver: zodResolver(GenerateInterviewPlanOutputSchema),
        defaultValues: {
            ...planData,
        }
    });

    const onSubmit = async (data: GenerateInterviewPlanOutput) => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in to create a plan.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        try {
            // The schema now expects a string, but the service needs an array.
            const questionsArray = typeof data.questions === 'string' 
                ? data.questions.split('\n').filter(q => q.trim() !== '') 
                : [];

            const planToSave = {
                userId: user.uid,
                topic: data.topic,
                difficulty: data.difficulty,
                durationMinutes: data.durationMinutes || 30,
                numberOfQuestions: questionsArray.length,
                totalInterviews: data.totalInterviews || 10,
                completedInterviews: 0,
            };
            await addInterviewPlan(planToSave);
            toast({ title: "Success!", description: "Interview plan created. Redirecting to Interview Prep..." });
            router.push('/job-switch-helper?tab=interview-prep');
        } catch (error) {
            console.error("Failed to create plan", error);
            toast({ title: "Error", description: "Could not create the interview plan.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="plan-topic">Topic</Label>
                    <Input id="plan-topic" {...form.register('topic')} />
                </div>
                <div>
                    <Label htmlFor="plan-difficulty">Difficulty</Label>
                    <Controller
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="plan-difficulty"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Easy">Easy</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>
            <div>
                <Label>Predicted Questions</Label>
                <Textarea
                    {...form.register('questions')}
                    rows={6}
                    className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground mt-1">You can edit these questions before creating the plan.</p>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                    Create Plan & Go to Prep
                </Button>
            </div>
        </form>
    );
}
