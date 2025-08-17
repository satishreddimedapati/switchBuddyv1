
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TopicHistory } from "@/lib/types"
import { Loader2 } from "lucide-react";


interface TopicHistoryDisplayProps {
    history: TopicHistory[] | null;
    topic: string;
}

function HistoryCard({ item }: { item: TopicHistory }) {
    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-start gap-4">
                <span className="text-3xl mt-1">{item.emoji}</span>
                <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{item.fact}</p>
            </CardContent>
        </Card>
    );
}


export function TopicHistoryDisplay({ history, topic }: TopicHistoryDisplayProps) {
    return (
        <div className="max-w-2xl mx-auto p-4 text-center space-y-4">
            <h2 className="text-2xl font-bold">Building your roadmap for <span className="text-primary">{topic}</span>...</h2>
            <p className="text-muted-foreground">While you wait, here are some interesting facts about its history!</p>
            
            {!history ? (
                 <div className="pt-8 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Fetching interesting facts...</p>
                </div>
            ) : (
                <div className="space-y-4 pt-4">
                    {history.map((item, index) => (
                        <HistoryCard key={index} item={item} />
                    ))}
                </div>
            )}

            <div className="pt-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Your roadmap is being generated in the background...</p>
            </div>
        </div>
    )
}
