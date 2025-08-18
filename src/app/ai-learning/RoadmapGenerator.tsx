
'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Step1_Topic } from './Step1_Topic';
import { Step2_Goals } from './Step2_Goals';
import { Step3_Experience } from './Step3_Experience';
import { Step4_LearningStyle } from './Step4_LearningStyle';
import { Step5_Summary } from './Step5_Summary';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { addDays } from 'date-fns';
import type { TopicHistory, InteractiveLesson } from '@/lib/types';


export interface RoadmapInputs {
    topic: string;
    timePerDay: number;
    duration: number;
    startDate: Date;
    endDate: Date;
    learnOnWeekends: boolean;
    goals: string[];
    experienceLevel: string;
    techFocus: string[];
    learningStyle: string;
    history?: TopicHistory[];
    preferredChannel?: string;
    lessons?: Record<string, InteractiveLesson[]>;
}

const initialInputs: RoadmapInputs = {
    topic: '',
    timePerDay: 90,
    duration: 30,
    startDate: new Date(),
    endDate: addDays(new Date(), 29),
    learnOnWeekends: true,
    goals: [],
    experienceLevel: 'Beginner',
    techFocus: [],
    learningStyle: 'Video Tutorials',
    history: undefined,
    preferredChannel: undefined,
    lessons: {},
}

interface RoadmapGeneratorProps {
    onRoadmapCreated: () => void;
}

export function RoadmapGenerator({ onRoadmapCreated }: RoadmapGeneratorProps) {
    const [step, setStep] = useState(1);
    const [inputs, setInputs] = useState<RoadmapInputs>(initialInputs);

    const updateInputs = (newValues: Partial<RoadmapInputs>) => {
        setInputs(prev => ({ ...prev, ...newValues }));
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);
    
    const totalSteps = 5;
    const progress = (step / totalSteps) * 100;

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8">
            <Progress value={progress} />

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {step === 1 && <Step1_Topic data={inputs} onUpdate={updateInputs} />}
                    {step === 2 && <Step2_Goals data={inputs} onUpdate={updateInputs} />}
                    {step === 3 && <Step3_Experience data={inputs} onUpdate={updateInputs} />}
                    {step === 4 && <Step4_LearningStyle data={inputs} onUpdate={updateInputs} />}
                    {step === 5 && <Step5_Summary data={inputs} onRoadmapCreated={onRoadmapCreated} />}
                </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={prevStep} disabled={step === 1}>
                    Back
                </Button>
                 {step < 5 && (
                    <Button onClick={nextStep}>
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
}
