'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import type { InterviewPlan } from "@/lib/types";
import { getInterviewPlans } from "@/services/interview-plans";
import { FileText, PlusCircle, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Mock data until we have real data
const mockPastInterviews = [
    { id: '1', number: 1, date: '2023-10-26', score: 7.5, status: 'Completed' },
    { id: '2', number: 2, date: '2023-10-27', score: 8.2, status: 'Completed' },
    { id: '3', number: 3, date: '2023-10-28', score: 0, status: 'Pending' },
];


function NoActivePlan() {
    return (
        <div className="text-center p-8 border-dashed border-2 rounded-lg flex flex-col items-center gap-4">
            <h3 className="text-xl font-semibold">No Active Interview Plan</h3>
            <p className="text-muted-foreground">Create a new plan to start your mock interviews.</p>
            <Button asChild>
                <Link href="/interview-prep/new">
                    <PlusCircle />
                    Create New Plan
                </Link>
            </Button>
        </div>
    )
}

function ActivePlanCard({ plan }: { plan: InterviewPlan }) {
    return (
         <Card className="bg-accent/20 border-accent">
            <CardHeader>
                <CardTitle>Your Active Plan: {plan.topic}</CardTitle>
                <CardDescription>You are currently on an active interview plan. Keep up the momentum!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="font-semibold">Difficulty</p>
                        <p className="text-muted-foreground">{plan.difficulty}</p>
                    </div>
                     <div>
                        <p className="font-semibold">Duration</p>
                        <p className="text-muted-foreground">{plan.durationMinutes} min</p>
                    </div>
                    <div>
                        <p className="font-semibold">Planned</p>
                        <p className="text-muted-foreground">{plan.totalInterviews} interviews</p>
                    </div>
                     <div>
                        <p className="font-semibold">Completed</p>
                        <p className="text-muted-foreground">{plan.completedInterviews} interviews</p>
                    </div>
                </div>
                 <div className="flex justify-end">
                    <Button asChild>
                         <Link href={`/interview-prep/session/new?planId=${plan.id}`}>
                            <Video />
                            Start Next Interview
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}


export default function InterviewPrepPage() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<InterviewPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            if (!user) return;
            setLoading(true);
            const userPlans = await getInterviewPlans(user.uid);
            setPlans(userPlans);
            setLoading(false);
        }
        fetchPlans();
    }, [user])

    // For now, we assume the first plan is the active one.
    const activePlan = plans.find(p => p.completedInterviews < p.totalInterviews);
    const totalPlanned = activePlan?.totalInterviews || 0;
    const totalCompleted = activePlan?.completedInterviews || 0;

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Mock Interviews
                </h1>
                <p className="text-muted-foreground">
                    Practice makes perfect. Simulate real interviews and get AI-powered feedback.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Progress value={(totalCompleted / (totalPlanned || 1)) * 100} />
                    <p className="text-sm text-muted-foreground">
                       {totalCompleted > 0 ? `You have completed ${totalCompleted} of ${totalPlanned} interviews.` : "No interviews completed yet."} 
                       {totalPlanned > totalCompleted && ` ${totalPlanned - totalCompleted} more to go!`}
                    </p>
                </CardContent>
            </Card>

            {loading ? <Card><CardContent className="p-8"><div className="animate-pulse bg-muted h-24 rounded-md"></div></CardContent></Card> : (
                activePlan ? <ActivePlanCard plan={activePlan} /> : <NoActivePlan />
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle>Past Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Interview #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Average Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockPastInterviews.map(interview => (
                                <TableRow key={interview.id}>
                                    <TableCell>{interview.number}</TableCell>
                                    <TableCell>{interview.date}</TableCell>
                                    <TableCell>{interview.score > 0 ? interview.score : 'N/A'}</TableCell>
                                    <TableCell>{interview.status}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" disabled={interview.status === 'Pending'}><FileText className="mr-2 h-4 w-4" /> View PDF</Button>
                                        <Button variant="outline" size="sm" asChild>
                                           <Link href={`/interview-prep/summary/${interview.id}`}>
                                                <Video className="mr-2 h-4 w-4" /> Review Online
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {mockPastInterviews.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No past interviews found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}
