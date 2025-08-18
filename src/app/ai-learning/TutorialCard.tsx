
'use client';

import { LessonCard } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface TutorialCardProps {
    card: LessonCard;
    onComplete: () => void;
}

function CardBody({ card }: { card: LessonCard }) {
    if (card.card_type === 'pros_cons') {
        const pros = card.content.match(/Pros:\n(.*?)\n\nCons:/s);
        const cons = card.content.match(/Cons:\n(.*)/s);
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="font-semibold text-green-600 mb-2">Pros</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                       {(pros && pros[1]) ? pros[1].split('\n').filter(s => s.trim()).map((pro, i) => <li key={`pro-${i}`}>{pro.replace(/^- /, '')}</li>) : <li>No pros listed.</li>}
                    </ul>
                </div>
                 <div>
                    <h4 className="font-semibold text-red-600 mb-2">Cons</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        {(cons && cons[1]) ? cons[1].split('\n').filter(s => s.trim()).map((con, i) => <li key={`con-${i}`}>{con.replace(/^- /, '')}</li>) : <li>No cons listed.</li>}
                    </ul>
                </div>
            </div>
        )
    }
     if (card.card_type === 'interview_qa') {
        const qaPairs = card.content.split(/\n\d\.\s/g).filter(s => s.trim());
        return (
            <div className="space-y-4">
            {qaPairs.map((pair, i) => {
                const [question, ...answerParts] = pair.replace(/^Q:\s*/, '').split(/\nA:\s*/);
                const answer = answerParts.join('\nA: ');
                return (
                    <div key={i} className="space-y-1">
                        <p className="font-semibold">{i+1}. {question}</p>
                        <p className="text-muted-foreground pl-4 border-l-2 ml-2">{answer}</p>
                    </div>
                )
            })}
            </div>
        );
    }
    return (
        <div className='space-y-4'>
            <p className="text-muted-foreground whitespace-pre-wrap">{card.content}</p>
        </div>
    );
}

export function TutorialCard({ card, onComplete }: TutorialCardProps) {
    const cardTypeBadge = useMemo(() => {
        const types: Record<string, { label: string; color: string }> = {
            simple_explanation: { label: 'Concept', color: 'bg-blue-500' },
            real_world_example: { label: 'Real World Example', color: 'bg-green-500' },
            pros_cons: { label: 'Pros & Cons', color: 'bg-yellow-500 text-black' },
            when_to_use: { label: 'When to Use', color: 'bg-indigo-500' },
            interview_qa: { label: 'Interview Q&A', color: 'bg-red-500' },
            fun_fact: { label: 'Fun Fact', color: 'bg-pink-500' },
            company_use_cases: { label: 'In The Wild', color: 'bg-gray-500' }
        }
        const typeInfo = types[card.card_type];
        if (!typeInfo) return null;
        return <Badge className={cn("text-white", typeInfo.color)}>{typeInfo.label}</Badge>
    }, [card.card_type]);

    return (
         <Card className="h-full w-full flex flex-col shadow-xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                     <CardTitle className="text-xl flex items-center gap-2 pr-4">
                        <span className="text-2xl">{card.visual}</span>
                        {card.title}
                    </CardTitle>
                    {cardTypeBadge}
                </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
               <CardBody card={card} />
            </CardContent>
             <CardFooter>
                <Button onClick={onComplete} className="w-full">Next <ChevronsRight className="ml-2" /></Button>
            </CardFooter>
        </Card>
    );
}
