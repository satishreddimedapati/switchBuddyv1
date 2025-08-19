
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuickRoadmapInputs } from './page';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

interface Step3Props {
    data: QuickRoadmapInputs;
    onUpdate: (updates: Partial<QuickRoadmapInputs>) => void;
}

const exampleReply = "“I know Angular very well, .NET is okay, SQL is beginner level, and Cloud I only have some knowledge.”";

export function Step3_Chatbot({ data, onUpdate }: Step3Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Self-Assessment</CardTitle>
                <CardDescription>Let's get a quick understanding of your current skill level to prioritize topics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <Avatar>
                        <AvatarFallback><Bot/></AvatarFallback>
                    </Avatar>
                    <div className="space-y-2 pt-1">
                        <p className="font-semibold">AI Coach</p>
                        <div className="p-3 rounded-lg rounded-bl-none bg-background text-sm">
                            <p>Tell me honestly about your current state regarding the tech stack we identified.</p>
                            <p className="mt-2 font-medium">What are your strong and weak areas?</p>
                        </div>
                    </div>
                </div>

                <div>
                    <Label htmlFor="self-assessment">Your Answer</Label>
                    <Textarea 
                        id="self-assessment"
                        value={data.selfAssessment}
                        onChange={(e) => onUpdate({ selfAssessment: e.target.value })}
                        placeholder={exampleReply}
                        rows={5}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
