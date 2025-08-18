
'use client';

import { LessonCard } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TutorialCardProps {
    card: LessonCard;
    onComplete: () => void;
}

function CardBody({ card }: { card: LessonCard }) {
    return (
        <div className='space-y-4'>
            <p className="text-muted-foreground whitespace-pre-wrap">{card.content}</p>
        </div>
    );
}

export function TutorialCard({ card, onComplete }: TutorialCardProps) {
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
        <div className="w-full h-full">
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
                    <Button onClick={onComplete} className="w-full">Next <ChevronsRight className="ml-2" /></Button>
                </CardFooter>
            </Card>
        </div>
    );
}

