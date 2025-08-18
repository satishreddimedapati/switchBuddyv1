'use client';

import { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { LessonCard } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TutorialCardProps {
    card: LessonCard;
    index: number;
    currentIndex: number;
    onComplete: () => void;
}

function CardBody({ card }: { card: LessonCard }) {
    return (
        <div className='space-y-4'>
            <p className="text-muted-foreground whitespace-pre-wrap">{card.content}</p>
        </div>
    );
}


export function TutorialCard({ card, index, currentIndex, onComplete }: TutorialCardProps) {
    const controls = useAnimation();
    const isCurrent = index === currentIndex;

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
             if (!isCurrent) return;
             if (e.key === 'ArrowRight' || e.key === 'Enter') {
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [isCurrent, onComplete]);


    const handleNext = () => {
        controls.start({ x: '-150%', opacity: 0 });
        setTimeout(onComplete, 200);
    };

    const getCardTypeBadge = () => {
        const types: Record<string, { label: string; color: string }> = {
            simple_explanation: { label: 'Simple Explanation', color: 'bg-blue-500' },
            real_world_example: { label: 'Real World Example', color: 'bg-green-500' },
            fun_explanation: { label: 'Fun Explanation', color: 'bg-amber-500' },
            company_use_cases: { label: 'Used By', color: 'bg-purple-500' },
            interview_qa: { label: 'Interview Q&A', color: 'bg-red-500' },
        }
        const typeInfo = types[card.card_type];
        if (!typeInfo) return null;
        return <Badge className={cn("text-white", typeInfo.color)}>{typeInfo.label}</Badge>
    }

    return (
        <motion.div
            className={cn("absolute w-full max-w-[calc(100%-2rem)] h-full", isCurrent && "cursor-pointer")}
            initial={{ x: '150%', opacity: 0 }}
            animate={controls}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
                if (offset.x < -100) {
                    handleNext();
                }
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
                   <CardBody card={card} />
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleNext} className="w-full">Next <ChevronsRight className="ml-2" /></Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}