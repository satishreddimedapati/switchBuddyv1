

'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription as AlertDialogDescriptionComponent,
    AlertDialogFooter,
    AlertDialogHeader as AlertDialogHeaderComponent,
    AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog"
import { generateChatLesson } from '@/ai/flows/generate-chat-lesson';
import { useToast } from '@/hooks/use-toast';
import { Bot, User, Loader2, Send, Wand2, X, ArrowLeft, Save, History, PlusCircle, Palette } from 'lucide-react';
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
import { getMessagesForSession, addMessageToSession, createChatSession, getChatSessionForTopic, getChatSessionsForUser } from '@/services/chat-history';
import { ChatHistory } from './ChatHistory';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ChatLessonProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topic?: string;
  onChatSaved: () => void;
}

type ChatTheme = 'light' | 'dark' | 'whatsapp' | 'telegram' | 'gemini' | 'chatgpt';

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

function Message({ message, theme }: { message: ChatMessage, theme: ChatTheme }) {
    const { user } = useAuth();
    const isUser = message.role === 'user';
    const userFallback = user?.email?.charAt(0).toUpperCase() || 'U';

    const themeClasses = {
        light: {
            user: 'bg-primary text-primary-foreground',
            model: 'bg-muted'
        },
        dark: {
            user: 'bg-primary text-primary-foreground',
            model: 'bg-muted'
        },
        whatsapp: {
            user: 'bg-[#dcf8c6] text-black',
            model: 'bg-white text-black'
        },
        telegram: {
            user: 'bg-[#e1ffc7] text-black',
            model: 'bg-white text-black'
        },
        gemini: {
            user: 'bg-blue-600 text-white',
            model: 'bg-gray-700 text-white'
        },
        chatgpt: {
            user: 'bg-gray-800 text-white',
            model: 'bg-gray-700 text-white'
        }
    }

    return (
        <div className={cn("flex items-start gap-3 w-full", isUser ? 'justify-end' : 'justify-start')}>
            {!isUser && (
                 <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot size={20}/></AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "rounded-2xl p-3 max-w-sm sm:max-w-md whitespace-pre-wrap font-body",
                isUser ? 'rounded-br-none' : 'rounded-bl-none',
                isUser ? themeClasses[theme].user : themeClasses[theme].model
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


export function ChatLesson({ isOpen, onOpenChange, topic, onChatSaved }: ChatLessonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [theme, setTheme] = useState<ChatTheme>('light');

  const activeTopic = currentSession?.topic || topic || "New Chat";
  
  const resetState = useCallback(() => {
    setCurrentSession(null);
    setHistory([]);
    setInput('');
  }, []);
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
       if (!currentSession && history.length > 1) {
            setShowSaveDialog(true);
        } else {
            onOpenChange(false);
        }
    } else {
        onOpenChange(true);
    }
  }

  const handleDiscard = () => {
    setShowSaveDialog(false);
    onOpenChange(false);
  }

  const handleSaveAndClose = () => {
    if (!user || !activeTopic || history.length === 0) return;
    
    startSavingTransition(async () => {
        try {
            await createChatSession(user.uid, activeTopic, history);
            toast({ title: "Success!", description: "Your chat has been saved." });
            onChatSaved();
            setShowSaveDialog(false);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save chat session", error);
            toast({ title: "Error", description: "Could not save your chat.", variant: "destructive" });
        }
    });
  }

  const generateResponse = useCallback(async (currentHistory: ChatMessage[], intent?: string) => {
      startGenerationTransition(async () => {
          try {
            const result = await generateChatLesson({ topic: activeTopic, history: currentHistory, intent });
            const modelMessage: ChatMessage = { role: 'model', content: result.response };
            
            if(currentSession?.id) {
                await addMessageToSession(currentSession.id, modelMessage);
            }

            setHistory(prev => [...prev, modelMessage]);
          } catch (error) {
            console.error('Failed to generate chat lesson', error);
            toast({
              title: 'Error',
              description: 'Could not get a response. Please try again.',
              variant: 'destructive',
            });
            setHistory(prev => prev.slice(0, -1));
          }
      });
  }, [activeTopic, toast, currentSession]);

  const startNewChat = useCallback((newTopic?: string) => {
    const chatTopic = newTopic || activeTopic;
    resetState();
    const initialUserMessage: ChatMessage = { role: 'user', content: `Can you explain "${chatTopic}" like I'm talking to a friend?` };
    setHistory([initialUserMessage]);
    generateResponse([initialUserMessage]);
    setView('chat');
  }, [resetState, generateResponse, activeTopic]);

  const loadSession = useCallback(async (session: ChatSession | null) => {
    if (!session) {
      if(topic) startNewChat(topic);
      return;
    }
    setCurrentSession(session);
    const messages = await getMessagesForSession(session.id!);
    setHistory(messages);
    setView('chat');
  }, [topic, startNewChat]);
  
  useEffect(() => {
    const loadInitialSession = async () => {
        if (!isOpen || !user) return;

        // Reset state for the new topic every time the dialog opens
        resetState();
        setIsLoading(true);
        setView('chat');

        if (!topic) {
            await handleShowHistory(true); // show history if no topic
            setIsLoading(false);
            return;
        }

        try {
            const existingSession = await getChatSessionForTopic(user.uid, topic);
            if (existingSession) {
                setCurrentSession(existingSession);
                const messages = await getMessagesForSession(existingSession.id!);
                setHistory(messages);
            } else {
                startNewChat(topic);
            }
        } catch (error) {
            console.error("Error loading initial session", error);
            toast({ title: "Error", description: "Could not load chat session.", variant: "destructive" });
            startNewChat(topic); // Fallback to new chat on error
        } finally {
            setIsLoading(false);
        }
    };
    
    loadInitialSession();

  }, [isOpen, topic, user, resetState, toast]);


   useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => viewport.scrollTop = viewport.scrollHeight, 100);
        }
    }
  }, [history, isGenerating]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    const newUserMessage: ChatMessage = { role: 'user', content: input };
    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);
    setInput('');
    if (currentSession?.id) addMessageToSession(currentSession.id, newUserMessage);
    generateResponse(newHistory);
  }

  const handleQuickFilter = (intent: string) => {
    if(isGenerating) return;
    const intentMessage: ChatMessage = { role: 'user', content: `(Instruction: ${intent})` };
    if(currentSession?.id) addMessageToSession(currentSession.id, intentMessage);
    const historyWithIntent = [...history, intentMessage];
    setHistory(historyWithIntent);
    generateResponse(historyWithIntent, intent);
  }
  
  const handleShowHistory = useCallback(async (force = false) => {
    if ((view === 'history' && !force) || !user) return;
    setIsLoading(true);
    setView('history');
    try {
        const sessions = await getChatSessionsForUser(user.uid);
        sessions.sort((a,b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
        setAllSessions(sessions);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        toast({ title: "Error", description: "Could not load chat history.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [user, view, toast]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-3xl h-full md:h-[90vh] flex flex-col p-0 gap-0"
        data-chat-theme={theme}
      >
        <DialogHeader className="p-4 border-b flex-row flex justify-between items-center bg-card rounded-t-lg">
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="md:hidden">
                    <ArrowLeft />
                </Button>
                <Avatar className="hidden sm:flex">
                    <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
                <div>
                    <DialogTitle className="font-semibold text-base">{activeTopic}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">Your AI Tutor</DialogDescription>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="outline" size="sm">
                            <Palette className="mr-2 h-4 w-4"/> Themes
                         </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('whatsapp')}>WhatsApp</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('telegram')}>Telegram</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => startNewChat()} disabled={view !== 'chat' || !topic}>
                   <PlusCircle className="mr-2 h-4 w-4"/> New Chat
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleShowHistory()} disabled={view === 'history'}>
                   <History className="mr-2 h-4 w-4"/> History
                </Button>
                 <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="hidden md:flex">
                    <X />
                </Button>
            </div>
        </DialogHeader>
        
        <div className={cn("flex-grow relative overflow-hidden",
            theme === 'light' && "bg-muted/30",
            theme === 'dark' && "bg-background",
            theme === 'whatsapp' && "bg-[#e5ddd5]",
            theme === 'telegram' && "bg-[#a5c5dd]",
        )}>
             <AnimatePresence>
                {view === 'chat' && (
                    <motion.div
                        key="chat"
                        initial={{ x: view === 'chat' ? 0 : '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="absolute inset-0"
                    >
                        <ScrollArea className="h-full" ref={scrollAreaRef}>
                            <div className="p-4 space-y-6">
                                {isLoading ? (
                                <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>
                                ) : (
                                <>
                                    {history.map((msg, index) => <Message key={index} message={msg} theme={theme} />)}
                                    {isGenerating && <LoadingState />}
                                </>
                                )}
                            </div>
                        </ScrollArea>
                    </motion.div>
                )}

                {view === 'history' && (
                     <motion.div
                        key="history"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="absolute inset-0 bg-background"
                    >
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <ChatHistory sessions={allSessions} onSessionSelect={(session) => loadSession(session)} onBack={() => setView('chat')} />
                        )}
                     </motion.div>
                )}
            </AnimatePresence>
        </div>
        
        <div className="p-4 border-t bg-card rounded-b-lg">
            <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                <Input 
                    placeholder="Ask a follow-up question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isGenerating || view === 'history'}
                    className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <QuickActionsPopover onQuickFilter={handleQuickFilter} disabled={isGenerating || view === 'history'} />
                <Button onClick={handleSend} disabled={isGenerating || !input.trim() || view === 'history'} className="rounded-full">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <Send />}
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </div>

      </DialogContent>
    </Dialog>

    <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
            <AlertDialogHeaderComponent>
                <AlertDialogTitleComponent>Save This Chat Session?</AlertDialogTitleComponent>
                <AlertDialogDescriptionComponent>
                    Would you like to save this conversation to your chat history? You can review and continue it later.
                </AlertDialogDescriptionComponent>
            </AlertDialogHeaderComponent>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={handleDiscard}>Discard</AlertDialogCancel>
                <Button onClick={handleSaveAndClose} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2"/>}
                    Save Chat
                </Button>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
