
'use client';

import { useState } from 'react';
import type { DailyTaskItem as DailyTaskItemType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, TestTube2, Video, MessageSquare, Youtube } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DailyTaskItemProps {
    task: DailyTaskItemType;
    preferredChannel?: string;
}

const resourceTypes = [
    { value: 'Video', label: 'Video', icon: <Video className="h-4 w-4" />, disabled: false },
    { value: 'Article', label: 'Article', icon: <BookOpen className="h-4 w-4" />, disabled: false },
    { value: 'Interactive Tutorial', label: 'Interactive Tutorial', icon: <TestTube2 className="h-4 w-4" />, disabled: true },
    { value: 'Chat Lessons', label: 'Chat Lessons', icon: <MessageSquare className="h-4 w-4" />, disabled: true },
    { value: 'Video Tutorials', label: 'Video Tutorials', icon: <Video className="h-4 w-4" />, disabled: false },
];

export function DailyTaskItem({ task, preferredChannel }: DailyTaskItemProps) {
    const [isCompleted, setIsCompleted] = useState(task.completed || false);
    const [currentResourceType, setCurrentResourceType] = useState(task.resource_type);
    
    const handleToggle = () => setIsCompleted(!isCompleted);
    
    const isVideo = currentResourceType === 'Video' || currentResourceType === 'Video Tutorials';
    
    const getResourceLink = () => {
        if (isVideo) {
            const baseQuery = `${task.day}: ${task.topic}`;
            const query = preferredChannel ? `${baseQuery} ${preferredChannel}` : baseQuery;
            return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        }
        // For other types, we might want different logic in the future.
        // For now, we fall back to the original link or a generic search.
        return task.resource_link || `https://www.google.com/search?q=${encodeURIComponent(task.topic + " " + currentResourceType)}`;
    }

    const resourceLink = getResourceLink();

    const selectedResource = resourceTypes.find(rt => rt.value === currentResourceType) || { value: 'Article', label: 'Article', icon: <BookOpen className="h-4 w-4" /> };

    return (
        <Card className={cn(
            "p-4 transition-all",
            isCompleted && "bg-muted/60"
        )}>
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="pt-1">
                    <Checkbox checked={isCompleted} onCheckedChange={handleToggle} id={`task-${task.day}-${task.topic}`} />
                </div>
                <div className="flex-grow">
                    <label 
                        htmlFor={`task-${task.day}-${task.topic}`}
                        className={cn(
                            "font-semibold cursor-pointer",
                            isCompleted && "line-through text-muted-foreground"
                        )}
                    >
                       {task.day}: {task.topic}
                    </label>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <Select value={currentResourceType} onValueChange={setCurrentResourceType}>
                            <SelectTrigger className="w-full sm:w-[200px] h-9">
                                <div className="flex items-center gap-2">
                                     {selectedResource.icon}
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                {resourceTypes.map(rt => (
                                     <SelectItem key={rt.value} value={rt.value} disabled={rt.disabled}>
                                         <div className="flex items-center gap-3">
                                            {rt.icon}
                                            <span>{rt.label}</span>
                                         </div>
                                     </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {resourceLink && (
                             <Button variant="outline" size="sm" asChild>
                                <a href={resourceLink} target="_blank" rel="noopener noreferrer">
                                     {isVideo ? (
                                        <Youtube className="h-3 w-3 mr-2 text-red-600" />
                                     ) : (
                                        <ExternalLink className="h-3 w-3 mr-2" />
                                     )}
                                    Open Resource
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
             {task.challenge && (
                <div className="mt-3 ml-10 p-3 bg-background rounded-md border">
                    <p className="text-sm font-semibold">Challenge:</p>
                    <p className="text-sm text-muted-foreground italic">&quot;{task.challenge}&quot;</p>
                </div>
            )}
        </Card>
    );
}
