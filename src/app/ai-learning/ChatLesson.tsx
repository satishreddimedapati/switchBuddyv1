
'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateChatLesson } from '@/ai/flows/generate-chat-lesson';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Loader2, Send, Wand2, X, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import type { ChatMessage, ChatSession } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getMessagesForSession, addMessageToSession, createChatSession } from '@/services/chat-history';

interface ChatLessonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topic?: string;
  session?: ChatSession;
}

const explanationFilters = [
    { label: 'For Interview', value: 'Explain for interview' },
    { label: 'Real-World Example', value: 'Real-World Example' },
    { label: 'Fun Explanation', value: 'Fun way of explanation' },
    { label: 'New Analogy', value: 'Change Analogy'},
    { label: 'Pros & Cons', value: 'Pros & Cons' },
    { label: `ELI5`, value: `Explain Like I'm 5 (ELI5)` },
    { label: `History`, value: `Historical Context / The 'Why'` },
    { label: `Compare/Contrast`, value: `Compare & Contrast`},
];

const generationFilters = [
    { label: 'Interview Q&A', value: 'Interview Q&A' },
    { label: 'Code Snippet', value: 'Code Snippet' },
    { label: 'Mini-Project Idea', value: 'Suggest a Mini-Project' },
    { label: 'Job Relevance', value: 'Job Market Relevance' },
];

const toolFilters = [
    { label: 'Test My Knowledge', value: 'Test My Knowledge' },
    { label: 'Summarize', value: 'Summarize Key Points' },
]

function LoadingState() {
  return (
    <div className="flex items-start gap-3 px-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback><Bot size={20}/></AvatarFallback>
      </Avatar>
      <div className="space-y-2 pt-1">
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
        <div className={cn("flex items-start gap-3 w-full", isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
                 <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20}/></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "rounded-2xl p-3 max-w-sm sm:max-w-md whitespace-pre-wrap font-body",
                isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
            )}>
                <p>{message.content}</p>
            </div>
             {isUser && (
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{userFallback}</AvatarFallback>
                </Avatar>
             )}
        </div>
    )
}

