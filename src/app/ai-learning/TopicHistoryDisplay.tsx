
'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import type { TopicHistory } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";


interface TopicHistoryDisplayProps {
    history: TopicHistory[] | null;
    topic: string;
}

function HistoryCard({ item }: { item: TopicHistory }) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-6 h-full min-h-80 bg-muted/50 rounded-lg">
            <div className="text-5xl mb-4">{item.emoji}</div>
            <h3 className="text-xl font-bold">{item.title}</h3>
            <p className="text-muted-foreground mt-2">{item.fact}</p>
        </div>
    );
}


export function TopicHistoryDisplay({ history, topic }: TopicHistoryDisplayProps) {
    return (
        <div className="max-w-4xl mx-auto p-4 text-center space-y-4">
            <h2 className="text-2xl font-bold">Building your roadmap for <span className="text-primary">{topic}</span>...</h2>
            <p className="text-muted-foreground">While you wait, here are some interesting facts about its history!</p>
            
            {!history ? (
                 <div className="pt-8 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Fetching interesting facts...</p>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        <Carousel className="w-full" opts={{ loop: true }}>
                            <CarouselContent className="-ml-4">
                                {history.map((item, index) => (
                                    <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                        <div className="p-1">
                                            <HistoryCard item={item} />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="hidden sm:flex" />
                            <CarouselNext className="hidden sm:flex" />
                        </Carousel>
                    </CardContent>
                </Card>
            )}

            <div className="pt-8 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Your roadmap is being generated in the background...</p>
            </div>
        </div>
    )
}
