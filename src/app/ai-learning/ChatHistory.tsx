

'use client';

import { useState } from 'react';
import type { ChatSession } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChatLesson } from './ChatLesson';

interface ChatHistoryProps {
    sessions: ChatSession[];
    onSessionSelect: () => void;
}

export function ChatHistory({ sessions, onSessionSelect }: ChatHistoryProps) {
    const [selectedSession, setSelectedSession] = useState<ChatSession | undefined>(undefined);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleSessionClick = (session: ChatSession) => {
        setSelectedSession(session);
        setIsChatOpen(true);
    };
    
    if (sessions.length === 0) {
        return (
            <Card className="text-center p-8 flex flex-col items-center gap-4 border-dashed">
                <CardTitle>No Chat Lessons Yet</CardTitle>
                <CardDescription>Start a lesson from a roadmap, and it will appear here.</CardDescription>
            </Card>
        )
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Chat Lesson History</CardTitle>
                    <CardDescription>Review and continue your past conversations with the AI Tutor.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        <div className="space-y-2 pr-4">
                            {sessions.map(session => (
                                <Card 
                                    key={session.id} 
                                    className="p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => handleSessionClick(session)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2">
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
                </CardContent>
            </Card>
            <ChatLesson 
                isOpen={isChatOpen}
                onOpenChange={setIsChatOpen}
                session={selectedSession}
                onChatSaved={onSessionSelect}
            />
        </>
    );
}

    