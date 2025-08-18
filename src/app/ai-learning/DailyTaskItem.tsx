
'use client';

import { useState } from 'react';
import type { DailyTaskItem as DailyTaskItemType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, TestTube2, Video, MessageSquare, Youtube, ChevronDown, WandSparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatLesson } from './ChatLesson';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';


interface DailyTaskItemProps {
    task: DailyTaskItemType;
    preferredChannel?: string;
}

const resourceTypes = [
    { value: 'Video', label: 'Video', icon: <Video className="h-4 w-4" /> },
    { value: 'Article', label: 'Article', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'Interactive Tutorial', label: 'Interactive Tutorial', icon: <TestTube2 className="h-4 w-4" /> },
    { value: 'Chat Lessons', label: 'Chat Lessons', icon: <MessageSquare className="h-4 w-4" /> },
];

export function DailyTaskItem({ task, preferredChannel }: DailyTaskItemProps) {
    const [isCompleted, setIsCompleted] = useState(task.completed || false);
    const [currentResourceType, setCurrentResourceType] = useState(task.resource_type);
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const handleToggle = () => setIsCompleted(!isCompleted);
    
    const isVideo = currentResourceType === 'Video' || currentResourceType === 'Video Tutorials';
    
    const getResourceLink = () => {
        if (isVideo) {
            const baseQuery = `${task.day}: ${task.topic}`;
            const query = preferredChannel ? `${baseQuery} ${preferredChannel}` : baseQuery;
            return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        }
        return task.resource_link || `https://www.google.com/search?q=${encodeURIComponent(task.topic + " " + currentResourceType)}`;
    }

    const resourceLink = getResourceLink();

    const selectedResource = resourceTypes.find(rt => rt.value === currentResourceType) || { value: 'Article', label: 'Article', icon: <BookOpen className="h-4 w-4" /> };

    const handleResourceButtonClick = () => {
        if (currentResourceType === 'Chat Lessons') {
            setIsChatOpen(true);
        } else {
            window.open(resourceLink, '_blank', 'noopener,noreferrer');
        }
    };


    return (
        <>
            <Card className={cn("p-4 transition-all", isCompleted && "bg-muted/60")}>
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                        <Checkbox checked={isCompleted} onCheckedChange={handleToggle} id={`task-${task.day}-${task.topic}`} />
                    </div>

                    <div className="flex-grow">
                        <label 
                            htmlFor={`task-${task.day}-${task.topic}`}
                            className={cn("font-semibold cursor-pointer", isCompleted && "line-through text-muted-foreground")}
                        >
                           {task.day}: {task.topic}
                        </label>
                         {task.challenge && (
                             <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Badge variant="outline" className="ml-2 mt-1 cursor-help">
                                        <WandSparkles className="h-3 w-3 mr-1" />
                                        Challenge
                                    </Badge>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                    <p className="text-sm font-semibold">Challenge:</p>
                                    <p className="text-sm text-muted-foreground italic">&quot;{task.challenge}&quot;</p>
                                </HoverCardContent>
                            </HoverCard>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0">
                         <DropdownMenu>
                            <div className="flex rounded-md border">
                                <Button onClick={handleResourceButtonClick} variant="ghost" className="rounded-r-none border-r">
                                    {selectedResource.icon}
                                    <span className="ml-2 hidden sm:inline">Start Learning</span>
                                </Button>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-l-none w-8">
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                            </div>
                            <DropdownMenuContent align="end">
                                {resourceTypes.map(rt => (
                                    <DropdownMenuItem key={rt.value} onClick={() => setCurrentResourceType(rt.value)}>
                                        <div className="flex items-center gap-3">
                                            {rt.icon}
                                            <span>{rt.label}</span>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </Card>

            {currentResourceType === 'Chat Lessons' && (
                <ChatLesson 
                    isOpen={isChatOpen} 
                    onOpenChange={setIsChatOpen} 
                    topic={task.topic} 
                />
            )}
        </>
    );
}
