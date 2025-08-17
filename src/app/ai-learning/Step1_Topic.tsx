
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { RoadmapInputs } from './RoadmapGenerator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Wand2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useState, useTransition } from 'react';
import { generateRoadmapSuggestions } from '@/ai/flows/generate-roadmap-suggestions';
import { useToast } from '@/hooks/use-toast';

interface Step1Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

export function Step1_Topic({ data, onUpdate }: Step1Props) {
    const { toast } = useToast();
    const [isSuggesting, startSuggestionTransition] = useTransition();

    const handleGetSuggestion = () => {
        if (!data.topic) {
            toast({ title: "Topic needed", description: "Please enter a topic first to get suggestions.", variant: "destructive" });
            return;
        }
        startSuggestionTransition(async () => {
            try {
                const suggestion = await generateRoadmapSuggestions({ topic: data.topic });
                onUpdate({
                    timePerDay: suggestion.suggestedTimePerDay,
                    duration: suggestion.suggestedDurationDays,
                });
                toast({ title: "Suggestions applied!", description: "The AI has suggested an optimal schedule." });
            } catch (error) {
                console.error("Failed to get suggestion", error);
                toast({ title: "Error", description: "Could not retrieve AI suggestions.", variant: "destructive" });
            }
        });
    }

    const totalSessions = data.duration;

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

                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={handleGetSuggestion} disabled={isSuggesting || !data.topic}>
                         {isSuggesting ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                        Get AI Suggestion
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                            min={7}
                            max={90}
                            step={1}
                        />
                        <div className="text-center font-medium">{data.duration} {data.duration > 1 ? 'days' : 'day'}</div>
                    </div>
                     <div className="space-y-4">
                        <Label>Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !data.startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {data.startDate ? format(data.startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={data.startDate}
                                    onSelect={(date) => onUpdate({ startDate: date || new Date()})}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                    Studying <span className="font-bold text-primary">{data.timePerDay / 60} hours/day</span> for <span className="font-bold text-primary">{data.duration} {data.duration > 1 ? 'days' : 'day'}</span> will result in approximately <span className="font-bold text-primary">{totalSessions}</span> learning sessions.
                </div>

            </CardContent>
        </Card>
    );
}
