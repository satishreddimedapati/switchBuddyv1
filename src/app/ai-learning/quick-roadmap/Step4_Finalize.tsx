
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { QuickRoadmapInputs } from './page';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { generateQuickRoadmap } from '@/ai/flows/generate-quick-roadmap';
import { addLearningRoadmap } from '@/services/learning-roadmaps';
import { Loader2, Rocket } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { highImpactSkills } from '@/lib/types';
import { LearningRoadmap } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface Step4Props {
    data: QuickRoadmapInputs;
    onUpdate: (updates: Partial<QuickRoadmapInputs>) => void;
    setGeneratedRoadmap: (roadmap: LearningRoadmap) => void;
}

export function Step4_Finalize({ data, onUpdate, setGeneratedRoadmap }: Step4Props) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isGenerating, startGenerationTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleGenerateRoadmap = async () => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        startGenerationTransition(async () => {
            setError(null);
            try {
                const roadmapResult = await generateQuickRoadmap({
                    daysToPrepare: data.daysToPrepare,
                    company: data.company,
                    role: data.role,
                    techStack: data.techStack,
                    selfAssessment: data.selfAssessment,
                });

                if (!roadmapResult || !roadmapResult.weeks || roadmapResult.weeks.length === 0) {
                     throw new Error("The AI failed to generate a valid roadmap. Please try adjusting your inputs or try again later.");
                }

                const newRoadmap: Omit<LearningRoadmap, 'id' | 'createdAt'> = {
                    userId: user.uid,
                    topic: `Interview Prep: ${data.role} at ${data.company}`,
                    timePerDay: 60, // Default for quick roadmaps
                    duration: data.daysToPrepare,
                    startDate: new Date().toISOString(),
                    endDate: data.interviewDate.toISOString(),
                    learnOnWeekends: true,
                    goals: ['Interview Preparation'],
                    experienceLevel: 'Mixed', // Based on self-assessment
                    techFocus: data.techStack,
                    learningStyle: 'Mixed',
                    roadmap: roadmapResult,
                }
                
                await addLearningRoadmap(newRoadmap);
                
                toast({ 
                    title: "Quick Roadmap Ready!", 
                    description: "Your personalized interview plan has been generated and saved."
                });

                router.push('/ai-learning');

            } catch (err) {
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(errorMessage);
                toast({ title: "Error", description: errorMessage, variant: "destructive" });
            }
        });
    }

    const toggleTech = (tech: string) => {
        const newTechs = data.techStack.includes(tech)
            ? data.techStack.filter(t => t !== tech)
            : [...data.techStack, tech];
        onUpdate({ techStack: newTechs });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Final Check</CardTitle>
                <CardDescription>Confirm the details below. The AI will use this to build your plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" value={data.company} onChange={e => onUpdate({ company: e.target.value })} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" value={data.role} onChange={e => onUpdate({ role: e.target.value })} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Tech Stack</Label>
                    <div className="p-4 border rounded-md min-h-24">
                        {data.techStack.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {data.techStack.map(tech => (
                                    <Badge key={tech} variant="default" className="text-sm py-1">
                                        {tech}
                                        <button onClick={() => toggleTech(tech)} className="ml-2 text-primary-foreground/70 hover:text-primary-foreground">✕</button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No technologies identified. Add some below.</p>
                        )}
                    </div>
                     <div className="flex flex-wrap gap-1 pt-2">
                        {highImpactSkills.filter(s => !data.techStack.includes(s)).slice(0,10).map(skill => (
                             <Badge key={skill} variant="outline" className="cursor-pointer" onClick={() => toggleTech(skill)}>
                                + {skill}
                            </Badge>
                        ))}
                    </div>
                 </div>
                 {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Generation Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 )}
            </CardContent>
            <CardFooter>
                <Button size="lg" onClick={handleGenerateRoadmap} disabled={isGenerating} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Rocket className="mr-2" />}
                    Build My Quick Roadmap
                </Button>
            </CardFooter>
        </Card>
    );
}
