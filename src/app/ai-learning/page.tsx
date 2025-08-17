
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import type { LearningRoadmap } from '@/lib/types';
import { getLearningRoadmapForUser } from '@/services/learning-roadmaps';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoadmapGenerator } from './RoadmapGenerator';

function LoadingState() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
}

function RoadmapPreview({ roadmap }: { roadmap: LearningRoadmap }) {
    // This is a placeholder for the roadmap preview.
    // In a real implementation, you would render the roadmap data here.
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Learning Roadmap: {roadmap.topic}</CardTitle>
                <CardDescription>Here's a preview of your personalized plan. Keep up the great work!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Roadmap preview will be implemented here.</p>
            </CardContent>
        </Card>
    )
}

export default function AiLearningPage() {
    const { user } = useAuth();
    const [roadmap, setRoadmap] = useState<LearningRoadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBuilding, setIsBuilding] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        };

        const fetchRoadmap = async () => {
            setLoading(true);
            const userRoadmap = await getLearningRoadmapForUser(user.uid);
            setRoadmap(userRoadmap);
            setLoading(false);
        }

        fetchRoadmap();

    }, [user]);

    if (loading) {
        return <LoadingState />
    }
    
    if (isBuilding) {
        return <RoadmapGenerator onRoadmapCreated={() => setIsBuilding(false)} />;
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    AI Learning Copilot
                </h1>
                <p className="text-muted-foreground">
                    Your personalized, AI-powered guide to mastering new skills.
                </p>
            </div>
            
            {roadmap ? (
                <RoadmapPreview roadmap={roadmap} />
            ) : (
                <Card className="text-center p-8 flex flex-col items-center gap-4">
                    <CardTitle>Create Your Personalized Learning Plan</CardTitle>
                    <CardDescription>Let our AI build a custom roadmap tailored to your goals, experience, and learning style.</CardDescription>
                    <Button size="lg" onClick={() => setIsBuilding(true)}>
                        Build My Roadmap
                    </Button>
                </Card>
            )}

        </div>
    );
}
