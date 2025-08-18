
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Video, BookOpen, MessageSquare, TestTube2, Loader2, Wand2 } from 'lucide-react';
import type { RoadmapInputs } from './RoadmapGenerator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState, useTransition, useEffect } from 'react';
import { generateChannelSuggestions } from '@/ai/flows/generate-channel-suggestions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface Step4Props {
    data: RoadmapInputs;
    onUpdate: (updates: Partial<RoadmapInputs>) => void;
}

const learningStyles = [
    { id: 'Video Tutorials', icon: Video, description: 'Guided lessons from platforms like YouTube and Udemy.' },
    { id: 'Article', icon: BookOpen, description: 'Learn from official documentation and articles.' },
    { id: 'Chat Lessons', icon: MessageSquare, description: 'Bite-sized, conversational lessons from an AI tutor.' },
    { id: 'Interactive Tutorial', icon: TestTube2, description: 'Short videos paired with mini coding challenges.' },
];

export function Step4_LearningStyle({ data, onUpdate }: Step4Props) {
    const [isSuggesting, startSuggestionTransition] = useTransition();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    useEffect(() => {
        if (data.learningStyle === 'Video Tutorials' && data.topic) {
            startSuggestionTransition(async () => {
                const result = await generateChannelSuggestions({ topic: data.topic });
                if (result?.channels) {
                    setSuggestions(result.channels);
                }
            });
        } else {
            // Clear suggestions and selection if style changes
            setSuggestions([]);
            if(data.preferredChannel) {
                onUpdate({ preferredChannel: undefined });
            }
        }
    }, [data.learningStyle, data.topic]);

    const handleStyleChange = (value: string) => {
        if (value) {
            onUpdate({ learningStyle: value });
        }
    }

    const handleChannelToggle = (channel: string) => {
        onUpdate({ preferredChannel: data.preferredChannel === channel ? undefined : channel });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>How Do You Learn Best?</CardTitle>
                <CardDescription>Select your preferred style to get the right kind of content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ToggleGroup
                    type="single"
                    value={data.learningStyle}
                    onValueChange={handleStyleChange}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {learningStyles.map(style => (
                        <ToggleGroupItem 
                            key={style.id}
                            value={style.id}
                            className="h-auto p-0"
                            asChild
                        >
                            <Card className={cn(
                                "p-4 cursor-pointer transition-all w-full",
                                data.learningStyle === style.id && "ring-2 ring-primary bg-primary/10"
                            )}>
                                <div className="flex items-center gap-4">
                                    <style.icon className="h-8 w-8 text-primary" />
                                    <div>
                                        <h3 className="font-semibold text-left">{style.title}</h3>
                                        <p className="text-xs text-muted-foreground text-left font-normal">{style.description}</p>
                                    </div>
                                </div>
                            </Card>
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>

                {data.learningStyle === 'Video Tutorials' && (
                    <Card className="bg-muted/50">
                        <CardHeader>
                             <CardTitle className="text-base flex items-center gap-2">
                                {isSuggesting ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                Tune into a Channel
                             </CardTitle>
                            <CardDescription>
                                We've suggested some top YouTube channels for <span className="font-bold text-foreground">{data.topic}</span>. Pick one to focus your video searches.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isSuggesting ? (
                                 <p className="text-sm text-muted-foreground">Getting suggestions...</p>
                            ) : (
                                suggestions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map(channel => (
                                            <Badge
                                                key={channel}
                                                variant={data.preferredChannel === channel ? 'default' : 'secondary'}
                                                onClick={() => handleChannelToggle(channel)}
                                                className="text-base p-2 cursor-pointer"
                                            >
                                                {channel}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                     <p className="text-sm text-muted-foreground">Couldn't find specific channels, but we'll still search YouTube for you.</p>
                                )
                            )}
                             {data.preferredChannel && (
                                <Alert className="mt-4">
                                    <AlertDescription>
                                        Great! Your video links will be automatically tuned to the <span className="font-bold">{data.preferredChannel}</span> channel.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    );
}
