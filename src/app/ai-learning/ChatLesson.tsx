
'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { generateChatLesson, GenerateChatLessonOutput } from '@/ai/flows/generate-chat-lesson';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Loader2, Send, Wand2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import type { ChatMessage } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ChatLessonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
}

const quickFilters = [
    { label: 'Explain for Interview', value: 'Explain for an interview' },
    { label: 'Interview Q&A', value: 'Provide interview Q&A' },
    { label: 'Easy Shortcuts', value: 'Provide easy-to-remember shortcuts' },
    { label: 'Fun Explanation', value: 'Explain in a fun way' },
];

function LoadingState() {
  return (
    <div className="flex items-end gap-2">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
    const { user } = useAuth();
    const isUser = message.role === 'user';
    const userFallback = user?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <div className={cn("flex items-end gap-2", isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
                 <Avatar>
                    <AvatarFallback><Bot /></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "rounded-lg p-3 max-w-sm sm:max-w-md whitespace-pre-wrap font-body",
                isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
                <p>{message.content}</p>
            </div>
             {isUser && (
                <Avatar>
                    <AvatarFallback>{userFallback}</AvatarFallback>
                </Avatar>
             )}
        </div>
    )
}

export function ChatLesson({ isOpen, onOpenChange, topic }: ChatLessonProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, startGenerationTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const initialPrompt = `Can you explain "${topic}" like I'm talking to a friend?`;

  const generateResponse = (currentHistory: ChatMessage[], intent?: string) => {
      startGenerationTransition(async () => {
          try {
            const result = await generateChatLesson({ topic, history: currentHistory, intent });
            setHistory(prev => [...prev, { role: 'model', content: result.response }]);
          } catch (error) {
            console.error('Failed to generate chat lesson', error);
            toast({
              title: 'Error',
              description: 'Could not get a response. Please try again.',
              variant: 'destructive',
            });
            setHistory(prev => prev.filter(m => m.role !== 'thinking'));
          }
      });
  }

  useEffect(() => {
    if (isOpen && topic) {
        const initialUserMessage: ChatMessage = { role: 'user', content: initialPrompt };
        const initialThinkingMessage: ChatMessage = { role: 'thinking', content: '...' };
        
        setHistory([initialUserMessage, initialThinkingMessage]);
        generateResponse([initialUserMessage]);
    } else {
        setHistory([]);
    }
  }, [isOpen, topic]);
  
   useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 100);
        }
    }
  }, [history]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newUserMessage: ChatMessage = { role: 'user', content: input };
    const thinkingMessage: ChatMessage = { role: 'thinking', content: '...' };
    const newHistory = [...history, newUserMessage];
    setHistory([...newHistory, thinkingMessage]);
    setInput('');
    generateResponse(newHistory);
  }

  const handleQuickFilter = (intent: string) => {
    const lastMessage = history[history.length - 1];
    // Don't do anything if we are already generating
    if(isGenerating || !lastMessage) return;

    // Create a new "user" message with the intent for the prompt, but don't show it in history
    const intentMessage: ChatMessage = { role: 'user', content: `(Instruction: ${intent})` };
    const thinkingMessage: ChatMessage = { role: 'thinking', content: '...' };
    
    const historyWithIntent = [...history, intentMessage];
    setHistory(prev => [...prev, thinkingMessage]);
    
    // We pass the new history with the hidden intent to the AI
    generateResponse(historyWithIntent, intent);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat Lesson: {topic}</DialogTitle>
           <DialogDescription>
            Your AI tutor explains the topic in a conversational way. Ask it anything!
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow h-full" ref={scrollAreaRef}>
             <div className="p-4 space-y-6">
                {history.map((msg, index) => (
                    msg.role === 'thinking' 
                        ? <LoadingState key={index} />
                        : <Message key={index} message={msg} />
                ))}
            </div>
        </ScrollArea>
        
        <div className="p-4 border-t space-y-4">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                     <Wand2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Quick Actions</span>
                </div>
                 <div className="flex flex-wrap gap-2">
                    {quickFilters.map(filter => (
                        <Badge key={filter.value} variant="outline" className="cursor-pointer" onClick={() => handleQuickFilter(filter.value)}>
                            {filter.label}
                        </Badge>
                    ))}
                     <Select onValueChange={(value) => handleQuickFilter(`Translate to ${value}`)}>
                        <SelectTrigger className="w-auto h-auto px-2 py-0.5 text-xs rounded-full border">
                           <SelectValue placeholder="Translate..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Telugu">Telugu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Input 
                    placeholder="Ask a follow-up question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isGenerating}
                />
                <Button onClick={handleSend} disabled={isGenerating || !input.trim()}>
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Send />}
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
