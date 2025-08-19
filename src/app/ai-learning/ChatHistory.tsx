
'use client';

import type { ChatSession } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ChatHistoryProps {
    sessions: ChatSession[];
    onSessionSelect: (session: ChatSession) => void;
    onBack: () => void;
}

export function ChatHistory({ sessions, onSessionSelect, onBack }: ChatHistoryProps) {
    
    if (sessions.length === 0) {
        return (
            <div className="text-center p-8 flex flex-col items-center gap-4 h-full justify-center">
                <CardTitle>No Chat Lessons Yet</CardTitle>
                <CardDescription>Start a lesson from a roadmap, and it will appear here.</CardDescription>
                <Button onClick={onBack} variant="outline">Back to Chat</Button>
            </div>
        )
    }

    return (
        <div className='h-full flex flex-col'>
            <div className="p-4 border-b">
                 <h3 className="font-semibold">Chat History</h3>
                 <p className="text-sm text-muted-foreground">Review your past conversations.</p>
            </div>
            <ScrollArea className="flex-grow">
                <div className="space-y-2 p-4">
                    {sessions.map(session => (
                        <Card 
                            key={session.id} 
                            className="p-3 cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => onSessionSelect(session)}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold flex items-center gap-2 text-sm">
                                        <MessageSquare className="h-4 w-4 text-primary" /> {session.topic}
                                    </h4>
                                    <p className="text-xs text-muted-foreground italic mt-1">&quot;{session.lastMessageSnippet}&quot;</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
