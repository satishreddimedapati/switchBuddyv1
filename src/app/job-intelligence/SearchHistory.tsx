
'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getSearchHistory } from "@/services/market-intelligence-history";
import type { MarketIntelHistoryItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface SearchHistoryProps {
    onSelect: (item: MarketIntelHistoryItem) => void;
}

export function SearchHistory({ onSelect }: SearchHistoryProps) {
    const { user } = useAuth();
    const [history, setHistory] = useState<MarketIntelHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setHistory([]);
            setLoading(false);
            return;
        }

        async function fetchHistory() {
            setLoading(true);
            const userHistory = await getSearchHistory(user.uid);
            setHistory(userHistory);
            setLoading(false);
        }

        fetchHistory();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (history.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No search history found.</p>
    }

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map(item => (
                <div 
                    key={item.id} 
                    onClick={() => onSelect(item)}
                    className="flex justify-between items-center p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                >
                    <div>
                        <p className="font-semibold">{item.input.jobRole}</p>
                        <p className="text-sm text-muted-foreground">{item.input.companyName} - {item.input.location}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-muted-foreground" title={format(new Date(item.createdAt), 'PPP p')}>
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </p>
                        <Button variant="link" size="sm" className="h-auto p-0">View</Button>
                    </div>
                </div>
            ))}
        </div>
    )
}

