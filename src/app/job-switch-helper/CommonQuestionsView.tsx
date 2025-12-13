
'use client';

import type { InterviewExperience, InterviewQuestion } from "@/lib/types";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BrainCircuit, Repeat } from "lucide-react";

interface CommonQuestion {
    normalizedText: string;
    occurrences: {
        experienceId: string;
        questionText: string;
        companyName: string;
        interviewDate: string;
        userRating: number;
        aiRating?: number;
    }[];
}

interface CommonQuestionsViewProps {
    experiences: InterviewExperience[];
}

// Function to normalize question text for comparison
const normalizeQuestionText = (text: string) => {
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
};


export function CommonQuestionsView({ experiences }: CommonQuestionsViewProps) {
    const commonQuestions = useMemo(() => {
        const questionMap = new Map<string, CommonQuestion['occurrences']>();

        // 1. Group all questions by their normalized text
        experiences.forEach(exp => {
            if (!exp.id) return;
            exp.questions.forEach(q => {
                const normalized = normalizeQuestionText(q.questionText);
                
                if (!questionMap.has(normalized)) {
                    questionMap.set(normalized, []);
                }

                questionMap.get(normalized)!.push({
                    experienceId: exp.id!,
                    questionText: q.questionText, // Keep original for display
                    companyName: exp.companyName,
                    interviewDate: exp.interviewDate,
                    userRating: q.userRating,
                    aiRating: q.analysis?.aiRating,
                });
            });
        });
        
        // 2. Filter down to only questions that appeared more than once
        const filtered: CommonQuestion[] = [];
        questionMap.forEach((occurrences, normalizedText) => {
            if (occurrences.length > 1) {
                filtered.push({
                    normalizedText,
                    occurrences,
                });
            }
        });
            
        // 3. Sort by most frequent first
        filtered.sort((a, b) => b.occurrences.length - a.occurrences.length);

        return filtered;
    }, [experiences]);

    if (commonQuestions.length === 0) {
        return (
            <div className="text-center p-8 border-dashed border-2 rounded-lg flex flex-col items-center gap-4">
                <Repeat className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-xl font-semibold">No Common Questions Yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                    Once you log multiple interviews where the same question is asked, they will appear here for focused practice.
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
                    {commonQuestions.map((commonQuestion, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <Card>
                                <AccordionTrigger className="p-4 text-left hover:no-underline">
                                     <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            <BrainCircuit className="h-6 w-6 text-primary" />
                                            <p className="font-semibold flex-1 pr-4 text-lg">{commonQuestion.occurrences[0].questionText}</p>
                                        </div>
                                        <Badge>{commonQuestion.occurrences.length} interviews</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                        {commonQuestion.occurrences.map((occ, i) => (
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
