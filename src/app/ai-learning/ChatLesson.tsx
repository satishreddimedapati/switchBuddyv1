
'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { generateChatLesson, GenerateChatLessonOutput } from '@/ai/flows/generate-chat-lesson';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface ChatLessonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-3/4 self-end" />
      <div className="flex items-end gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function ChatLesson({ isOpen, onOpenChange, topic }: ChatLessonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<GenerateChatLessonOutput | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();

  useEffect(() => {
    if (isOpen && topic) {
      startGenerationTransition(async () => {
        setLesson(null);
        try {
          const result = await generateChatLesson({ topic });
          setLesson(result);
        } catch (error) {
          console.error('Failed to generate chat lesson', error);
          toast({
            title: 'Error',
            description: 'Could not generate the lesson. Please try again.',
            variant: 'destructive',
          });
          onOpenChange(false);
        }
      });
    }
  }, [isOpen, topic, toast, onOpenChange]);
  
  const userFallback = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat Lesson: {topic}</DialogTitle>
           <DialogDescription>
            Your AI tutor explains the topic in a conversational way.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
            {/* User's "message" */}
            <div className="flex justify-end">
                <div className="flex items-end gap-2 max-w-md">
                    <div className="rounded-lg bg-primary text-primary-foreground p-3">
                        <p>{`Can you explain "${topic}" like I'm talking to a friend?`}</p>
                    </div>
                    <Avatar>
                        <AvatarFallback>{userFallback}</AvatarFallback>
                    </Avatar>
                </div>
            </div>

            {/* AI's response */}
            {isGenerating || !lesson ? (
                <LoadingState />
            ) : (
                <div className="flex justify-start">
                    <div className="flex items-end gap-2 max-w-md">
                         <Avatar>
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg bg-muted p-3 whitespace-pre-wrap font-body">
                            <p>{lesson.lesson}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
