
'use client';

import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { LessonCard } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, ChevronsRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TutorialCardProps {
    card: LessonCard;
    index: number;
    currentIndex: number;
    onComplete: () => void;
}

function CardBody({ card, onAnswer, answerState, selectedValue }: { card: LessonCard, onAnswer: (value: number | null) => void, answerState: 'unanswered' | 'correct' | 'incorrect', selectedValue: number | null }) {
    switch (card.card_type) {
        case 'concept':
        case 'scenario':
        case 'reflection':
            return (
                <>
                    <p className="text-muted-foreground whitespace-pre-wrap">{card.content}</p>
                    {card.card_type === 'reflection' && (
                        <Textarea placeholder="Type your thoughts here..." className="mt-4 bg-background" />
                    )}
                </>
            );
        case 'code_snippet':
            return (
                 <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                    <code className={`language-${card.language}`}>{card.code}</code>
                </pre>
            );
        case 'challenge_mcq':
            return (
                 <div className="space-y-4">
                    <p className="text-muted-foreground">{card.content}</p>
                    <RadioGroup 
                        onValueChange={(value) => onAnswer(parseInt(value))}
                        disabled={answerState !== 'unanswered'}
                    >
                        {(card.options || []).map((option, idx) => (
                            <div key={idx} className={cn(
                                "flex items-center space-x-2 p-3 rounded-md border transition-all",
                                answerState === 'correct' && idx === card.correct_option_index && "bg-green-100 border-green-400 dark:bg-green-900/30",
                                answerState === 'incorrect' && idx === selectedValue && "bg-red-100 border-red-400 dark:bg-red-900/30",
                                answerState === 'incorrect' && idx === card.correct_option_index && "bg-green-100 border-green-400 dark:bg-green-900/30"
                            )}>
                                <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                                <Label htmlFor={`option-${idx}`}>{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                    {answerState !== 'unanswered' && (
                         <div className={cn(
                            "p-3 rounded-md text-sm",
                            answerState === 'correct' ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                        )}>
                            <p className="font-semibold">{answerState === 'correct' ? 'Correct!' : 'Not quite.'}</p>
                            <p>{card.explanation}</p>
                        </div>
                    )}
                </div>
            );
        default:
            return null;
    }
}


export function TutorialCard({ card, index, currentIndex, onComplete }: TutorialCardProps) {
    const controls = useAnimation();
    const [answerState, setAnswerState] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
    const [selectedValue, setSelectedValue] = useState<number | null>(null);

    const isCurrent = index === currentIndex;

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
             if (!isCurrent) return;

             if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if(card.card_type === 'challenge_mcq' && answerState === 'unanswered') return;
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [isCurrent, card.card_type, answerState, onComplete]);


    const handleNext = () => {
        controls.start({ x: '-150%', opacity: 0 });
        setTimeout(onComplete, 200);
    };

    const handleCheckAnswer = () => {
        if (selectedValue === card.correct_option_index) {
            setAnswerState('correct');
        } else {
            setAnswerState('incorrect');
        }
    };
    
    const renderFooter = () => {
        if (card.card_type === 'challenge_mcq') {
            return (
                <div className="flex justify-end">
                     {answerState === 'unanswered' ? (
                        <Button onClick={handleCheckAnswer} disabled={selectedValue === null}>Check Answer</Button>
                    ) : (
                        <Button onClick={handleNext}>Next <ChevronsRight className="ml-2" /></Button>
                    )}
                </div>
            )
        }
        return (
             <div className="flex justify-end">
                <Button onClick={handleNext}>Next <ChevronsRight className="ml-2" /></Button>
            </div>
        )
    }

    const getCardTypeBadge = () => {
        const types: Record<string, { label: string; color: string }> = {
            concept: { label: 'Concept', color: 'bg-blue-500' },
            challenge_mcq: { label: 'Challenge', color: 'bg-amber-500' },
            code_snippet: { label: 'Code', color: 'bg-gray-600' },
            scenario: { label: 'Scenario', color: 'bg-purple-500' },
            reflection: { label: 'Reflection', color: 'bg-teal-500' },
        }
        const typeInfo = types[card.card_type];
        if (!typeInfo) return null;
        return <Badge className={cn("text-white", typeInfo.color)}>{typeInfo.label}</Badge>
    }

    return (
        <motion.div
            className={cn("absolute w-[calc(100%-2rem)] h-full", isCurrent && "cursor-pointer")}
            initial={{ x: '150%', opacity: 0 }}
            animate={controls}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
                if (offset.x < -100) handleNext();
            }}
        >
            <Card className="h-full flex flex-col shadow-xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                         <CardTitle className="text-xl flex items-center gap-2">
                            <span className="text-2xl">{card.visual}</span>
                            {card.title}
                        </CardTitle>
                        {getCardTypeBadge()}
                    </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto">
                    <CardBody card={card} onAnswer={setSelectedValue} answerState={answerState} selectedValue={selectedValue} />
                </CardContent>
                <CardFooter>
                    {renderFooter()}
                </CardFooter>
            </Card>
        </motion.div>
    );
}

