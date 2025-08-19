
'use client';

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

type Screen = 'loading' | 'intro' | 'lesson' | 'error';

const MAX_LESSONS = 3;

function IntroductionScreen({ onStart, onGenerateNew, hasExistingLessons, isLoading, topic }: { onStart: () => void; onGenerateNew: () => void, hasExistingLessons: boolean, isLoading: boolean; topic: string }) {
  return (
    <div className="text-center p-4 flex flex-col items-center justify-center h-full">
      <div className="bg-primary/20 p-4 rounded-full mb-4">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-center">{topic}</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto text-center">
        Learn step-by-step with a mix of visuals, examples, and questions. Each card is a new mini-experience!
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Button
          size="lg"
          onClick={onStart}
          disabled={isLoading || !hasExistingLessons}
        >
          {isLoading ? <Loader2 className="mr-2 animate-spin" /> : 'Start Learning'}
        </Button>
         <Button
          size="lg"
          variant="outline"
          onClick={onGenerateNew}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <RefreshCw className="mr-2"/>}
           New Lesson
        </Button>
      </div>
       {!hasExistingLessons && <p className="text-xs text-muted-foreground mt-4">No lessons found. Click "New Lesson" to generate your first one!</p>}
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>('loading');
  
  const resetState = useCallback(() => {
    setLessons([]);
    setCurrentLesson(null);
    setError(null);
    setCurrentIndex(0);
    setScreen('loading');
  }, []);

  const fetchLessons = useCallback(async () => {
    if (!user) return;
    setScreen('loading');
    try {
        const existingLessons = await getInteractiveLessonsForTopic(roadmapId, topic);
        setLessons(existingLessons);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to load existing lessons: ${errorMessage}`);
        setScreen('error');
    } finally {
        setScreen('intro');
    }
  }, [user, roadmapId, topic]);
  
  useEffect(() => {
    if (isOpen) {
        fetchLessons();
    } else {
        // Use setTimeout to avoid flickering when closing
        setTimeout(resetState, 300);
    }
  }, [isOpen, fetchLessons, resetState]);


  const handleStart = () => {
      if (lessons.length > 0 && lessons[0]) {
          setCurrentLesson(lessons[0]);
          setCurrentIndex(0);
          setScreen('lesson');
      } else {
          handleGenerateNew();
      }
  };

  const handleGenerateNew = () => {
      if (!user) return;
      if (lessons.length >= MAX_LESSONS) {
          toast({ title: "Lesson Limit Reached", description: `You can only have ${MAX_LESSONS} generated lessons per topic.`});
          return;
      }
      
      startGenerationTransition(async () => {
        setScreen('loading');
        setError(null);
        try {
          const result = await generateInteractiveLesson({ topic, experienceLevel: 'Beginner' });
          if (!result || !result.title || !result.cards || result.cards.length < 5) {
               throw new Error("The AI returned an incomplete or invalid lesson structure. Please try again.");
          }
          await addInteractiveLesson(roadmapId, topic, result);
          
          toast({ title: "New Lesson Generated!", description: `The lesson for "${topic}" is ready. You can start it from the menu.` });
          await fetchLessons(); // Refetch lessons to include the new one and go to intro screen

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(errorMessage);
          setScreen('error');
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
    const handleKeyPress = (e: KeyboardEvent) => {
         if (screen !== 'lesson' || !currentLesson || isGenerating) return;
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
  }, [screen, currentLesson, isGenerating, currentIndex]);


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
    switch (screen) {
        case 'loading':
            return <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="animate-spin h-12 w-12 text-primary" />
                <p className="text-muted-foreground">Building your learning experience...</p>
            </div>;
        
        case 'intro':
            return <IntroductionScreen onStart={handleStart} onGenerateNew={handleGenerateNew} hasExistingLessons={lessons.length > 0} isLoading={isGenerating} topic={topic} />;

        case 'error':
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
            
        case 'lesson':
            if (!currentLesson || !currentLesson.cards[currentIndex]) {
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
                         <Button variant="outline" size="sm" onClick={() => setScreen('intro')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Menu
                        </Button>
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
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-full md:h-[90vh] md:w-[90vw] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Interactive Tutorial: {topic}</DialogTitle>
          <DialogDescription>
            {screen === 'lesson' && currentLesson ? currentLesson.title : 'An AI-powered, interactive learning experience.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden relative">
            {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
