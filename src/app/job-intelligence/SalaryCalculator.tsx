
'use client';

import { useState, useTransition } from "react";
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPersonalizedSalaryEstimate, GetPersonalizedSalaryEstimateOutput } from "@/ai/flows/get-personalized-salary-estimate";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Wand2, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { GetPersonalizedSalaryEstimateInputSchema, highImpactSkills } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

type SalaryFormValues = z.infer<typeof GetPersonalizedSalaryEstimateInputSchema>;

export function SalaryCalculator() {
    const [result, setResult] = useState<GetPersonalizedSalaryEstimateOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, startTransition] = useTransition();

    const form = useForm<SalaryFormValues>({
        resolver: zodResolver(GetPersonalizedSalaryEstimateInputSchema),
        defaultValues: {
            jobRole: '',
            location: '',
            yearsOfExperience: 0,
            skills: [],
        },
    });

    const onSubmit = (data: SalaryFormValues) => {
        startTransition(async () => {
            setError(null);
            setResult(null);
            try {
                const res = await getPersonalizedSalaryEstimate(data);
                setResult(res);
            } catch (e) {
                setError("Failed to fetch salary estimate.");
                console.error(e);
            }
        });
    }

    return (
        <div className="space-y-4">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="jobRole">Job Role</Label>
                        <Input id="jobRole" placeholder="e.g. Software Engineer" {...form.register('jobRole')} />
                        {form.formState.errors.jobRole && <p className="text-destructive text-sm mt-1">{form.formState.errors.jobRole.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" placeholder="e.g. Bangalore" {...form.register('location')} />
                         {form.formState.errors.location && <p className="text-destructive text-sm mt-1">{form.formState.errors.location.message}</p>}
                    </div>
                     <div>
                        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                        <Input id="yearsOfExperience" type="number" {...form.register('yearsOfExperience', { valueAsNumber: true })} />
                         {form.formState.errors.yearsOfExperience && <p className="text-destructive text-sm mt-1">{form.formState.errors.yearsOfExperience.message}</p>}
                    </div>
                </div>
                <div>
                    <Label>Select Your Key Skills</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 rounded-md border p-4 mt-2">
                        {highImpactSkills.map(skill => (
                             <Controller
                                key={skill}
                                name="skills"
                                control={form.control}
                                render={({ field }) => (
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={skill}
                                            checked={field.value?.includes(skill)}
                                            onCheckedChange={(checked) => {
                                                return checked
                                                ? field.onChange([...(field.value || []), skill])
                                                : field.onChange(
                                                    field.value?.filter(
                                                        (value) => value !== skill
                                                    )
                                                    );
                                            }}
                                        />
                                        <Label htmlFor={skill} className="text-sm font-normal">{skill}</Label>
                                    </div>
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isGenerating}>
                         {isGenerating ? <Loader2 className="animate-spin mr-2"/> : <Wand2 className="mr-2"/>}
                         Calculate My Salary
                    </Button>
                </div>
            </form>
            
             {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
             
             {isGenerating && (
                 <div className="space-y-4 pt-4">
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                </div>
             )}

             {result && (
                <div className="space-y-4 pt-4">
                    <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertTitle className="text-2xl font-bold text-primary">
                            {result.estimatedSalaryRange}
                        </AlertTitle>
                        <AlertDescription>
                            {result.commentary}
                        </AlertDescription>
                    </Alert>
                </div>
             )}
        </div>
    )
}
