
'use client';

import { useState } from 'react';
import type { LearningRoadmap, WeeklyPlan } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DailyTaskItem } from './DailyTaskItem';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoadmapDisplayProps {
    roadmap: LearningRoadmap;
}

export function RoadmapDisplay({ roadmap }: RoadmapDisplayProps) {
    const isMobile = useIsMobile();
    const [selectedWeek, setSelectedWeek] = useState<WeeklyPlan | undefined>(roadmap.roadmap.weeks[0]);

    if (isMobile) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{roadmap.topic}</CardTitle>
                    <CardDescription>Your {roadmap.duration}-month learning plan. Stay consistent!</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {roadmap.roadmap.weeks.map(week => (
                            <AccordionItem value={`week-${week.week}`} key={week.week}>
                                <AccordionTrigger>
                                    <div className="text-left">
                                        <p className="font-semibold">Week {week.week}</p>
                                        <p className="text-sm text-muted-foreground">{week.theme}</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2">
                                     {week.daily_tasks.map((task, index) => (
                                        <DailyTaskItem key={index} task={task} />
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
            {/* Weekly Navigation */}
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Weekly Plan</CardTitle>
                     <CardDescription>Select a week to view details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-full pr-4">
                        <ul className="space-y-2">
                            {roadmap.roadmap.weeks.map(week => (
                                <li key={week.week}>
                                    <button 
                                        onClick={() => setSelectedWeek(week)}
                                        className={cn(
                                            "w-full text-left p-3 rounded-md transition-colors",
                                            selectedWeek?.week === week.week ? 'bg-primary/20 text-primary-foreground' : 'hover:bg-muted/50'
                                        )}
                                    >
                                        <p className="font-semibold">Week {week.week}</p>
                                        <p className="text-sm text-muted-foreground">{week.theme}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Daily Plan */}
            <Card className="md:col-span-2 lg:col-span-3">
                 <CardHeader>
                    {selectedWeek ? (
                        <>
                            <CardTitle>Week {selectedWeek.week}: {selectedWeek.theme}</CardTitle>
                            <CardDescription>Your daily tasks for this week.</CardDescription>
                        </>
                    ) : (
                        <CardTitle>Select a week</CardTitle>
                    )}
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-full">
                        <div className="space-y-3 pr-4">
                            {selectedWeek ? (
                                selectedWeek.daily_tasks.map((task, index) => (
                                    <DailyTaskItem key={index} task={task} />
                                ))
                            ) : (
                                <p className="text-muted-foreground text-center pt-10">Select a week from the left to see the daily plan.</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