function QuickActionsPopover({ onQuickFilter, disabled }: { onQuickFilter: (intent: string) => void, disabled: boolean }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={disabled} className="rounded-full">
                    <Wand2 />
                    <span className="sr-only">Quick Actions</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
                 <Tabs defaultValue="explain" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="explain">Explain</TabsTrigger>
                        <TabsTrigger value="generate">Generate</TabsTrigger>
                        <TabsTrigger value="tools">Tools</TabsTrigger>
                    </TabsList>
                    <TabsContent value="explain" className="pt-4">
                        <Label className="text-xs text-muted-foreground">Change how the AI explains the topic.</Label>
                        <div className="flex flex-wrap gap-1 pt-2">
                            {explanationFilters.map(filter => (
                                <Badge key={filter.value} variant="outline" className="cursor-pointer" onClick={() => onQuickFilter(filter.value)}>
                                    {filter.label}
                                </Badge>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="generate" className="pt-4">
                        <Label className="text-xs text-muted-foreground">Ask the AI to create something new.</Label>
                         <div className="flex flex-wrap gap-1 pt-2">
                            {generationFilters.map(filter => (
                                <Badge key={filter.value} variant="outline" className="cursor-pointer" onClick={() => onQuickFilter(filter.value)}>
                                    {filter.label}
                                </Badge>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="tools" className="pt-4 space-y-4">
                         <div>
                            <Label className="text-xs text-muted-foreground">Check your understanding.</Label>
                            <div className="flex flex-wrap gap-1 pt-2">
                                {toolFilters.map(filter => (
                                    <Badge key={filter.value} variant="outline" className="cursor-pointer" onClick={() => onQuickFilter(filter.value)}>
                                        {filter.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label>Translate To</Label>
                            <Select onValueChange={(value) => onQuickFilter(`Translate to ${value}`)}>
                                <SelectTrigger className="w-auto h-auto px-2 py-1 text-xs rounded-md border col-span-2">
                                <SelectValue placeholder="Language..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="English">English</SelectItem>
                                    <SelectItem value="Hindi">Hindi</SelectItem>
                                    <SelectItem value="Telugu">Telugu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    )
}

export function ChatLesson({ isOpen, onOpenChange, topic, session }: ChatLessonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, startGenerationTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const activeTopic = currentSession?.topic || topic || "New Chat";
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state when closing
      setCurrentSession(null);
      setHistory([]);
      setInput('');
    }
    onOpenChange(open);
  };
  
  const generateResponse = useCallback(async (sessionId: string, currentHistory: ChatMessage[], intent?: string) => {
      startGenerationTransition(async () => {
          try {
            const result = await generateChatLesson({ topic: activeTopic, history: currentHistory, intent });
            const modelMessage: ChatMessage = { role: 'model', content: result.response };
            await addMessageToSession(sessionId, modelMessage);
            setHistory(prev => [...prev, modelMessage]);
          } catch (error) {
            console.error('Failed to generate chat lesson', error);
            toast({
              title: 'Error',
              description: 'Could not get a response. Please try again.',
              variant: 'destructive',
            });
            // Remove the thinking indicator on error
            setHistory(prev => prev.slice(0, -1));
          }
      });
  }, [activeTopic, toast]);

  const loadOrCreateSession = useCallback(async () => {
      if (!user || !isOpen) return;

      setIsLoadingHistory(true);
      if (session?.id) { // Resuming an existing session
        setCurrentSession(session);
        const messages = await getMessagesForSession(session.id);
        setHistory(messages);
      } else if (topic) { // Starting a new session
          const newSessionId = await createChatSession(user.uid, topic);
          setCurrentSession({ id: newSessionId, userId: user.uid, topic, createdAt: new Date().toISOString(), lastMessageAt: new Date().toISOString(), lastMessageSnippet: '...' });
          
          const initialUserMessage: ChatMessage = { role: 'user', content: `Can you explain "${topic}" like I'm talking to a friend?` };
          await addMessageToSession(newSessionId, initialUserMessage);
          
          setHistory([initialUserMessage]);
          generateResponse(newSessionId, [initialUserMessage]);
      }
      setIsLoadingHistory(false);
  }, [user, isOpen, session, topic, generateResponse]);


  useEffect(() => {
    if (isOpen) {
        loadOrCreateSession();
    }
  }, [isOpen, loadOrCreateSession]);
  
   useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 100);
        }
    }
  }, [history, isGenerating]);

  const handleSend = () => {
    if (!input.trim() || !currentSession?.id) return;
    
    const newUserMessage: ChatMessage = { role: 'user', content: input };
    addMessageToSession(currentSession.id, newUserMessage);

    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);
    setInput('');
    generateResponse(currentSession.id, newHistory);
  }

  const handleQuickFilter = (intent: string) => {
    if(isGenerating || !currentSession?.id) return;

    const intentMessage: ChatMessage = { role: 'user', content: `(Instruction: ${intent})` };
    addMessageToSession(currentSession.id, intentMessage);
    
    const historyWithIntent = [...history, intentMessage];
    setHistory(historyWithIntent);
    
    generateResponse(currentSession.id, historyWithIntent, intent);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl h-full md:h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row flex justify-between items-center bg-card rounded-t-lg">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)} className="md:hidden">
                    <ArrowLeft />
                </Button>
                <div className="flex items-center gap-2">
                    <Avatar className="hidden sm:flex">
                        <AvatarFallback><Bot/></AvatarFallback>
                    </Avatar>
                    <div>
                        <DialogTitle className="font-semibold text-base">{activeTopic}</DialogTitle>
                        <p className="text-xs text-muted-foreground">Your AI Tutor</p>
                    </div>
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)} className="hidden md:flex">
                <X />
            </Button>
        </DialogHeader>
        
        <ScrollArea className="flex-grow bg-muted/30" ref={scrollAreaRef}>
             <div className="p-4 space-y-6">
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <>
                    {history.map((msg, index) => <Message key={index} message={msg} />)}
                    {isGenerating && <LoadingState />}
                  </>
                )}
            </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-card rounded-b-lg">
            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                <Input 
                    placeholder="Ask a follow-up question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isGenerating}
                    className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <QuickActionsPopover onQuickFilter={handleQuickFilter} disabled={isGenerating} />
                <Button onClick={handleSend} disabled={isGenerating || !input.trim()} className="rounded-full">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Send />}
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
