
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RoadmapInputs } from './RoadmapGenerator';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { generateLearningRoadmap } from '@/ai/flows/generate-learning-roadmap';
import { addLearningRoadmap } from '@/services/learning-roadmaps';
import { Loader2, Rocket } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';

interface Step5Props {
    data: RoadmapInputs;
    onRoadmapCreated: () => void;
}

export function Step5_Summary({ data, onRoadmapCreated }: Step5Props) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateRoadmap = async () => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const aiResult = await generateLearningRoadmap({
                ...data,
                startDate: format(data.startDate, 'yyyy-MM-dd'),
            });
            
            if (!aiResult || !aiResult.weeks) {
                 throw new Error("The AI failed to generate a valid roadmap structure.");
            }

            await addLearningRoadmap({
                userId: user.uid,
                ...data,
                roadmap: aiResult,
            });

            toast({ title: "Success!", description: "Your personalized roadmap is ready."});
            onRoadmapCreated();

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during roadmap generation.");
        } finally {
            setIsGenerating(false);
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Ready to Launch?</CardTitle>
                <CardDescription>Review your selections below. If everything looks good, let's build your plan!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3 text-sm">
                    <SummaryItem label="Topic" value={data.topic} />
                    <SummaryItem label="Goals" value={<div className="flex flex-wrap gap-1">{data.goals.map(g => <Badge key={g} variant="secondary">{g}</Badge>)}</div>} />
                    <SummaryItem label="Experience" value={data.experienceLevel} />
                    <SummaryItem label="Tech Focus" value={<div className="flex flex-wrap gap-1">{data.techFocus.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>} />
                    <SummaryItem label="Learning Style" value={data.learningStyle} />
                    <SummaryItem label="Commitment" value={`${data.timePerDay / 60} hrs/day for ${data.duration} days`} />
                    <SummaryItem label="Start Date" value={format(data.startDate, 'PPP')} />
                </div>
                 {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Generation Failed</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                 )}
            </CardContent>
            <CardFooter className="justify-end">
                <Button size="lg" onClick={handleGenerateRoadmap} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <Rocket className="mr-2" />}
                    {isGenerating ? 'Building your personalized roadmap...' : 'Generate My Roadmap'}
                </Button>
            </CardFooter>
        </Card>
    );
}

function SummaryItem({ label, value }: { label: string, value: React.ReactNode }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <span className="font-semibold text-muted-foreground">{label}</span>
            <div className="sm:text-right">{value}</div>
        </div>
    )
}
