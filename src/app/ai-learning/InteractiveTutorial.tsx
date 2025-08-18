
'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle as CardTitleComponent, CardDescription as CardDescriptionComponent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, AlertTriangle, Lightbulb, Copy, X } from 'lucide-react';
import { generateInteractiveLesson } from '@/ai/flows/generate-interactive-lesson';
import type { InteractiveLesson as InteractiveLessonType, LessonCard } from '@/lib/types';
import { TutorialCard } from './TutorialCard';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface InteractiveTutorialProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
}

function IntroductionScreen({ onStart, isLoading }: { onStart: () => void; isLoading: boolean }) {
  return (
    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
      <div className="bg-primary/20 p-4 rounded-full mb-4">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Interactive Card-Based Learning</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Learn new concepts step-by-step with a mix of visuals, code, and quick challenges. Each card is a new mini-experience!
      </p>
      <Button
        size="lg"
        className="mt-8"
        onClick={onStart}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Start Tutorial'}
      </Button>
    </div>
  );
}

export function InteractiveTutorial({ isOpen, onOpenChange, topic }: InteractiveTutorialProps) {
  const { toast } = useToast();
  const [lesson, setLesson] = useState<InteractiveLessonType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleStart = () => {
    setIsStarted(true);
    startGenerationTransition(async () => {
      try {
        const result = await generateInteractiveLesson({ topic, experienceLevel: 'Beginner' });
        if (!result || !result.title || !result.cards) {
             throw new Error("The AI returned an incomplete or invalid lesson structure. Please try again.");
        }
        setLesson(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({ title: "Error", description: `Could not generate lesson: ${errorMessage}`, variant: 'destructive' });
      }
    });
  }

  useEffect(() => {
    // Reset state when the dialog is closed
    if (!isOpen) {
      setTimeout(() => {
        setLesson(null);
        setError(null);
        setIsStarted(false);
        setCurrentIndex(0);
      }, 300); // Delay to allow for exit animation
    }
  }, [isOpen]);


  const handleCopyError = () => {
      if (error) {
          navigator.clipboard.writeText(error);
          toast({ title: "Copied!", description: "Error message copied to clipboard." });
      }
  }
  
  const handleTryAgain = () => {
      setError(null);
      setLesson(null);
      handleStart();
  }

  const progress = useMemo(() => {
      if (!lesson) return 0;
      return ((currentIndex + 1) / lesson.cards.length) * 100;
  }, [currentIndex, lesson]);

  const renderContent = () => {
    if (!isStarted) {
        return <IntroductionScreen onStart={handleStart} isLoading={isGenerating} />;
    }

    if (isGenerating) {
        return <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
            <p className="text-muted-foreground">Building your personalized lesson...</p>
        </div>
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                 <Card className="w-full max-w-md m-4 p-4 text-center border-destructive bg-destructive/5">
                    <CardHeader className="p-2">
                        <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
                        <CardTitleComponent className="font-semibold">Lesson Generation Failed</CardTitleComponent>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ScrollArea className="max-h-32 w-full rounded-md border bg-background p-2 text-left">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{error}</p>
                        </ScrollArea>
                        <div className='flex gap-2 justify-center'>
                             <Button variant="destructive" onClick={handleTryAgain}>
                                Try Again
                            </Button>
                            <Button variant="outline" onClick={handleCopyError}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy Error
                            </Button>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        );
    }

    if (!lesson) {
        // This state should ideally not be reached if !isGenerating and !error, but as a fallback:
        return <div className="flex items-center justify-center h-full"><p>Something went wrong. Please try again.</p></div>;
    }

    const handleNextCard = () => {
        if (currentIndex < lesson.cards.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
            onOpenChange(false);
            toast({ title: "Lesson Complete!", description: "Great job finishing the interactive tutorial."});
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold">{lesson.title}</h3>
                <Progress value={progress} className="mt-2" />
            </div>
            <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                {lesson.cards.map((card, index) => {
                    if (index < currentIndex) return null;
                    return (
                         <TutorialCard
                            key={`${card.title}-${index}`}
                            card={card}
                            index={index}
                            currentIndex={currentIndex}
                            onComplete={handleNextCard}
                        />
                    )
                })}
            </div>
            <div className="p-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                <p>Card {currentIndex + 1} of {lesson.cards.length}</p>
                <div className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    <span>Tip: Use arrow keys to navigate</span>
                </div>
            </div>
        </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-row flex justify-between items-center">
            <div>
              <DialogTitle>Interactive Tutorial: {topic}</DialogTitle>
              <DialogDescription>An interactive, card-based lesson.</DialogDescription>
            </div>
            <DialogClose asChild>
                <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                </Button>
            </DialogClose>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

    