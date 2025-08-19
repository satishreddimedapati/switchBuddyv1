

'use client';

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle as CardTitleComponent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, AlertTriangle, Lightbulb, Copy, X, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { generateInteractiveLesson } from '@/ai/flows/generate-interactive-lesson';
import type { InteractiveLesson as InteractiveLessonType } from '@/lib/types';
import { TutorialCard } from './TutorialCard';
import { Progress } from '@/components/ui/progress';
import { getInteractiveLessonsForTopic, addInteractiveLesson } from '@/services/learning-roadmaps';
import { useAuth } from '@/lib/auth';

interface InteractiveTutorialProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  roadmapId: string;
}

const MAX_LESSONS = 3;

function IntroductionScreen({ onStart, isLoading, topic }: { onStart: () => void; isLoading: boolean; topic: string }) {
  return (
    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
      <div className="bg-primary/20 p-4 rounded-full mb-4">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-center">{topic}</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto text-center">
        Learn step-by-step with a mix of visuals, examples, and questions. Each card is a new mini-experience!
      </p>
      <Button
        size="lg"
        className="mt-8"
        onClick={onStart}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Start Learning'}
      </Button>
    </div>
  );
}

export function InteractiveTutorial({ isOpen, onOpenChange, topic, roadmapId }: InteractiveTutorialProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<InteractiveLessonType[]>([]);
  const [currentLesson, setCurrentLesson] = useState<InteractiveLessonType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerationTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const fetchLessons = useCallback(async () => {
    if (!user || !isOpen) return;
    setIsLoading(true);
    setError(null);
    try {
      const existingLessons = await getInteractiveLessonsForTopic(roadmapId, topic);
      setLessons(existingLessons);
      if (existingLessons.length > 0) {
        setCurrentLesson(existingLessons[0]);
      } else {
        setCurrentLesson(null);
      }
    } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
       setError(`Failed to load existing lessons: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, isOpen, roadmapId, topic]);

  useEffect(() => {
    if (isOpen) {
      fetchLessons();
    }
  }, [isOpen, fetchLessons]);

  const handleStart = () => {
      setIsStarted(true);
      if (lessons.length > 0 && currentLesson) {
        setCurrentIndex(0);
        return;
      };

      handleGenerateNew();
  };

  const handleGenerateNew = () => {
      if (!user) return;
      startGenerationTransition(async () => {
        setError(null);
        try {
          const result = await generateInteractiveLesson({ topic, experienceLevel: 'Beginner' });
          if (!result || !result.title || !result.cards || result.cards.length < 5) {
               throw new Error("The AI returned an incomplete or invalid lesson structure. Please try again.");
          }
          await addInteractiveLesson(roadmapId, topic, result);
          
          // Refetch after adding
          await fetchLessons();

          toast({ title: "New lesson generated!", description: "A fresh perspective on the topic is ready." });
          // The fetchLessons will set the new current lesson.
          // Let's make sure we find and set it as active immediately.
          const newLessonInState = lessons.find(l => l.title === result.title);
          if(newLessonInState) {
              setCurrentLesson(newLessonInState);
          } else {
              // As a fallback, use the result directly
              setCurrentLesson(result);
          }

          setCurrentIndex(0);
          setIsStarted(true);

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(errorMessage);
          toast({ title: "Error", description: `Could not generate lesson: ${errorMessage}`, variant: 'destructive' });
        }
      });
  }

  const handlePrevCard = () => {
    if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNextCard = () => {
    if (!currentLesson) return;
    if (currentIndex < currentLesson.cards.length - 1) {
      setCurrentIndex(prev => prev - 1);
    } else {
        onOpenChange(false);
        toast({ title: "Lesson Complete!", description: "Great job finishing the interactive tutorial."});
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setLessons([]);
        setCurrentLesson(null);
        setError(null);
        setIsStarted(false);
        setCurrentIndex(0);
        setIsLoading(true);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
         if (!isOpen || !isStarted || !currentLesson || isGenerating || error) return;
         if (e.key === 'ArrowRight' || e.key === 'Enter') {
            handleNextCard();
        } else if (e.key === 'ArrowLeft') {
            handlePrevCard();
        }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => {
        window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, isStarted, currentLesson, isGenerating, error, currentIndex, handleNextCard, handlePrevCard]);


  const handleCopyError = () => {
      if (error) {
          navigator.clipboard.writeText(error);
          toast({ title: "Copied!", description: "Error message copied to clipboard." });
      }
  }

  const progress = useMemo(() => {
      if (!currentLesson) return 0;
      return ((currentIndex + 1) / currentLesson.cards.length) * 100;
  }, [currentIndex, currentLesson]);

  const canGenerateMore = lessons.length < MAX_LESSONS;

  const renderContent = () => {
    if (isLoading && !isStarted) {
        return <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
            <p className="text-muted-foreground">Loading lesson...</p>
        </div>
    }

    if (!isStarted) {
        return <IntroductionScreen onStart={handleStart} isLoading={isGenerating || isLoading} topic={topic} />;
    }

    if (isGenerating) {
        return <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
            <p className="text-muted-foreground">Building a fresh lesson for you...</p>
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
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{error}</p>
                        <div className='flex gap-2 justify-center'>
                             <Button variant="destructive" onClick={handleGenerateNew} disabled={!canGenerateMore}>
                                {canGenerateMore ? "Try Again" : "Limit Reached"}
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

    if (!currentLesson) {
        // This case handles when there are no lessons and the user has started.
        // It's a loading state before the first lesson is generated.
        return <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="animate-spin h-12 w-12 text-primary" />
            <p className="text-muted-foreground">Preparing your first lesson...</p>
        </div>
    }

    if (!currentLesson.cards[currentIndex]) {
        // This is a safeguard for an unlikely edge case
        return (
            <div className="p-4 text-center">
                <p className="text-destructive">Error: Could not display the current card.</p>
            </div>
        )
    }


    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{currentLesson.title}</h3>
                  <Progress value={progress} className="mt-2" />
                </div>
                 {isStarted && (
                    <Button variant="outline" size="sm" onClick={handleGenerateNew} disabled={isGenerating || !canGenerateMore}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {isGenerating ? 'Generating...' : canGenerateMore ? `New (${lessons.length}/${MAX_LESSONS})` : `Limit Reached`}
                    </Button>
                )}
            </div>
            <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                <TutorialCard
                    key={`${currentLesson.id}-${currentIndex}`}
                    card={currentLesson.cards[currentIndex]}
                    onNext={handleNextCard}
                    onPrev={handlePrevCard}
                    isFirst={currentIndex === 0}
                    isLast={currentIndex === currentLesson.cards.length - 1}
                />
            </div>
            <div className="p-4 border-t flex justify-between items-center text-xs text-muted-foreground">
                <p>Card {currentIndex + 1} of {currentLesson.cards.length}</p>
                <div className="flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    <span>Tip: Use ← / → to navigate</span>
                </div>
            </div>
        </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0">
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
