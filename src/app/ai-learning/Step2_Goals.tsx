
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Briefcase, Rocket, Brain, TrendingUp, PlusCircle, Wand2 } from 'lucide-react';
import type { RoadmapInputs } from './RoadmapGenerator';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface Step2Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

const goals = [
    { id: 'Job Switch', title: 'Job Switch', description: 'Prepare for a new role and crack the interviews.', icon: Briefcase },
    { id: 'Career Growth', title: 'Career Growth', description: 'Get that promotion or raise you deserve.', icon: TrendingUp },
    { id: 'Build a Startup Project', title: 'Build a Startup Project', description: 'Go from idea to deployed product.', icon: Rocket },
    { id: 'Upskill / Curiosity', title: 'Upskill / Curiosity', description: 'Learn something new just for the fun of it.', icon: Brain },
];

const aiSuggestions = ["Pass a Certification Exam", "Contribute to Open Source", "Automate a Personal Task"];


export function Step2_Goals({ data, onUpdate }: Step2Props) {
    const [customGoal, setCustomGoal] = useState('');

    const toggleGoal = (goalId: string) => {
        const newGoals = data.goals.includes(goalId)
            ? data.goals.filter(g => g !== goalId)
            : [...data.goals, goalId];
        onUpdate({ goals: newGoals });
    };

    const addCustomGoal = () => {
        if (customGoal && !data.goals.includes(customGoal)) {
            onUpdate({ goals: [...data.goals, customGoal] });
        }
        setCustomGoal('');
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>What's Your Motivation?</CardTitle>
                <CardDescription>Select one or more goals. This helps us tailor the content to your needs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map(goal => {
                        const isSelected = data.goals.includes(goal.id);
                        return (
                            <Card 
                                key={goal.id}
                                onClick={() => toggleGoal(goal.id)}
                                className={cn(
                                    "p-4 cursor-pointer transition-all",
                                    isSelected && "ring-2 ring-primary bg-primary/10"
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
                 <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2"><PlusCircle /> Add a Custom Goal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Enter your own goal..."
                                value={customGoal}
                                onChange={(e) => setCustomGoal(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomGoal()}
                            />
                            <button onClick={addCustomGoal} className="px-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold">Add</button>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Wand2 className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Suggestions:</span>
                             {aiSuggestions.map(s => (
                                <Badge key={s} variant="outline" className="cursor-pointer" onClick={() => setCustomGoal(s)}>
                                    {s}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                 {data.goals.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Your Selected Goals:</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.goals.map(goal => (
                                <Badge key={goal} variant="default" className="text-sm py-1">
                                    {goal}
                                    <button onClick={() => toggleGoal(goal)} className="ml-2 text-primary-foreground/70 hover:text-primary-foreground">✕</button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                 )}

            </CardContent>
        </Card>
    );
}
