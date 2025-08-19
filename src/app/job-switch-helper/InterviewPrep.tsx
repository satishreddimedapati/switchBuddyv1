
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import type { InterviewPlan, InterviewSession } from "@/lib/types";
import { getInterviewPlans } from "@/services/interview-plans";
import { FileText, PlusCircle, Video, Loader2, History } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getInterviewSessions } from "@/services/interview-sessions";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { InterviewPlanCard } from "@/app/interview-prep/InterviewPlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

function NoActivePlan() {
    const router = useRouter();
    return (
        <div className="text-center p-8 border-dashed border-2 rounded-lg flex flex-col items-center gap-4">
            <h3 className="text-xl font-semibold">No Interview Plans Found</h3>
            <p className="text-muted-foreground">Create a new plan to start your mock interviews.</p>
            <Button onClick={() => router.push('/job-switch-helper/new')}>
                <PlusCircle />
                Create New Plan
            </Button>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
}

function PastInterviewRow({ interview }: { interview: InterviewSession }) {
    return (
        <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50">
            <div>
                <p className="font-semibold text-sm">Interview #{interview.interviewNumber}</p>
                <p className="text-xs text-muted-foreground">
                    {interview.completedAt ? format(new Date(interview.completedAt), 'PPP') : 'N/A'}
                </p>
            </div>
            <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="font-bold">{interview.overallScore ? interview.overallScore.toFixed(1) : 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/job-switch-helper/summary/${interview.id}`}>
                        <Video className="mr-2 h-4 w-4" /> Review
                    </Link>
                </Button>
            </div>
        </div>
    )
}


export function InterviewPrep() {
    const { user } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState<InterviewPlan[]>([]);
    const [pastSessions, setPastSessions] = useState<InterviewSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAllData() {
            if (!user) {
                setLoading(false);
                return;
            };
            setLoading(true);
            try {
                const [userPlans, userSessions] = await Promise.all([
                    getInterviewPlans(user.uid),
                    getInterviewSessions(user.uid)
                ]);

                userPlans.sort((a,b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
                setPlans(userPlans);

                const completedSessions = userSessions.filter(s => s.status === 'completed');
                
                completedSessions.sort((a, b) => {
                    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
                    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
                    return dateB - dateA;
                });

                setPastSessions(completedSessions);

            } catch (error) {
                console.error("Failed to fetch interview data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAllData();
    }, [user])

    const sessionsByPlan = useMemo(() => {
        return pastSessions.reduce((acc, session) => {
            const planId = session.planId;
            if (!acc[planId]) {
                acc[planId] = [];
            }
            acc[planId].push(session);
            return acc;
        }, {} as Record<string, InterviewSession[]>);
    }, [pastSessions]);


    const groupedPlans = useMemo(() => {
        return plans.reduce((acc, plan) => {
            const topic = plan.topic || 'Uncategorized';
            if (!acc[topic]) {
                acc[topic] = [];
            }
            acc[topic].push(plan);
            return acc;
        }, {} as Record<string, InterviewPlan[]>);
    }, [plans]);

    return (
        <div className="flex flex-col gap-8 pt-6">
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
                <Button onClick={() => router.push('/job-switch-helper/new')}>
                    <PlusCircle />
                    Create New Plan
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>My Interview Plans</CardTitle>
                    <CardDescription>All of your interview practice plans, grouped by topic.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? <LoadingState /> : (
                        Object.keys(groupedPlans).length > 0 ? (
                            <Accordion type="multiple" className="w-full space-y-4">
                                {Object.entries(groupedPlans).map(([topic, topicPlans]) => (
                                    <AccordionItem value={topic} key={topic} className="border-none">
                                        <Card>
                                            <AccordionTrigger className="text-lg font-semibold p-4 hover:no-underline">{topic}</AccordionTrigger>
                                            <AccordionContent className="pt-0 p-4 space-y-4">
                                                {topicPlans.map(plan => {
                                                    const planSessions = sessionsByPlan[plan.id!] || [];
                                                    return (
                                                        <Accordion key={plan.id} type="single" collapsible>
                                                            <AccordionItem value={`plan-${plan.id}`}>
                                                                <Card className="overflow-hidden">
                                                                     <AccordionTrigger className="hover:no-underline p-0">
                                                                        <div className="w-full">
                                                                            <InterviewPlanCard plan={plan} />
                                                                        </div>
                                                                     </AccordionTrigger>
                                                                    <AccordionContent>
                                                                         {planSessions.length > 0 && (
                                                                            <div className="px-4 pb-4 space-y-2">
                                                                                <Separator />
                                                                                <h4 className="font-semibold text-sm pt-2 flex items-center gap-2"><History className="h-4 w-4"/> Session History</h4>
                                                                                {planSessions.map(session => (
                                                                                    <PastInterviewRow key={session.id} interview={session} />
                                                                                ))}
                                                                            </div>
                                                                         )}
                                                                    </AccordionContent>
                                                                </Card>
                                                            </AccordionItem>
                                                        </Accordion>
                                                    )
                                                })}
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <NoActivePlan />
                        )
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
