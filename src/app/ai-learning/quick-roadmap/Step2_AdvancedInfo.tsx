
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuickRoadmapInputs } from './page';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parseJobDetails } from '@/ai/flows/parse-job-details';

interface Step2Props {
    data: QuickRoadmapInputs;
    onUpdate: (updates: Partial<QuickRoadmapInputs>) => void;
}

export function Step2_AdvancedInfo({ data, onUpdate }: Step2Props) {
    const { toast } = useToast();
    const [isParsing, startParsingTransition] = useTransition();

    const handleParseDetails = () => {
        if (!data.resume || !data.jobDescription) {
            toast({ title: "Missing Information", description: "Please paste both your resume and the job description.", variant: "destructive"});
            return;
        }
        startParsingTransition(async () => {
            try {
                const result = await parseJobDetails({ resume: data.resume!, jobDescription: data.jobDescription! });
                onUpdate({
                    company: result.company,
                    role: result.role,
                    techStack: result.techStack
                });
                toast({ title: "Success!", description: "Extracted role, company, and tech stack." });
            } catch (error) {
                console.error("Failed to parse details", error);
                toast({ title: "Parsing Failed", description: "Could not extract details automatically. Please fill them in manually in the final step.", variant: "destructive"});
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Advanced Details</CardTitle>
                <CardDescription>Provide your resume and the job description for a hyper-personalized plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="resume">Your Resume</Label>
                        <Textarea 
                            id="resume" 
                            placeholder="Paste your full resume text here..." 
                            rows={12}
                            value={data.resume}
                            onChange={(e) => onUpdate({ resume: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="jobDescription">Job Description</Label>
                        <Textarea 
                            id="jobDescription" 
                            placeholder="Paste the full job description here..." 
                            rows={12}
                            value={data.jobDescription}
                            onChange={(e) => onUpdate({ jobDescription: e.target.value })}
                        />
                    </div>
                </div>

                <Alert>
                    <Wand2 className="h-4 w-4" />
                    <AlertTitle>Auto-Detect Details</AlertTitle>
                    <AlertDescription>
                        After pasting your content, click the button below to let AI automatically identify the company, role, and key technologies. You can still edit these later.
                    </AlertDescription>
                </Alert>
                
                <div className="flex justify-end">
                    <Button onClick={handleParseDetails} disabled={isParsing || !data.resume || !data.jobDescription}>
                        {isParsing ? <Loader2 className="animate-spin mr-2" /> : <Wand2 className="mr-2" />}
                        Parse Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
