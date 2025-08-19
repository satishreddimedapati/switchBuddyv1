

'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { generateChatLesson } from '@/ai/flows/generate-chat-lesson';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Loader2, Send, Wand2, X, ArrowLeft, Save } from 'lucide-react';
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
  onChatSaved: () => void;
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

export function ChatLesson({ isOpen, onOpenChange, topic, session, onChatSaved }: ChatLessonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const activeTopic = currentSession?.topic || topic || "New Chat";

  const handleClose = () => {
    // Only show save dialog if it's a new session that has messages
    if (!session && history.length > 1) {
        setShowSaveDialog(true);
    } else {
        onOpenChange(false);
    }
  }
  
  const resetState = useCallback(() => {
    setCurrentSession(null);
    setHistory([]);
    setInput('');
  }, []);

  const handleDiscard = () => {
    setShowSaveDialog(false);
    onOpenChange(false);
    resetState();
  }

  const handleSave = () => {
    if (!user || !activeTopic) return;
    
    startSavingTransition(async () => {
        try {
            await createChatSession(user.uid, activeTopic, history);
            toast({ title: "Success!", description: "Your chat has been saved." });
            onChatSaved();
            setShowSaveDialog(false);
            onOpenChange(false);
            resetState();
        } catch (error) {
            console.error("Failed to save chat session", error);
            toast({ title: "Error", description: "Could not save your chat.", variant: "destructive" });
        }
    });
  }

  const generateResponse = useCallback(async (currentHistory: ChatMessage[], currentSessionId?: string, intent?: string) => {
      startGenerationTransition(async () => {
          try {
            const result = await generateChatLesson({ topic: activeTopic, history: currentHistory, intent });
            const modelMessage: ChatMessage = { role: 'model', content: result.response };
            if(currentSessionId) {
                await addMessageToSession(currentSessionId, modelMessage);
            }
            setHistory(prev => [...prev, modelMessage]);
          } catch (error) {
            console.error('Failed to generate chat lesson', error);
            toast({
              title: 'Error',
              description: 'Could not get a response. Please try again.',
              variant: 'destructive',
            });
          }
      });
  }, [activeTopic, toast]);

  const loadOrCreateSession = useCallback(async () => {
      if (!user || !isOpen) return;

      setIsLoadingHistory(true);
      resetState();

      if (session?.id) { // Resuming an existing session
        setCurrentSession(session);
        const messages = await getMessagesForSession(session.id);
        setHistory(messages);
      } else if (topic) { // Starting a new session
          const initialUserMessage: ChatMessage = { role: 'user', content: `Can you explain "${topic}" like I'm talking to a friend?` };
          setHistory([initialUserMessage]);
          generateResponse([initialUserMessage], undefined); // Pass undefined session ID for new chats
      }
      setIsLoadingHistory(false);
  }, [user, isOpen, session, topic, generateResponse, resetState]);


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
    if (!input.trim()) return;
    
    const newUserMessage: ChatMessage = { role: 'user', content: input };
    if(currentSession?.id) {
        addMessageToSession(currentSession.id, newUserMessage);
    }
    
    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);
    setInput('');
    generateResponse(newHistory, currentSession?.id);
  }

  const handleQuickFilter = (intent: string) => {
    if(isGenerating) return;

    const intentMessage: ChatMessage = { role: 'user', content: `(Instruction: ${intent})` };
     if(currentSession?.id) {
        addMessageToSession(currentSession.id, intentMessage);
    }
    
    const historyWithIntent = [...history, intentMessage];
    setHistory(historyWithIntent);
    
    generateResponse(historyWithIntent, currentSession?.id, intent);
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) handleClose()}}>
      <DialogContent className="max-w-3xl h-full md:h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row flex justify-between items-center bg-card rounded-t-lg">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleClose} className="md:hidden">
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
            <Button variant="ghost" size="icon" onClick={handleClose} className="hidden md:flex">
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

    <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Save This Chat Session?</AlertDialogTitle>
                <AlertDialogDescription>
                    Would you like to save this conversation to your chat history? You can review and continue it later.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={handleDiscard}>Discard</AlertDialogCancel>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2"/>}
                    Save Chat
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

    