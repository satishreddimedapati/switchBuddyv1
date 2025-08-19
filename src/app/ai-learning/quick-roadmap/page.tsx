
'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Step1_BasicInfo } from './Step1_BasicInfo';
import { Step2_AdvancedInfo } from './Step2_AdvancedInfo';
import { Step3_Chatbot } from './Step3_Chatbot';
import { Step4_Finalize } from './Step4_Finalize';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { addDays, format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LearningRoadmap } from '@/lib/types';

export interface QuickRoadmapInputs {
    interviewDate: Date;
    daysToPrepare: number;
    advancedMode: boolean;
    resume?: string;
    jobDescription?: string;
    selfAssessment?: string;
    company: string;
    role: string;
    techStack: string[];
}

const initialInputs: QuickRoadmapInputs = {
    interviewDate: addDays(new Date(), 7),
    daysToPrepare: 7,
    advancedMode: false,
    company: '',
    role: '',
    techStack: [],
}

export default function QuickRoadmapPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [inputs, setInputs] = useState<QuickRoadmapInputs>(initialInputs);
    const [generatedRoadmap, setGeneratedRoadmap] = useState<LearningRoadmap | null>(null);

    const updateInputs = useCallback((newValues: Partial<QuickRoadmapInputs>) => {
        setInputs(prev => ({ ...prev, ...newValues }));
    }, []);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    const handleNext = () => {
        if (step === 1 && !inputs.advancedMode) {
            setStep(4); // Skip to Finalize step
        } else {
            nextStep();
        }
    }

    const handleBack = () => {
         if (step === 4 && !inputs.advancedMode) {
            setStep(1); // Go back to first step
        } else {
            prevStep();
        }
    }

    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;

    if (generatedRoadmap) {
        // This part would ideally show the roadmap, but for now we'll just log it
        // and redirect or show a success message.
        // For now, let's assume we want to view it on the main AI learning page.
        // A better approach would be a dedicated view for this roadmap.
        console.log("Roadmap generated:", generatedRoadmap);
        return <div>Roadmap has been generated and saved!</div>
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/ai-learning')}>
                    <ArrowLeft />
                </Button>
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        Quick Interview Roadmap
                    </h1>
                    <p className="text-muted-foreground">
                        Generate a focused, short-term prep plan for your upcoming interview.
                    </p>
                </div>
            </div>
        
            <div className="max-w-4xl mx-auto p-4 space-y-8 w-full">
                <Progress value={progress} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {step === 1 && <Step1_BasicInfo data={inputs} onUpdate={updateInputs} />}
                        {step === 2 && inputs.advancedMode && <Step2_AdvancedInfo data={inputs} onUpdate={updateInputs} />}
                        {step === 3 && inputs.advancedMode && <Step3_Chatbot data={inputs} onUpdate={updateInputs} />}
                        {step === 4 && <Step4_Finalize data={inputs} onUpdate={updateInputs} setGeneratedRoadmap={setGeneratedRoadmap} />}
                    </motion.div>
                </AnimatePresence>

                <div className="flex justify-between items-center">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                        Back
                    </Button>
                    {step < 4 && (
                        <Button onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
