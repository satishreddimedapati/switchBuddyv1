
'use client';

import type { InterviewExperience, InterviewQuestion } from "@/lib/types";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BrainCircuit } from "lucide-react";

interface CommonTopic {
    topic: string;
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

export function CommonQuestionsView({ experiences }: CommonQuestionsViewProps) {
    const commonTopics = useMemo(() => {
        const topicMap = new Map<string, CommonTopic>();

        experiences.forEach(exp => {
            exp.questions.forEach(q => {
                const topic = q.topic || 'Uncategorized';
                
                if (!topicMap.has(topic)) {
                    topicMap.set(topic, {
                        topic: topic,
                        occurrences: [],
                    });
                }

                topicMap.get(topic)!.occurrences.push({
                    experienceId: exp.id!,
                    questionText: q.questionText,
                    companyName: exp.companyName,
                    interviewDate: exp.interviewDate,
                    userRating: q.userRating,
                    aiRating: q.analysis?.aiRating,
                });
            });
        });

        const filtered = Array.from(topicMap.values())
            .filter(t => t.occurrences.length > 1);
            
        // Sort by most frequent first
        filtered.sort((a, b) => b.occurrences.length - a.occurrences.length);

        return filtered;
    }, [experiences]);

    if (commonTopics.length === 0) {
        return (
            <div className="text-center p-8 border-dashed border-2 rounded-lg">
                <h3 className="text-xl font-semibold">No Common Topics Yet</h3>
                <p className="text-muted-foreground mt-2">
                    Once you log multiple interviews with questions from the same topic, they will appear here.
                </p>
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Frequently Asked Topics</CardTitle>
                <CardDescription>
                    These topics have appeared in multiple interviews. Focus your prep here!
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full space-y-4">
                    {commonTopics.map((commonTopic, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <Card>
                                <AccordionTrigger className="p-4 text-left hover:no-underline">
                                     <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            <BrainCircuit className="h-6 w-6 text-primary" />
                                            <p className="font-semibold flex-1 pr-4 text-lg">{commonTopic.topic}</p>
                                        </div>
                                        <Badge>{commonTopic.occurrences.length} questions</Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                        {commonTopic.occurrences.map((occ, i) => (
                                            <div key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                                                <div>
                                                    <p className="font-semibold text-sm truncate">{occ.questionText}</p>
                                                    <p className="text-xs text-muted-foreground">{occ.companyName} - {format(parseISO(occ.interviewDate), 'PPP')}</p>
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
