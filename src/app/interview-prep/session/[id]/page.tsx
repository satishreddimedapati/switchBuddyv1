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
import { useRouter } from "next/navigation";
import { generateInterviewQuestion, evaluateAnswer } from "@/ai/flows/interview-practice";
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
        <div className="flex items-center gap-2 font-mono p-2 bg-muted rounded-md">
            <Timer className="h-5 w-5" />
            <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
    );
}


export default function InterviewSessionPage({ params }: { params: { id: string } }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const sessionId = params.id;

    const [session, setSession] = useState<InterviewSession | null>(null);
    const [plan, setPlan] = useState<InterviewPlan | null>(null);
    const [loading, setLoading] = useState(true);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [isGeneratingQuestion, startQuestionGeneration] = useTransition();
    const [isEvaluating, startEvaluation] = useTransition();
    
    const currentQuestion: InterviewSessionQuestion | undefined = session?.questions[currentQuestionIndex];

    useEffect(() => {
        if (!user || !sessionId) return;
        
        async function loadSessionData() {
            setLoading(true);
            const sessionData = await getInterviewSession(sessionId);
            if (sessionData) {
                setSession(sessionData);
                const planData = await getInterviewPlan(sessionData.planId);
                setPlan(planData);
                if (sessionData.questions.length === 0) {
                   handleGenerateQuestion(sessionData.planId);
                }
            } else {
                toast({ title: 'Error', description: 'Interview session not found.', variant: 'destructive'});
                router.push('/interview-prep');
            }
            setLoading(false);
        }

        loadSessionData();
    }, [user, sessionId, router, toast]);

    const handleGenerateQuestion = (planId: string) => {
        if (!plan) return;
        startQuestionGeneration(async () => {
            try {
                const result = await generateInterviewQuestion({ topic: plan.topic, difficulty: plan.difficulty });
                const newQuestion: InterviewSessionQuestion = { qNo: session!.questions.length + 1, question: result.question };
                const updatedQuestions = [...(session?.questions || []), newQuestion];
                await updateInterviewSession(sessionId, { questions: updatedQuestions });
                setSession(prev => prev ? {...prev, questions: updatedQuestions} : null);
            } catch (error) {
                 toast({ title: 'Error', description: 'Could not generate a new question.', variant: 'destructive'});
            }
        });
    }

    const handleSubmitAnswer = () => {
        if (!answer || !currentQuestion) return;
        startEvaluation(async () => {
            try {
                const result = await evaluateAnswer({ question: currentQuestion.question, answer });
                const updatedQuestion = { ...currentQuestion, answer, aiReview: result.feedback, rating: result.rating };
                
                const updatedQuestions = session!.questions.map((q, index) => 
                    index === currentQuestionIndex ? updatedQuestion : q
                );
                await updateInterviewSession(sessionId, { questions: updatedQuestions });
                setSession(prev => prev ? {...prev, questions: updatedQuestions} : null);
                setAnswer('');
            } catch (error) {
                 toast({ title: 'Error', description: 'Could not evaluate your answer.', variant: 'destructive'});
            }
        });
    };

    const handleNextQuestion = () => {
        if (!session || !plan) return;
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        if (nextIndex >= session.questions.length) {
            handleGenerateQuestion(plan.id!);
        }
    };
    
    const handleEndInterview = async () => {
        if (!session || !plan) return;
        
        const completedQuestions = session.questions.filter(q => q.rating);
        const totalScore = completedQuestions.reduce((acc, q) => acc + (q.rating || 0), 0);
        const overallScore = completedQuestions.length > 0 ? totalScore / completedQuestions.length : 0;

        await updateInterviewSession(sessionId, { status: 'completed', overallScore, completedAt: new Date().toISOString() });
        await updateInterviewPlan(plan.id!, { completedInterviews: (plan.completedInterviews || 0) + 1 });
        
        toast({ title: 'Interview Complete!', description: 'Redirecting to your summary page.'});
        router.push(`/interview-prep/summary/${sessionId}`);
    };

    if (loading || !session || !plan) {
        return (
            <div className="flex flex-col gap-4 h-full">
                <Skeleton className="h-16 w-full" />
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Skeleton className="h-full w-full" />
                    <Skeleton className="h-full w-full" />
                </div>
                 <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 border-b bg-card rounded-lg">
                <div className="font-semibold">Interview {session.interviewNumber} / {plan.totalInterviews}</div>
                <InterviewTimer durationMinutes={plan.durationMinutes} onTimeUp={handleEndInterview} />
                <Button variant="outline" onClick={handleEndInterview}>End Interview</Button>
            </div>

            {/* Main Body */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                    <Card className="flex-grow">
                        <CardHeader>
                            <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {isGeneratingQuestion ? <Skeleton className="h-24" /> : (
                                 <p className="text-lg">
                                    {currentQuestion?.question || 'Generating question...'}
                                </p>
                             )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Your Answer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea 
                                placeholder="Type your answer here..." 
                                className="h-32" 
                                value={answer} 
                                onChange={(e) => setAnswer(e.target.value)}
                                disabled={isEvaluating || !!currentQuestion?.answer}
                             />
                            <div className="flex justify-between items-center">
                                <Button variant="outline" size="icon" disabled><Mic /></Button>
                                <Button onClick={handleSubmitAnswer} disabled={isEvaluating || !answer || !!currentQuestion?.answer}>
                                    {isEvaluating ? <Loader2 className="animate-spin" /> : <Send />}
                                    Submit Answer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles /> AI Feedback</CardTitle>
                        <CardDescription>Review the AI's feedback on your answer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isEvaluating && <div className="text-center p-8"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></div>}
                        {!isEvaluating && !currentQuestion?.aiReview && (
                            <div className="text-center text-muted-foreground p-8">
                                Submit your answer to get feedback from the AI.
                            </div>
                        )}
                        {currentQuestion?.aiReview && (
                            <div className="space-y-4">
                                <Alert>
                                    <AlertTitle>Rating: {currentQuestion.rating}/10</AlertTitle>
                                </Alert>
                                <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm leading-relaxed">
                                    <p>{currentQuestion.aiReview}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-center p-4 border-t bg-card rounded-lg">
                 <Button variant="outline" disabled><ArrowLeft /> Previous</Button>
                 <div className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {session.questions.length}</div>
                 <Button onClick={handleNextQuestion} disabled={!currentQuestion?.answer}>Next Question <ArrowRight /></Button>
            </div>
        </div>
    );
}
