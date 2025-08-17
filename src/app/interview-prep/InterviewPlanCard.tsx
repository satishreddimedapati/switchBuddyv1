
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { InterviewPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Edit, Loader2, Video } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { generateInterviewQuestions } from "@/ai/flows/interview-practice";
import { addInterviewSession } from "@/services/interview-sessions";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface InterviewPlanCardProps {
    plan: InterviewPlan;
}

export function InterviewPlanCard({ plan }: InterviewPlanCardProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isStarting, startTransition] = useTransition();

    const isCompleted = (plan.completedInterviews || 0) >= plan.totalInterviews;
    const progress = (plan.completedInterviews / plan.totalInterviews) * 100;

    const handleStartNext = () => {
        if (!user || !plan.id) return;
        startTransition(async () => {
            try {
                toast({ title: 'Starting new interview...', description: 'Generating questions now.' });

                const questionResult = await generateInterviewQuestions({
                    topic: plan.topic,
                    difficulty: plan.difficulty,
                    numberOfQuestions: plan.numberOfQuestions,
                });

                if (!questionResult || questionResult.questions.length === 0) {
                    toast({ title: 'Error', description: 'Could not generate interview questions. Please try again.', variant: 'destructive' });
                    return;
                }

                const newSession = {
                    userId: user.uid,
                    planId: plan.id!,
                    interviewNumber: (plan.completedInterviews || 0) + 1,
                    status: 'in-progress' as const,
                    questions: questionResult.questions.map((q, i) => ({ qNo: i + 1, question: q })),
                };
                const sessionId = await addInterviewSession(newSession);

                toast({ title: 'Success!', description: 'Your interview is ready.' });
                router.push(`/job-switch-helper/session/${sessionId}`);
            } catch (error) {
                console.error("Failed to start new session:", error);
                toast({
                    title: "Error",
                    description: "Could not start the next interview session.",
                    variant: "destructive"
                });
            }
        });
    }

    return (
        <Card className="border-l-4" style={{ borderColor: isCompleted ? 'hsl(var(--muted))' : 'hsl(var(--primary))' }}>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                        <CardTitle className="text-xl">{plan.topic}</CardTitle>
                        <CardDescription>Difficulty: {plan.difficulty} | Duration: {plan.durationMinutes} min</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                        <Link href={`/job-switch-helper/edit/${plan.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground">
                        {plan.completedInterviews} / {plan.totalInterviews} interviews completed.
                    </p>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleStartNext} disabled={isStarting || isCompleted}>
                        {isStarting ? <Loader2 className="animate-spin" /> : <Video />}
                        {isCompleted ? 'Plan Complete' : 'Start Next Interview'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
