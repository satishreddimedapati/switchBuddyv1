
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { RoadmapInputs } from './RoadmapGenerator';
import { cn } from '@/lib/utils';

interface Step3Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

const experienceLevels = [
    { id: 'Beginner', label: '🔰 Beginner' },
    { id: 'Intermediate', label: '🛠️ Intermediate' },
    { id: 'Advanced', label: '🚀 Advanced' },
];

const techFocusOptions = [
    { id: '.NET + Angular', label: '.NET + Angular' },
    { id: '.NET + React', label: '.NET + React' },
    { id: '.NET + Vue', label: '.NET + Vue' },
    { id: 'Backend Only (.NET)', label: 'Backend Only (.NET)' },
];

export function Step3_Experience({ data, onUpdate }: Step3Props) {
    const handleTechFocusChange = (value: string[]) => {
        onUpdate({ techFocus: value });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Current Skill Level</CardTitle>
                <CardDescription>Be honest! This helps create a plan that's challenging but not overwhelming.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Experience Level</h3>
                    <ToggleGroup
                        type="single"
                        value={data.experienceLevel}
                        onValueChange={(value) => value && onUpdate({ experienceLevel: value })}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                    >
                        {experienceLevels.map(level => (
                            <ToggleGroupItem key={level.id} value={level.id} className="w-full h-12">
                                {level.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Technology Focus (if applicable)</h3>
                     <ToggleGroup
                        type="multiple"
                        value={data.techFocus}
                        onValueChange={handleTechFocusChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                    >
                        {techFocusOptions.map(tech => (
                            <ToggleGroupItem key={tech.id} value={tech.id} className="w-full h-12">
                                {tech.label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            </CardContent>
        </Card>
    );
}

