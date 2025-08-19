

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import type { LearningRoadmap } from '@/lib/types';
import { getLearningRoadmapsForUser, deleteLearningRoadmap } from '@/services/learning-roadmaps';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RoadmapGenerator } from './RoadmapGenerator';
import { RoadmapDisplay } from './RoadmapDisplay';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
    const { toast } = useToast();
    const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBuilding, setIsBuilding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchAllData = async () => {
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
        if(user) {
          fetchAllData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleRoadmapCreated = () => {
        setIsBuilding(false);
        fetchAllData();
    }
    
    const handleDelete = async (roadmapId: string) => {
        if (!user) return;
        setIsDeleting(roadmapId);
        try {
            await deleteLearningRoadmap(roadmapId, user.uid);
            toast({ title: "Success", description: "Roadmap deleted successfully." });
            fetchAllData(); // Refetch after deletion
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete roadmap.", variant: "destructive" });
        } finally {
            setIsDeleting(null);
        }
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
                        <Card key={roadmap.id}>
                            <AccordionItem value={roadmap.id!} className="border-b-0">
                                <div className="flex justify-between items-center p-4 sm:p-6">
                                    <AccordionTrigger className="p-0 hover:no-underline flex-1 text-left">
                                        <div className="pr-4">
                                            <CardTitle>{roadmap.topic}</CardTitle>
                                            <CardDescription>{roadmap.duration} day plan focusing on: {roadmap.goals.join(', ')}</CardDescription>
                                        </div>
                                    </AccordionTrigger>
                                    <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/ai-learning/edit/${roadmap.id}`}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Link>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    {isDeleting === roadmap.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete your learning roadmap.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(roadmap.id!)} className="bg-destructive hover:bg-destructive/90">
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                                <AccordionContent className="px-6 pb-6">
                                    <RoadmapDisplay roadmap={roadmap} />
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
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
