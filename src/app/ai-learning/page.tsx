
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import type { LearningRoadmap } from '@/lib/types';
import { getLearningRoadmapsForUser } from '@/services/learning-roadmaps';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RoadmapGenerator } from './RoadmapGenerator';
import { RoadmapDisplay } from './RoadmapDisplay';
import { PlusCircle } from 'lucide-react';

function LoadingState() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
}

export default function AiLearningPage() {
    const { user } = useAuth();
    const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBuilding, setIsBuilding] = useState(false);

    const fetchRoadmaps = async () => {
        if (!user) {
            setLoading(false);
            return;
        };
        setLoading(true);
        const userRoadmaps = await getLearningRoadmapsForUser(user.uid);
        setRoadmaps(userRoadmaps);
        setLoading(false);
    }

    useEffect(() => {
        fetchRoadmaps();
    }, [user]);

    const handleRoadmapCreated = () => {
        setIsBuilding(false);
        fetchRoadmaps(); // Refetch the roadmaps after creation
    }

    if (loading) {
        return <LoadingState />
    }
    
    if (isBuilding) {
        return <RoadmapGenerator onRoadmapCreated={handleRoadmapCreated} />;
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        AI Learning Copilot
                    </h1>
                    <p className="text-muted-foreground">
                        Your personalized, AI-powered guide to mastering new skills.
                    </p>
                </div>
                <Button size="lg" onClick={() => setIsBuilding(true)}>
                    <PlusCircle className="mr-2"/>
                    Build New Roadmap
                </Button>
            </div>
            
            {roadmaps.length > 0 ? (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {roadmaps.map(roadmap => (
                        <AccordionItem value={roadmap.id!} key={roadmap.id}>
                             <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <CardHeader className="p-0 text-left">
                                        <CardTitle>{roadmap.topic}</CardTitle>
                                        <CardDescription>{roadmap.duration} month plan focusing on: {roadmap.goals.join(', ')}</CardDescription>
                                    </CardHeader>
                                </AccordionTrigger>
                                <AccordionContent className="p-6 pt-0">
                                    <RoadmapDisplay roadmap={roadmap} />
                                </AccordionContent>
                             </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <Card className="text-center p-8 flex flex-col items-center gap-4 border-dashed">
                    <CardTitle>No Learning Roadmaps Yet</CardTitle>
                    <CardDescription>Click the button above to build your first personalized learning plan with AI.</CardDescription>
                </Card>
            )}

        </div>
    );
}
