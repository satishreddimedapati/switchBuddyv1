
'use client';

import { useState } from 'react';
import type { DailyTaskItem as DailyTaskItemType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, TestTube2, Video, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyTaskItemProps {
    task: DailyTaskItemType;
}

const resourceIcons = {
    'Video': <Video className="h-4 w-4" />,
    'Article': <BookOpen className="h-4 w-4" />,
    'Interactive Tutorial': <TestTube2 className="h-4 w-4" />,
    'Chat Lessons': <MessageSquare className="h-4 w-4" />,
};

export function DailyTaskItem({ task }: DailyTaskItemProps) {
    const [isCompleted, setIsCompleted] = useState(task.completed || false);
    
    // In a real app, you'd likely persist this change.
    const handleToggle = () => setIsCompleted(!isCompleted);
    
    const ResourceIcon = resourceIcons[task.resource_type as keyof typeof resourceIcons] || <ExternalLink className="h-4 w-4" />;

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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {ResourceIcon}
                            <span>{task.resource_type}</span>
                        </div>
                        {task.resource_link && (
                             <Button variant="outline" size="sm" asChild>
                                <a href={task.resource_link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-2" />
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
