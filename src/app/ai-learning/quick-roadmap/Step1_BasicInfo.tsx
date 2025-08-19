
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { QuickRoadmapInputs } from './page';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInDays } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useEffect, useMemo } from 'react';

interface Step1Props {
    data: QuickRoadmapInputs;
    onUpdate: (updates: Partial<QuickRoadmapInputs>) => void;
}

export function Step1_BasicInfo({ data, onUpdate }: Step1Props) {
    
    // When interview date changes, update daysToPrepare
    useEffect(() => {
        const days = differenceInDays(data.interviewDate, new Date());
        onUpdate({ daysToPrepare: Math.max(1, days) }); // Ensure at least 1 day
    }, [data.interviewDate]);

    // When daysToPrepare changes, update interviewDate
    const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const days = parseInt(e.target.value, 10);
        if (!isNaN(days)) {
            onUpdate({ 
                daysToPrepare: days,
                interviewDate: addDays(new Date(), days)
            });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about your interview timeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                     <div className="space-y-2">
                        <Label>Interview Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !data.interviewDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {data.interviewDate ? format(data.interviewDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={data.interviewDate}
                                    onSelect={(date) => onUpdate({ interviewDate: date || new Date()})}
                                    initialFocus
                                    disabled={{ before: new Date() }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label>Days to Prepare</Label>
                        <input
                            type="number"
                            value={data.daysToPrepare}
                            onChange={handleDaysChange}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            min="1"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4 rounded-md border p-4">
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Advanced Mode</p>
                        <p className="text-sm text-muted-foreground">
                            Use your resume and JD to get a more personalized plan.
                        </p>
                    </div>
                    <Switch
                        checked={data.advancedMode}
                        onCheckedChange={(checked) => onUpdate({ advancedMode: checked })}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
