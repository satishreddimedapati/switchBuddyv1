
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { RoadmapInputs } from './RoadmapGenerator';
import { useState } from 'react';
import { PlusCircle, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
    '.NET + Angular',
    '.NET + React',
    '.NET + Vue',
    'Backend Only (.NET)',
];

const aiTechSuggestions = ["DevOps (CI/CD)", "Cloud (Azure/AWS)", "Databases (SQL/NoSQL)"];

export function Step3_Experience({ data, onUpdate }: Step3Props) {
    const [customTech, setCustomTech] = useState('');

    const toggleTech = (tech: string) => {
        const newTechs = data.techFocus.includes(tech)
            ? data.techFocus.filter(t => t !== tech)
            : [...data.techFocus, tech];
        onUpdate({ techFocus: newTechs });
    }

    const addCustomTech = () => {
        if (customTech && !data.techFocus.includes(customTech)) {
            toggleTech(customTech);
        }
        setCustomTech('');
    }

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
                     <div className="flex flex-wrap gap-2">
                        {techFocusOptions.map(tech => (
                            <Badge
                                key={tech}
                                variant={data.techFocus.includes(tech) ? "default" : "secondary"}
                                onClick={() => toggleTech(tech)}
                                className="text-base p-3 cursor-pointer"
                            >
                               {tech}
                            </Badge>
                        ))}
                    </div>
                </div>

                <Card className="bg-muted/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2"><PlusCircle /> Add Another Tech Focus</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Enter a custom technology..."
                                value={customTech}
                                onChange={(e) => setCustomTech(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCustomTech()}
                            />
                             <button onClick={addCustomTech} className="px-3 bg-primary text-primary-foreground rounded-md text-sm font-semibold">Add</button>
                        </div>
                         <div className="flex flex-wrap gap-2 items-center">
                            <Wand2 className="h-4 w-4 text-primary" />
                            <span className="text-xs text-muted-foreground">Suggestions:</span>
                             {aiTechSuggestions.map(s => (
                                <Badge key={s} variant="outline" className="cursor-pointer" onClick={() => setCustomTech(s)}>
                                    {s}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                 {data.techFocus.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">Your Tech Focus:</h3>
                        <div className="flex flex-wrap gap-2">
                            {data.techFocus.map(tech => (
                                <Badge key={tech} variant="default" className="text-sm py-1">
                                    {tech}
                                    <button onClick={() => toggleTech(tech)} className="ml-2 text-primary-foreground/70 hover:text-primary-foreground">✕</button>
                                </Badge>
                            ))}
                        </div>
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
