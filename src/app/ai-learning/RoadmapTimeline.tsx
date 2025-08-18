
'use client';

import * as React from 'react';
import type { LearningRoadmap, DailyTaskItem as DailyTaskItemType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { DailyTaskItem } from './DailyTaskItem';


interface RoadmapTimelineProps {
  roadmap: LearningRoadmap;
}

function DailyCheckpoint({ task, preferredChannel, roadmapId }: { task: DailyTaskItemType, preferredChannel?: string, roadmapId: string }) {
    const taskDate = task.date ? parseISO(task.date) : null;
    return (
        <div className="flex flex-col items-center gap-1">
            {taskDate && (
                <div className="text-center text-[10px] leading-tight text-muted-foreground">
                    <p className="font-semibold">{format(taskDate, 'EEE')}</p>
                    <p>{format(taskDate, 'd')}</p>
                </div>
            )}
            <HoverCard>
                <HoverCardTrigger asChild>
                    <button className="h-4 w-4 bg-muted-foreground rounded-full hover:bg-primary transition-colors"></button>
                </HoverCardTrigger>
                <HoverCardContent className="w-96" onMouseDown={(e) => e.stopPropagation()}>
                    <DailyTaskItem task={task} roadmapId={roadmapId} preferredChannel={preferredChannel} />
                </HoverCardContent>
            </HoverCard>
        </div>
    )
}

function WeekMilestone({ week }: { week: LearningRoadmap['roadmap']['weeks'][0] }) {
    return (
        <div className="flex flex-col items-center text-center w-48 shrink-0">
            <div className="h-10 w-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mb-2">
                {week.week}
            </div>
            <p className="font-semibold text-sm">Week {week.week}</p>
            <p className="text-xs text-muted-foreground">{week.theme}</p>
        </div>
    )
}

export function RoadmapTimeline({ roadmap }: RoadmapTimelineProps) {
    const dotsToShow = roadmap.learnOnWeekends ? 7 : 5;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Learning Journey</CardTitle>
                <CardDescription>A visual timeline of your personalized plan. Hover over the checkpoints for details.</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View: Horizontal Scroll */}
                <div className="hidden md:block">
                    <ScrollArea className="w-full pb-4">
                        <div className="flex items-end space-x-4 min-w-max">
                            {roadmap.roadmap.weeks.map((week, weekIndex) => (
                                <React.Fragment key={week.week}>
                                    <WeekMilestone week={week} />
                                    
                                    {weekIndex < roadmap.roadmap.weeks.length && (
                                        <div className="flex items-end flex-1 min-w-[300px] lg:min-w-[400px]">
                                            <div className="w-full h-1 bg-border relative flex items-end justify-between px-2">
                                                {week.daily_tasks.slice(0, dotsToShow).map((task, dayIndex) => (
                                                     <DailyCheckpoint key={dayIndex} task={task} roadmapId={roadmap.id!} preferredChannel={roadmap.preferredChannel} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                         <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>

                {/* Mobile View: Vertical Snake */}
                <div className="md:hidden">
                    <div className="flex flex-col items-center space-y-2">
                        {roadmap.roadmap.weeks.map((week, weekIndex) => (
                             <React.Fragment key={week.week}>
                                <WeekMilestone week={week} />

                                {weekIndex < roadmap.roadmap.weeks.length - 1 && (
                                    <>
                                    {/* Connector line from milestone to path */}
                                    <div className="w-px h-6 bg-border"></div>

                                    {/* Daily path */}
                                    <div className={cn("flex w-full items-end justify-center", weekIndex % 2 !== 0 && "flex-row-reverse")}>
                                        <div className="w-full h-1 bg-border relative flex items-end justify-evenly">
                                            {week.daily_tasks.slice(0, dotsToShow).map((task, dayIndex) => (
                                                <DailyCheckpoint key={dayIndex} task={task} roadmapId={roadmap.id!} preferredChannel={roadmap.preferredChannel} />
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Connector line from path to next milestone */}
                                     <div className="w-full flex">
                                        <div className={cn("w-px h-6 bg-border", weekIndex % 2 !== 0 ? "ml-auto" : "mr-auto")}></div>
                                    </div>
                                    </>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
