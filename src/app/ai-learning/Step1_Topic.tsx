
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
import { useState, useTransition, useEffect, useMemo } from 'react';
import { generateRoadmapSuggestions, RoadmapSuggestionOutput } from '@/ai/flows/generate-roadmap-suggestions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Step1Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

export function Step1_Topic({ data, onUpdate }: Step1Props) {
    const { toast } = useToast();
    const [isSuggesting, startSuggestionTransition] = useTransition();
    const [suggestion, setSuggestion] = useState<RoadmapSuggestionOutput | null>(null);

    useEffect(() => {
        if (data.topic.length > 2) {
            const timer = setTimeout(() => {
                startSuggestionTransition(async () => {
                    try {
                        const res = await generateRoadmapSuggestions({ topic: data.topic });
                        setSuggestion(res);
                        // Do not auto-apply, let the user decide.
                    } catch (error) {
                        console.error("Failed to get suggestion", error);
                    }
                });
            }, 1000); // Debounce for 1 second
            return () => clearTimeout(timer);
        }
    }, [data.topic]);
    
    const applyMainSuggestion = () => {
        if(suggestion) {
            onUpdate({
                timePerDay: suggestion.suggestedTimePerDay,
                duration: suggestion.suggestedDurationDays,
            });
            toast({ title: "AI Suggestion Applied!", description: suggestion.reasoning });
        }
    }

    const dynamicSuggestion = useMemo(() => {
        if (!suggestion) return { durationText: '', timeText: '', suggestedDays: 0, suggestedMinutes: 0 };
        
        const totalHours = suggestion.totalEffortHours;
        const timePerDayHours = data.timePerDay / 60;
        const durationDays = data.duration;

        // Calculate suggested duration based on user's time commitment
        const suggestedDays = Math.round(totalHours / timePerDayHours);
        const durationText = `~${suggestedDays} days`;

        // Calculate suggested time based on user's duration
        const suggestedHours = totalHours / durationDays;
        const suggestedMinutes = Math.round(suggestedHours * 60);
        const timeText = `~${suggestedHours.toFixed(1)} hrs/day`;

        return { durationText, timeText, suggestedDays, suggestedMinutes };
    }, [data.timePerDay, data.duration, suggestion]);

    const applyDurationSuggestion = () => {
        if (dynamicSuggestion.suggestedDays > 0) {
            onUpdate({ duration: dynamicSuggestion.suggestedDays });
            toast({ title: "Duration Applied!", description: `Set to ${dynamicSuggestion.suggestedDays} days.` });
        }
    }
    
    const applyTimeSuggestion = () => {
        if (dynamicSuggestion.suggestedMinutes > 0) {
             // Snap to nearest 15 minutes
            const snappedMinutes = Math.round(dynamicSuggestion.suggestedMinutes / 15) * 15;
            onUpdate({ timePerDay: snappedMinutes });
            toast({ title: "Time Applied!", description: `Set to ${snappedMinutes / 60} hours per day.` });
        }
    }


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

                {isSuggesting && (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 animate-spin" />
                        Getting AI suggestions...
                    </div>
                )}
                
                {suggestion && !isSuggesting && (
                    <Alert>
                        <Wand2 className="h-4 w-4" />
                        <AlertTitle>AI Suggestion</AlertTitle>
                        <AlertDescription>
                            {suggestion.reasoning} We suggest studying for 
                            <span className="font-bold"> {suggestion.suggestedTimePerDay / 60} hours/day</span> for 
                            <span className="font-bold"> {suggestion.suggestedDurationDays} days</span>. 
                            <Button variant="link" onClick={applyMainSuggestion} className="p-0 h-auto ml-1">Apply this suggestion.</Button>
                        </AlertDescription>
                    </Alert>
                )}


                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <Label>Time Commitment Per Day</Label>
                             {suggestion && (
                                <Button variant="link" size="sm" className="text-xs p-0 h-auto text-muted-foreground" onClick={applyDurationSuggestion}>
                                   (Apply: {dynamicSuggestion.durationText})
                                </Button>
                            )}
                        </div>
                         <Slider
                            value={[data.timePerDay]}
                            onValueChange={value => onUpdate({ timePerDay: value[0] })}
                            min={30}
                            max={240}
                            step={15}
                        />
                        <div className="text-center font-medium">{data.timePerDay / 60} hours</div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                            <Label>Total Duration</Label>
                            {suggestion && (
                                <Button variant="link" size="sm" className="text-xs p-0 h-auto text-muted-foreground" onClick={applyTimeSuggestion}>
                                    (Apply: {dynamicSuggestion.timeText})
                                </Button>
                            )}
                        </div>
                         <Slider
                            value={[data.duration]}
                            onValueChange={value => onUpdate({ duration: value[0] })}
                            min={7}
                            max={120}
                            step={1}
                        />
                        <div className="text-center font-medium">{data.duration} {data.duration > 1 ? 'days' : 'day'}</div>
                    </div>
                     <div className="space-y-2">
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
            </CardContent>
        </Card>
    );
}
