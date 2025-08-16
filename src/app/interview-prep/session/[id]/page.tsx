'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Loader2, Mic, Send, Sparkles, Timer } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getInterviewPlan, updateInterviewPlan } from "@/services/interview-plans";
import { getInterviewSession, updateInterviewSession } from "@/services/interview-sessions";
import { InterviewPlan, InterviewSession, InterviewSessionQuestion } from "@/lib/types";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { evaluateInterviewAnswers } from "@/ai/flows/interview-practice";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

function InterviewTimer({ durationMinutes, onTimeUp }: { durationMinutes: number, onTimeUp: () => void }) {
    const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }
        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="flex items-center gap-2 font-mono p-2 bg-muted rounded-md text-sm md:text-base">
            <Timer className="h-5 w-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
    );
}


export default function InterviewSessionPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const sessionId = params.id as string;

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [plan, setPlan] = useState<InterviewPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEnding, startEndingTransition] = useTransition();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{[key: number]: string}>({});
    
    const currentQuestion: InterviewSessionQuestion | undefined = session?.questions[currentQuestionIndex];

    useEffect(() => {
        if (!user || !sessionId) return;
        
        async function loadSessionData() {
            setLoading(true);
            const sessionData = await getInterviewSession(sessionId);
            if (sessionData && sessionData.userId === user.uid) {
                setSession(sessionData);
                const planData = await getInterviewPlan(sessionData.planId);
                setPlan(planData as InterviewPlan);
                // Initialize answers state
                const initialAnswers: {[key: number]: string} = {};
                sessionData.questions.forEach(q => {
                    if(q.answer) initialAnswers[q.qNo] = q.answer;
                });
                setAnswers(initialAnswers);

            } else {
                toast({ title: 'Error', description: 'Interview session not found or you do not have permission to view it.', variant: 'destructive'});
                router.push('/interview-prep');
            }
            setLoading(false);
        }

        loadSessionData();
    }, [user, sessionId, router, toast]);


    const handleAnswerChange = (text: string) => {
        if (!currentQuestion) return;
        setAnswers(prev => ({...prev, [currentQuestion.qNo]: text}));
    }
    
    const handleEndInterview = async () => {
        if (!session || !plan || !user) return;
        
        startEndingTransition(async () => {
            try {
                 toast({ title: 'Interview Submitted!', description: 'Evaluating your answers... This may take a moment.'});

                const qa_pairs = session.questions.map(q => ({
                    qNo: q.qNo,
                    question: q.question,
                    answer: answers[q.qNo] || "No answer provided.",
                }));

                const evaluationResult = await evaluateInterviewAnswers({ qa_pairs });

                const updatedQuestions = session.questions.map((q, index) => ({
                    ...q,
                    answer: answers[q.qNo],
                    aiReview: evaluationResult.evaluations[index].feedback,
                    rating: evaluationResult.evaluations[index].rating,
                }));

                const totalScore = updatedQuestions.reduce((acc, q) => acc + (q.rating || 0), 0);
                const overallScore = updatedQuestions.length > 0 ? totalScore / updatedQuestions.length : 0;

                await updateInterviewSession(sessionId, { 
                    status: 'completed', 
                    questions: updatedQuestions,
                    overallScore, 
                    completedAt: new Date().toISOString() 
                });
                await updateInterviewPlan(plan.id!, { completedInterviews: (plan.completedInterviews || 0) + 1 }, user.uid);
                
                toast({ title: 'Evaluation Complete!', description: 'Redirecting to your summary page.'});
                router.push(`/interview-prep/summary/${sessionId}`);

            } catch (error) {
                console.error("Evaluation failed", error);
                toast({ title: 'Error', description: 'Failed to evaluate interview.', variant: 'destructive'});
            }
        });
    };

     if (loading || !session || !plan) {
        return (
            <div className="flex flex-col gap-4 h-full">
                <Skeleton className="h-16 w-full" />
                <div className="flex-grow grid grid-cols-1 gap-4">
                    <Skeleton className="h-full w-full" />
                </div>
                 <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-2 md:p-4 border-b bg-card rounded-lg flex-wrap gap-2">
                <div className="font-semibold text-sm md:text-base">Interview {session.interviewNumber} / {plan.totalInterviews}</div>
                <InterviewTimer durationMinutes={plan.durationMinutes} onTimeUp={handleEndInterview} />
                <Button variant="destructive" onClick={handleEndInterview} disabled={isEnding} size="sm">
                    {isEnding ? <Loader2 className="animate-spin"/> : 'End & Submit'}
                </Button>
            </div>

            {/* Main Body */}
            <div className="flex-grow grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-4">
                    <Card className="flex-grow">
                        <CardHeader>
                            <CardTitle>Question {currentQuestionIndex + 1} of {session.questions.length}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-lg md:text-xl">
                                {currentQuestion?.question}
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Your Answer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                placeholder="Type your answer here..." 
                                className="h-32 md:h-48" 
                                value={answers[currentQuestion.qNo] || ''} 
                                onChange={(e) => handleAnswerChange(e.target.value)}
                             />
                            <div className="flex justify-between items-center">
                                <Button variant="outline" size="icon" disabled><Mic /></Button>
                                <p className="text-sm text-muted-foreground">Your answer is saved automatically.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-center p-2 md:p-4 border-t bg-card rounded-lg">
                 <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0}><ArrowLeft className="mr-0 md:mr-2" /><span className="hidden md:inline">Previous</span></Button>
                 <div className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {session.questions.length}</div>
                 <Button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={currentQuestionIndex === session.questions.length - 1}><span className="hidden md:inline">Next</span><ArrowRight className="ml-0 md:ml-2" /></Button>
            </div>
        </div>
    );
}
