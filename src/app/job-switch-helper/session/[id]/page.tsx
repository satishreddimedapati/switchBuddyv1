
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Loader2, Mic, Send, Sparkles, Timer, MessageSquarePlus, PencilRuler, CaseSensitive } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getInterviewPlan, updateInterviewPlan } from "@/services/interview-plans";
import { getInterviewSession, updateInterviewSession } from "@/services/interview-sessions";
import { InterviewPlan, InterviewSession, InterviewSessionQuestion } from "@/lib/types";
import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { evaluateInterviewAnswers } from "@/ai/flows/interview-practice";
import { generateFollowUpQuestion } from "@/ai/flows/generate-follow-up-question";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
    const [whiteboard, setWhiteboard] = useState<{[key: number]: string}>({});
    const [isCounterQuestionEnabled, setIsCounterQuestionEnabled] = useState(true);
    const [followUp, setFollowUp] = useState<string | null>(null);
    const [isGeneratingFollowUp, startFollowUpTransition] = useTransition();
    
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
                const initialWhiteboard: {[key: number]: string} = {};
                sessionData.questions.forEach(q => {
                    if(q.answer) initialAnswers[q.qNo] = q.answer;
                    if(q.whiteboard) initialWhiteboard[q.qNo] = q.whiteboard;
                });
                setAnswers(initialAnswers);
                setWhiteboard(initialWhiteboard);

            } else {
                toast({ title: 'Error', description: 'Interview session not found or you do not have permission to view it.', variant: 'destructive'});
                router.push('/job-switch-helper?tab=interview-prep');
            }
            setLoading(false);
        }

        loadSessionData();
    }, [user, sessionId, router, toast]);

    // When the question changes, reset the follow-up hint.
    useEffect(() => {
        setFollowUp(null);
    }, [currentQuestionIndex]);


    const handleAnswerChange = (text: string) => {
        if (!currentQuestion) return;
        setAnswers(prev => ({...prev, [currentQuestion.qNo]: text}));
    }

    const handleWhiteboardChange = (text: string) => {
        if (!currentQuestion) return;
        setWhiteboard(prev => ({...prev, [currentQuestion.qNo]: text}));
    }
    
    const handleGenerateFollowUp = useCallback(() => {
        if (!isCounterQuestionEnabled || !currentQuestion?.question || !answers[currentQuestion.qNo]) return;
        
        startFollowUpTransition(async () => {
            setFollowUp(null);
            try {
                const result = await generateFollowUpQuestion({
                    question: currentQuestion.question,
                    answer: answers[currentQuestion.qNo] || '',
                });
                setFollowUp(result.followUpQuestion);
            } catch (e) {
                console.error("Failed to generate follow-up", e);
                // Fail silently, not critical
            }
        });

    }, [isCounterQuestionEnabled, currentQuestion, answers]);

    const handleEndInterview = async () => {
        if (!session || !plan || !user) return;
        
        startEndingTransition(async () => {
            try {
                 toast({ title: 'Interview Submitted!', description: 'Evaluating your answers... This may take a moment.'});

                const qa_pairs = session.questions.map(q => ({
                    qNo: q.qNo,
                    question: q.question,
                    answer: answers[q.qNo] || "No answer provided.",
                    whiteboard: whiteboard[q.qNo] || ""
                }));

                const evaluationResult = await evaluateInterviewAnswers({ qa_pairs });

                const updatedQuestions = session.questions.map((q, index) => ({
                    ...q,
                    answer: answers[q.qNo],
                    whiteboard: whiteboard[q.qNo],
                    aiReview: evaluationResult.evaluations[index].feedback,
                    idealAnswer: evaluationResult.evaluations[index].idealAnswer,
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
                router.push(`/job-switch-helper/summary/${sessionId}`);

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
                            <CardTitle>Your Response</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <Tabs defaultValue="text" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="text"><CaseSensitive className="mr-2"/>Text</TabsTrigger>
                                    <TabsTrigger value="whiteboard"><PencilRuler className="mr-2"/>Whiteboard</TabsTrigger>
                                </TabsList>
                                <TabsContent value="text" className="mt-4">
                                    <div className="relative">
                                     <Textarea 
                                        placeholder="Type your answer here..." 
                                        className="h-32 md:h-48 pr-12" 
                                        value={answers[currentQuestion.qNo] || ''} 
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        onBlur={handleGenerateFollowUp}
                                     />
                                     <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 text-muted-foreground">
                                        <Mic />
                                     </Button>
                                     </div>
                                </TabsContent>
                                 <TabsContent value="whiteboard" className="mt-4">
                                     <Textarea 
                                        placeholder="Type pseudocode, draw with characters, or outline your logic..." 
                                        className="h-32 md:h-48 font-mono" 
                                        value={whiteboard[currentQuestion.qNo] || ''} 
                                        onChange={(e) => handleWhiteboardChange(e.target.value)}
                                     />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    { (isGeneratingFollowUp || followUp) && (
                        <Card className="bg-muted/50">
                            <CardContent className="p-4">
                                {isGeneratingFollowUp ? (
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Loader2 className="mr-2 animate-spin h-4 w-4" /> Thinking...
                                    </div>
                                ) : (
                                    <p className="text-sm text-foreground italic">
                                        <span className="font-semibold mr-2">Hint:</span>{followUp}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-center p-2 md:p-4 border-t bg-card rounded-lg flex-wrap gap-4">
                 <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0}><ArrowLeft className="mr-0 md:mr-2" /><span className="hidden md:inline">Previous</span></Button>
                 <div className="flex items-center gap-2">
                    <Switch id="counter-questions" checked={isCounterQuestionEnabled} onCheckedChange={setIsCounterQuestionEnabled} />
                    <Label htmlFor="counter-questions" className="text-xs sm:text-sm">AI Hints</Label>
                 </div>
                 <Button onClick={() => setCurrentQuestionIndex(p => p + 1)} disabled={currentQuestionIndex === session.questions.length - 1}><span className="hidden md:inline">Next</span><ArrowRight className="ml-0 md:ml-2" /></Button>
            </div>
        </div>
    );
}
