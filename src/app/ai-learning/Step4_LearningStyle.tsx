
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Video, BookOpen, MessageSquare, TestTube2, PlusCircle, Wand2 } from 'lucide-react';
import type { RoadmapInputs } from './RoadmapGenerator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Step4Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

const learningStyles = [
    { id: 'Video', title: 'Video Tutorials', icon: Video, description: 'Guided lessons from platforms like YouTube and Udemy.' },
    { id: 'Article', title: 'Reading', icon: BookOpen, description: 'Learn from official documentation and articles.' },
    { id: 'Chat Lessons', title: 'Chat Lessons', icon: MessageSquare, description: 'Bite-sized, conversational lessons from an AI tutor.' },
    { id: 'Interactive Tutorial', title: 'Hands-on Labs', icon: TestTube2, description: 'Short videos paired with mini coding challenges.' },
];

export function Step4_LearningStyle({ data, onUpdate }: Step4Props) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>How Do You Learn Best?</CardTitle>
                <CardDescription>Select your preferred style to get the right kind of content.</CardDescription>
            </CardHeader>
            <CardContent>
                <ToggleGroup
                    type="single"
                    value={data.learningStyle}
                    onValueChange={(value) => value && onUpdate({ learningStyle: value })}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {learningStyles.map(style => (
                        <ToggleGroupItem 
                            key={style.id}
                            value={style.title}
                            className="h-auto p-0"
                            asChild
                        >
                            <Card className={cn(
                                "p-4 cursor-pointer transition-all w-full",
                                data.learningStyle === style.title && "ring-2 ring-primary bg-primary/10"
                            )}>
                                <div className="flex items-center gap-4">
                                    <style.icon className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-semibold text-left">{style.title}</h3>
                                        <p className="text-xs text-muted-foreground text-left font-normal">{style.description}</p>
                                    </div>
                                </div>
                            </Card>
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </CardContent>
        </Card>
    );
}
