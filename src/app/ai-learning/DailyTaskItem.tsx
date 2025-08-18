
'use client';

import { useState } from 'react';
import type { DailyTaskItem as DailyTaskItemType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, TestTube2, Video, MessageSquare, Youtube, ChevronDown, WandSparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatLesson } from './ChatLesson';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';


interface DailyTaskItemProps {
    task: DailyTaskItemType;
    preferredChannel?: string;
}

const resourceTypes = [
    { value: 'Video', label: 'Video', icon: <Video className="h-4 w-4" />, description: "Watch guided lessons from platforms like YouTube." },
    { value: 'Article', label: 'Article', icon: <BookOpen className="h-4 w-4" />, description: "Learn from official docs and blog posts." },
    { value: 'Interactive Tutorial', label: 'Interactive Tutorial', icon: <TestTube2 className="h-4 w-4" />, description: "Short videos paired with mini coding challenges." },
    { value: 'Chat Lessons', label: 'Chat Lessons', icon: <MessageSquare className="h-4 w-4" />, description: "Bite-sized, conversational lessons from an AI tutor." },
];

function ResourceTypeSelector({ onSelect, currentType, onClose }: { onSelect: (type: string) => void, currentType: string, onClose: () => void }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resourceTypes.map(rt => (
                <Card 
                    key={rt.value}
                    onClick={() => { onSelect(rt.value); onClose(); }}
                    className={cn(
                        "p-4 cursor-pointer transition-all hover:bg-muted/80",
                        currentType === rt.value && "ring-2 ring-primary bg-primary/10"
                    )}
                >
                    <div className="flex items-center gap-4">
                        <div className="text-primary">{rt.icon}</div>
                        <div>
                            <h3 className="font-semibold">{rt.label}</h3>
                            <p className="text-xs text-muted-foreground">{rt.description}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

export function DailyTaskItem({ task, preferredChannel }: DailyTaskItemProps) {
    const [isCompleted, setIsCompleted] = useState(task.completed || false);
    const [currentResourceType, setCurrentResourceType] = useState(task.resource_type);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isResourceSelectorOpen, setIsResourceSelectorOpen] = useState(false);
    
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

    const selectedResource = resourceTypes.find(rt => rt.value === currentResourceType) || resourceTypes[1];

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
                    
                    <div className="flex-shrink-0 flex items-center gap-2">
                         <Button onClick={handleResourceButtonClick} variant="outline" size="sm">
                            {selectedResource.icon}
                            <span className="ml-2 hidden sm:inline">{selectedResource.label}</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsResourceSelectorOpen(true)}>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog open={isResourceSelectorOpen} onOpenChange={setIsResourceSelectorOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Choose Your Learning Style</DialogTitle>
                        <DialogDescription>Select how you want to learn this topic.</DialogDescription>
                    </DialogHeader>
                    <ResourceTypeSelector 
                        onSelect={setCurrentResourceType} 
                        currentType={currentResourceType} 
                        onClose={() => setIsResourceSelectorOpen(false)}
                    />
                </DialogContent>
            </Dialog>

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
