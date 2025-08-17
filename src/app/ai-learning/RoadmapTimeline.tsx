
'use client';

import type { LearningRoadmap } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, ExternalLink, TestTube2, Video, MessageSquare, ArrowRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const resourceIcons = {
    'Video': <Video className="h-4 w-4" />,
    'Article': <BookOpen className="h-4 w-4" />,
    'Interactive Tutorial': <TestTube2 className="h-4 w-4" />,
    'Chat Lessons': <MessageSquare className="h-4 w-4" />,
};

interface RoadmapTimelineProps {
  roadmap: LearningRoadmap;
}

export function RoadmapTimeline({ roadmap }: RoadmapTimelineProps) {

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Learning Journey</CardTitle>
                <CardDescription>Hover over the daily checkpoints to see your tasks.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full pb-4">
                    <div className="flex items-center space-x-4 min-w-max">
                        {roadmap.roadmap.weeks.map((week, weekIndex) => (
                            <React.Fragment key={week.week}>
                                <div className="flex flex-col items-center text-center w-48">
                                    <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mb-2">
                                        {week.week}
                                    </div>
                                    <p className="font-semibold text-sm">Week {week.week}</p>
                                    <p className="text-xs text-muted-foreground">{week.theme}</p>
                                </div>
                                
                                {weekIndex < roadmap.roadmap.weeks.length - 1 && (
                                    <div className="flex items-center flex-1 min-w-[400px]">
                                        <div className="w-full h-1 bg-border relative flex items-center justify-between px-6">
                                            {week.daily_tasks.slice(0, 5).map((task, dayIndex) => (
                                                 <HoverCard key={dayIndex}>
                                                    <HoverCardTrigger asChild>
                                                        <button className="h-4 w-4 bg-muted-foreground rounded-full hover:bg-primary transition-colors"></button>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent className="w-80">
                                                        <div className="space-y-2">
                                                            <h4 className="font-semibold">{task.day}: {task.topic}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                {resourceIcons[task.resource_type as keyof typeof resourceIcons] || <ExternalLink className="h-4 w-4" />}
                                                                <span>{task.resource_type}</span>
                                                            </div>
                                                            {task.resource_link && (
                                                                <Button variant="outline" size="sm" asChild>
                                                                    <a href={task.resource_link} target="_blank" rel="noopener noreferrer" className="text-xs">
                                                                        <ExternalLink className="h-3 w-3 mr-2" />
                                                                        Open Resource
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {task.challenge && (
                                                                <div className="mt-2 pt-2 border-t">
                                                                    <p className="text-sm font-semibold">Challenge:</p>
                                                                    <p className="text-sm text-muted-foreground italic">&quot;{task.challenge}&quot;</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </HoverCardContent>
                                                </HoverCard>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                     <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

// Dummy React import for type-only usage
import * as React from 'react';
