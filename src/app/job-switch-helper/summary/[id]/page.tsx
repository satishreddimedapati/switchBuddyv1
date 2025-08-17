
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { InterviewSession } from "@/lib/types";
import { getInterviewSession } from "@/services/interview-sessions";
import { Download, Loader2, Video } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";


export default function InterviewSummaryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadSession() {
        setLoading(true);
        const sessionData = await getInterviewSession(sessionId);
        if (sessionData && sessionData.userId === user.uid) {
            setSession(sessionData);
        } else {
            router.push('/job-switch-helper?tab=interview-prep'); // Redirect if not found or not owned
        }
        setLoading(false);
    }
    loadSession();
  }, [user, sessionId, router])

  if (loading) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-12 w-1/2" />
            <div className="grid md:grid-cols-3 gap-4">
                <Skeleton className="h-96 md:col-span-2" />
                <div className="space-y-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        </div>
    );
  }

  if (!session) {
    return <p>Interview not found.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Interview #{session.interviewNumber} Summary
        </h1>
        <p className="text-muted-foreground">
          Completed on {session.completedAt ? format(new Date(session.completedAt), 'PPP') : 'N/A'}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Review the AI feedback for each question.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {session.questions.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span className="text-left flex-1">{`Q${index + 1}: ${item.question.substring(0, 50)}...`}</span>
                                    <span className="font-semibold">{item.rating || 'N/A'}/10</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <div className="p-3 border rounded-md">
                                    <p><strong>Your Answer:</strong></p>
                                    <p className="text-muted-foreground">{item.answer || 'No answer provided.'}</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-md">
                                    <p><strong>AI Review:</strong></p>
                                    <p className="text-muted-foreground">{item.aiReview || 'No review available.'}</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
        
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Overall Score</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-5xl font-bold">{session.overallScore?.toFixed(1) || 'N/A'}</p>
                    <p className="text-muted-foreground">out of 10</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                     <Button disabled><Download className="mr-2" /> Download PDF</Button>
                    <Button variant="secondary" asChild>
                        <Link href="/job-switch-helper?tab=interview-prep">
                            <Video className="mr-2" /> Back to Prep Dashboard
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
