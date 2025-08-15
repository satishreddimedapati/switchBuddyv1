'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Video } from "lucide-react";
import Link from "next/link";

// This is a placeholder for the interview summary page.
// We will build out the full functionality in subsequent steps.

export default function InterviewSummaryPage({ params }: { params: { id: string } }) {
  
  const mockSummary = {
    interviewNumber: 3,
    date: '2023-10-28',
    overallScore: 8.5,
    questions: [
        { 
            question: "What is the difference between `let`, `const`, and `var` in JavaScript?", 
            answer: "My answer about variable scoping and immutability...",
            aiReview: "A good summary, but you could have gone into more detail on hoisting for `var`.",
            rating: 8,
        },
        { 
            question: "Explain the concept of the CSS Box Model.", 
            answer: "My description of content, padding, border, and margin...",
            aiReview: "Excellent and thorough. You covered all the key components clearly.",
            rating: 9,
        }
    ]
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Interview #{mockSummary.interviewNumber} Summary
        </h1>
        <p className="text-muted-foreground">
          Completed on {mockSummary.date}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>Review the AI feedback for each question.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {mockSummary.questions.map((item, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4">
                                    <span>{`Q${index + 1}: ${item.question.substring(0, 50)}...`}</span>
                                    <span className="font-semibold">{item.rating}/10</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <p><strong>Your Answer:</strong> {item.answer}</p>
                                <div className="p-3 bg-muted/50 rounded-md">
                                    <p><strong>AI Review:</strong> {item.aiReview}</p>
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
                    <p className="text-5xl font-bold">{mockSummary.overallScore}</p>
                    <p className="text-muted-foreground">out of 10</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                     <Button><Download className="mr-2" /> Download PDF</Button>
                    <Button variant="secondary" asChild>
                        <Link href="/interview-prep">
                            <Video className="mr-2" /> Start Next Interview
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
