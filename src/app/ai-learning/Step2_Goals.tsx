
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Briefcase, Rocket, Brain, TrendingUp } from 'lucide-react';
import type { RoadmapInputs } from './RoadmapGenerator';

interface Step2Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

const goals = [
    { id: 'job-switch', title: 'Job Switch', icon: Briefcase, description: 'Prepare for a new role and crack the interviews.' },
    { id: 'career-growth', title: 'Career Growth', icon: TrendingUp, description: 'Get that promotion or raise you deserve.' },
    { id: 'startup-project', title: 'Build a Startup Project', icon: Rocket, description: 'Go from idea to deployed product.' },
    { id: 'upskill', title: 'Upskill / Curiosity', icon: Brain, description: 'Learn something new just for the fun of it.' },
];

export function Step2_Goals({ data, onUpdate }: Step2Props) {

    const toggleGoal = (goalId: string) => {
        const newGoals = data.goals.includes(goalId)
            ? data.goals.filter(g => g !== goalId)
            : [...data.goals, goalId];
        onUpdate({ goals: newGoals });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>What's Your Motivation?</CardTitle>
                <CardDescription>Select one or more goals. This helps us tailor the content to your needs.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map(goal => {
                        const isSelected = data.goals.includes(goal.id);
                        return (
                            <Card 
                                key={goal.id}
                                onClick={() => toggleGoal(goal.id)}
                                className={cn(
                                    "p-4 cursor-pointer transition-all",
                                    isSelected && "ring-2 ring-primary"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <goal.icon className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">{goal.title}</h3>
                                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

