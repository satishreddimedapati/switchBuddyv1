
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Video, BookOpen, MessageSquare, TestTube2 } from 'lucide-react';
import type { RoadmapInputs } from './RoadmapGenerator';

interface Step4Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

const learningStyles = [
    { id: 'Video Tutorials', title: 'Video Tutorials', icon: Video, description: 'Guided lessons from platforms like YouTube and Udemy.' },
    { id: 'Reading Docs / Blogs', title: 'Reading', icon: BookOpen, description: 'Learn from official documentation and articles.' },
    { id: 'Chat-based Micro-lessons', title: 'Chat Lessons', icon: MessageSquare, description: 'Bite-sized, conversational lessons from an AI tutor.' },
    { id: 'Hands-on Lessons', title: 'Hands-on Labs', icon: TestTube2, description: 'Short videos paired with mini coding challenges.' },
];

export function Step4_LearningStyle({ data, onUpdate }: Step4Props) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>How Do You Learn Best?</CardTitle>
                <CardDescription>Select your preferred style to get the right kind of content.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {learningStyles.map(style => {
                        const isSelected = data.learningStyle === style.id;
                        return (
                            <Card 
                                key={style.id}
                                onClick={() => onUpdate({ learningStyle: style.id })}
                                className={cn(
                                    "p-4 cursor-pointer transition-all",
                                    isSelected && "ring-2 ring-primary"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <style.icon className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">{style.title}</h3>
                                        <p className="text-xs text-muted-foreground">{style.description}</p>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

