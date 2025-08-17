
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import type { InterviewPlan, InterviewSession } from "@/lib/types";
import { getInterviewPlans } from "@/services/interview-plans";
import { FileText, PlusCircle, Video, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { getInterviewSessions } from "@/services/interview-sessions";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { InterviewPlanCard } from "@/app/interview-prep/InterviewPlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

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
                            <Accordion type="multiple" defaultValue={Object.keys(groupedPlans)}>
                                {Object.entries(groupedPlans).map(([topic, topicPlans]) => (
                                    <AccordionItem value={topic} key={topic}>
                                        <AccordionTrigger className="text-lg font-semibold">{topic}</AccordionTrigger>
                                        <AccordionContent className="pt-4 space-y-4">
                                            {topicPlans.map(plan => (
                                                <InterviewPlanCard key={plan.id} plan={plan} />
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <NoActivePlan />
                        )
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Past Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Interview #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pastSessions.map(interview => (
                                    <TableRow key={interview.id}>
                                        <TableCell>{interview.interviewNumber}</TableCell>
                                        <TableCell>{interview.completedAt ? format(new Date(interview.completedAt), 'PPP') : 'N/A'}</TableCell>
                                        <TableCell>{interview.overallScore ? interview.overallScore.toFixed(1) : 'N/A'}</TableCell>
                                        <TableCell>{interview.status}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" disabled={interview.status !== 'completed'}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
                                            <Button variant="outline" size="sm" asChild>
                                               <Link href={`/job-switch-helper/summary/${interview.id}`}>
                                                    <Video className="mr-2 h-4 w-4" /> Review
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                 {pastSessions.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No past interviews found.</TableCell>
                                    </TableRow>
                                )}
                                 {loading && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24"><Loader2 className="animate-spin mx-auto" /></TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
