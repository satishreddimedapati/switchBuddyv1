
'use client';

import type { UserReward } from '@/lib/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';

interface PurchasedRewardsSummaryProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    rewards: UserReward[];
}

export function PurchasedRewardsSummary({ isOpen, onOpenChange, rewards }: PurchasedRewardsSummaryProps) {
    
    const sortedRewards = [...rewards].sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Purchase History</DialogTitle>
                    <DialogDescription>
                        A summary of rewards you have purchased in the selected time period.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                    <div className="pr-4 space-y-2">
                        {sortedRewards.length > 0 ? (
                             sortedRewards.map(reward => (
                                <Card key={reward.id} className="p-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{reward.icon} {reward.name}</p>
                                            <p className="text-xs text-muted-foreground">{format(new Date(reward.redeemedAt), "MMM d, yyyy 'at' p")}</p>
                                        </div>
                                        <Badge variant="secondary">-{reward.cost} 🧘</Badge>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-10 border rounded-lg border-dashed">
                                <p className="text-muted-foreground">No purchases in this period.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

    