'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Mic, Timer } from "lucide-react";

// This is a placeholder for the live interview room.
// We will build out the full functionality in subsequent steps.

export default function InterviewSessionPage({ params }: { params: { id: string } }) {
    
    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 border-b bg-card rounded-lg">
                <div className="font-semibold">Interview 4 / 10</div>
                <div className="flex items-center gap-2 font-mono p-2 bg-muted rounded-md">
                    <Timer className="h-5 w-5" />
                    <span>28:45</span>
                </div>
                <Button variant="outline">Exit</Button>
            </div>

            {/* Main Body */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex flex-col gap-4">
                    <Card className="flex-grow">
                        <CardHeader>
                            <CardTitle>Question</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">
                                Placeholder Question: Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Your Answer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea placeholder="Type your answer here..." className="h-32" />
                            <div className="flex justify-between items-center">
                                <Button variant="outline" size="icon"><Mic /></Button>
                                <Button>Submit Answer</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground p-8">
                            Submit your answer to get feedback from the AI.
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-center p-4 border-t bg-card rounded-lg">
                 <Button variant="outline"><ArrowLeft /> Previous</Button>
                 <div className="text-sm text-muted-foreground">Question 2 of 8</div>
                 <Button>Next Question <ArrowRight /></Button>
            </div>
        </div>
    );
}
