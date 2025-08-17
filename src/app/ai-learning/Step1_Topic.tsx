
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { RoadmapInputs } from './RoadmapGenerator';

interface Step1Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

export function Step1_Topic({ data, onUpdate }: Step1Props) {

    const totalSessions = (data.duration * 30); // Approximate days in a month

    return (
        <Card>
            <CardHeader>
                <CardTitle>Define Your Learning Path</CardTitle>
                <CardDescription>What do you want to master? Let's set the foundation for your roadmap.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="topic">Main Topic / Track</Label>
                    <Input 
                        id="topic" 
                        placeholder="Ex: .NET Full Stack with Angular" 
                        value={data.topic}
                        onChange={e => onUpdate({ topic: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Label>Time Commitment Per Day</Label>
                         <Slider
                            value={[data.timePerDay]}
                            onValueChange={value => onUpdate({ timePerDay: value[0] })}
                            min={30}
                            max={180}
                            step={30}
                        />
                        <div className="text-center font-medium">{data.timePerDay / 60} hours</div>
                    </div>
                    <div className="space-y-4">
                        <Label>Total Duration</Label>
                         <Slider
                            value={[data.duration]}
                            onValueChange={value => onUpdate({ duration: value[0] })}
                            min={1}
                            max={6}
                            step={1}
                        />
                        <div className="text-center font-medium">{data.duration} {data.duration > 1 ? 'months' : 'month'}</div>
                    </div>
                </div>

                <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                    Studying <span className="font-bold text-primary">{data.timePerDay / 60} hours/day</span> for <span className="font-bold text-primary">{data.duration} {data.duration > 1 ? 'months' : 'month'}</span> will result in approximately <span className="font-bold text-primary">{totalSessions}</span> learning sessions.
                </div>

            </CardContent>
        </Card>
    );
}
