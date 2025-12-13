
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { InterviewExperience } from '@/lib/types';
import { getInterviewExperience, deleteInterviewExperience } from '@/services/interview-experiences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2, Loader2, Star, Bot } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

function LoadingState() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

export default function InterviewExperiencePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const experienceId = params.id as string;

  const [experience, setExperience] = useState<InterviewExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchExperience() {
      if (!user || !experienceId) return;
      setLoading(true);
      const data = await getInterviewExperience(experienceId);
      if (data && data.userId === user.uid) {
        setExperience(data);
      } else {
        toast({ title: "Not Found", description: "The requested interview experience could not be found.", variant: 'destructive' });
        router.push('/job-switch-helper?tab=interview-experiences');
      }
      setLoading(false);
    }
    fetchExperience();
  }, [user, experienceId, router, toast]);

  const handleDelete = async () => {
    if (!user || !experienceId) return;
    setIsDeleting(true);
    try {
        await deleteInterviewExperience(experienceId, user.uid);
        toast({ title: "Success", description: "Experience deleted." });
        router.push('/job-switch-helper?tab=interview-experiences');
    } catch (error) {
        toast({ title: "Error", description: "Failed to delete experience.", variant: 'destructive' });
        setIsDeleting(false);
    }
  }

  if (loading || !experience) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="mr-2"/> Back
          </Button>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            {experience.companyName} - {experience.role}
          </h1>
          <p className="text-muted-foreground">
            {experience.roundType} Round on {format(parseISO(experience.interviewDate), 'PPP')}
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href={`/job-switch-helper/interview-experiences/edit/${experience.id}`}>
                    <Edit className="mr-2"/> Edit
                </Link>
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 className="mr-2" />}
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this interview experience log. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
            {experience.questions.map((q, index) => (
                <Card key={q.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">Question {index + 1}: {q.questionText}</CardTitle>
                            <Badge>{q.topic}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2">My Answer</h4>
                            <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 rounded-md">{q.userAnswer || 'No answer logged.'}</p>
                             <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">My Rating:</span>
                                    <Badge variant="secondary">{q.userRating}/10</Badge>
                                </div>
                                {q.analysis && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">AI Rating:</span>
                                        <Badge variant="default" className="bg-primary/90">{q.analysis.aiRating}/10</Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                        {q.analysis?.idealAnswer && (
                            <div>
                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Bot className="h-4 w-4 text-primary"/>Ideal Answer (from AI)</h4>
                                <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">{q.analysis.idealAnswer}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="space-y-6 lg:sticky top-6">
            <Card>
                <CardHeader>
                    <CardTitle>Overall Summary</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-5xl font-bold flex items-center justify-center gap-2">
                         <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                         {experience.overallRating}/10
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">My Self-Rating</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot /> AI Analysis</CardTitle>
                    <CardDescription>AI-powered feedback on your performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" disabled>Analyze with AI (Coming Soon)</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
