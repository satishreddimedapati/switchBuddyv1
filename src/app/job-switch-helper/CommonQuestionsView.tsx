
'use client';

import type { InterviewExperience, InterviewQuestion } from "@/lib/types";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface CommonQuestion {
    questionText: string;
    occurrences: {
        experienceId: string;
        companyName: string;
        interviewDate: string;
        userRating: number;
        aiRating?: number;
    }[];
}

interface CommonQuestionsViewProps {
    experiences: InterviewExperience[];
}

export function CommonQuestionsView({ experiences }: CommonQuestionsViewProps) {
    const commonQuestions = useMemo(() => {
        const questionMap = new Map<string, CommonQuestion>();

        experiences.forEach(exp => {
            exp.questions.forEach(q => {
                // Improved normalization: lowercase, remove punctuation, and trim whitespace
                const normalizedText = q.questionText.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
                
                if (!normalizedText) return; // Skip empty questions

                if (!questionMap.has(normalizedText)) {
                    questionMap.set(normalizedText, {
                        questionText: q.questionText, // Keep the original text for display
                        occurrences: [],
                    });
                }

                questionMap.get(normalizedText)!.occurrences.push({
                    experienceId: exp.id!,
                    companyName: exp.companyName,
                    interviewDate: exp.interviewDate,
                    userRating: q.userRating,
                    aiRating: q.analysis?.aiRating,
                });
            });
        });

        const filtered = Array.from(questionMap.values())
            .filter(q => q.occurrences.length > 1);
            
        // Sort by most frequent first
        filtered.sort((a, b) => b.occurrences.length - a.occurrences.length);

        return filtered;
    }, [experiences]);

    if (commonQuestions.length === 0) {
        return (
            <div className="text-center p-8 border-dashed border-2 rounded-lg">
                <h3 className="text-xl font-semibold">No Common Questions Yet</h3>
                <p className="text-muted-foreground mt-2">
                    Once you log multiple interviews with similar questions, they will appear here.
                </p>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                    These questions have appeared in multiple interviews. Focus your prep here!
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full space-y-4">
                    {commonQuestions.map((commonQ, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <Card>
                                <AccordionTrigger className="p-4 text-left hover:no-underline">
                                     <div className="flex justify-between items-center w-full">
                                        <p className="font-semibold flex-1 pr-4">{commonQ.questionText}</p>
                                        <Badge>{commonQ.occurrences.length} times</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                        {commonQ.occurrences.map((occ, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                                                <div>
                                                    <p className="font-semibold text-sm">{occ.companyName}</p>
                                                    <p className="text-xs text-muted-foreground">{format(parseISO(occ.interviewDate), 'PPP')}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                     <div className="text-right">
                                                         <p className="text-xs text-muted-foreground">My Rating</p>
                                                         <p className="font-bold text-sm">{occ.userRating}/10</p>
                                                     </div>
                                                     {occ.aiRating && (
                                                         <div className="text-right">
                                                            <p className="text-xs text-muted-foreground">AI Rating</p>
                                                            <p className="font-bold text-sm text-primary">{occ.aiRating}/10</p>
                                                         </div>
                                                     )}
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={`/job-switch-helper/interview-experiences/${occ.experienceId}`}>
                                                            <ArrowRight />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                 </Accordion>
            </CardContent>
        </Card>
    );
}
