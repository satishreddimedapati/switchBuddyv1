

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { InterviewExperience, InterviewQuestion } from '@/lib/types';
import { getInterviewExperience, deleteInterviewExperience } from '@/services/interview-experiences';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Trash2, Loader2, Star, Bot, Download, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';
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
import Link from 'next/link';
import { jsPDF } from "jspdf";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

function QuestionCard({ question }: { question: InterviewQuestion }) {
    const selfRatingColor = question.userRating >= 7 ? 'text-green-600' : question.userRating >= 4 ? 'text-yellow-600' : 'text-red-600';
    const aiRatingColor = question.analysis?.aiRating && (question.analysis.aiRating >= 7 ? 'text-green-600' : question.analysis.aiRating >= 4 ? 'text-yellow-600' : 'text-red-600');

    return (
        <Card className="border-l-4" style={{borderColor: `hsl(var(--primary)) / 0.5`}}>
            <AccordionItem value={question.id}>
                <AccordionTrigger className="p-4 text-left hover:no-underline">
                     <div className="flex justify-between items-start w-full pr-4">
                        <h4 className="font-semibold flex-1">{question.questionText}</h4>
                        <Badge variant="outline" className="ml-4">{question.topic}</Badge>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0 space-y-4">
                     <Separator />
                     <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-4">
                             <div>
                                <h5 className="font-semibold text-sm mb-2">My Answer</h5>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 rounded-md border">{question.userAnswer || 'No answer logged.'}</p>
                            </div>
                            {question.analysis?.idealAnswer && (
                                <div>
                                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2"><Bot className="h-4 w-4 text-primary"/>Ideal Answer</h5>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">{question.analysis.idealAnswer}</p>
                                </div>
                            )}
                        </div>
                        <div className="w-full sm:w-48 space-y-4">
                            <Card className="bg-muted/30">
                                <CardHeader className="p-3">
                                    <CardTitle className="text-sm flex items-center justify-between">My Rating <span className={selfRatingColor}>{question.userRating}/10</span></CardTitle>
                                </CardHeader>
                            </Card>
                            {question.analysis && (
                                 <Card className="bg-muted/30">
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-sm flex items-center justify-between">AI Rating <span className={aiRatingColor}>{question.analysis.aiRating}/10</span></CardTitle>
                                    </CardHeader>
                                </Card>
                            )}
                             {question.analysis?.shortcut && (
                                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-600"/>Shortcut</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <p className="text-sm text-amber-800 dark:text-amber-200 italic">&quot;{question.analysis.shortcut}&quot;</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                     </div>

                </AccordionContent>
            </AccordionItem>
        </Card>
    )
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
  const [isDownloading, setIsDownloading] = useState(false);

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
  
  const handleDownloadPdf = () => {
    if (!experience) return;
    setIsDownloading(true);

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPos = margin;

    const addPageIfNeeded = (spaceNeeded: number) => {
        if (yPos + spaceNeeded > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
        }
    };

    doc.setFontSize(18);
    doc.text(`${experience.companyName} - ${experience.role}`, margin, yPos);
    yPos += 8;
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${experience.roundType} Round on ${format(parseISO(experience.interviewDate), 'PPP')}`, margin, yPos);
    yPos += 15;

    experience.questions.forEach((q, index) => {
        if (index > 0 && index % 3 === 0) {
            doc.addPage();
            yPos = margin;
        }
        
        const questionLines = doc.splitTextToSize(`Q${index + 1}: ${q.questionText}`, 180);
        addPageIfNeeded(questionLines.length * 5 + 50); // Rough estimate
        doc.setDrawColor(230, 230, 230);
        doc.roundedRect(margin - 2, yPos - 5, 184, 1, 0, 0, 'F');
        yPos += 5;

        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text(questionLines, margin, yPos);
        yPos += questionLines.length * 5 + 5;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(80);
        
        if (q.analysis?.idealAnswer) {
             const idealAnswerLines = doc.splitTextToSize(`Ideal Answer: ${q.analysis.idealAnswer}`, 170);
             addPageIfNeeded(idealAnswerLines.length * 5);
             doc.text(idealAnswerLines, margin + 5, yPos);
             yPos += idealAnswerLines.length * 5 + 5;
        }

        yPos += 10;
    });


    doc.save(`InterviewSummary_${experience.companyName}_${experience.role}.pdf`);
    setIsDownloading(false);
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
             <Button onClick={handleDownloadPdf} disabled={isDownloading} variant="outline">
                {isDownloading ? <Loader2 className="mr-2 animate-spin"/> : <Download className="mr-2"/>} PDF
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
            <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={experience.questions[0]?.id}>
                 {experience.questions.map((q) => (
                    <QuestionCard key={q.id} question={q} />
                ))}
            </Accordion>
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
        </div>
      </div>
    </div>
  );
}
