
'use client';

import { useState, useEffect, useCallback } from "react";
import { REWARD_CATEGORIES, Reward, UserReward } from "@/lib/rewards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Coins, CheckCircle, Gift, Trophy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getUserRewards, redeemReward, claimReward, getFocusCoinBalance } from "@/services/user-rewards";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function RewardsStore() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [focusCoins, setFocusCoins] = useState(0);
    const [userRewards, setUserRewards] = useState<UserReward[]>([]);
    const [isInteracting, setIsInteracting] = useState(false);

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        setIsInteracting(true);
        try {
            const [balance, rewards] = await Promise.all([
                getFocusCoinBalance(user.uid),
                getUserRewards(user.uid),
            ]);
            setFocusCoins(balance);
            rewards.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
            setUserRewards(rewards);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            toast({ title: "Error", description: "Could not load your rewards data.", variant: "destructive" });
        } finally {
            setIsInteracting(false);
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleRedeem = async (reward: Reward) => {
        if (!user) return;
        setIsInteracting(true);
        if (focusCoins >= reward.cost) {
            try {
                await redeemReward(user.uid, reward);
                toast({
                    title: "Reward Unlocked!",
                    description: `You've redeemed "${reward.name}".`,
                });
                await fetchUserData();
            } catch (error) {
                 toast({ title: "Error", description: "Failed to redeem reward.", variant: "destructive" });
                 setIsInteracting(false);
            }
        } else {
            toast({
                title: "Not enough coins",
                description: `You need ${reward.cost - focusCoins} more coins to unlock this.`,
                variant: "destructive",
            });
            setIsInteracting(false);
        }
    };

    const handleClaim = async (userRewardId: string) => {
        if (!user) return;
        setIsInteracting(true);
        try {
            await claimReward(user.uid, userRewardId);
             toast({
                title: "Reward Claimed!",
                description: "Enjoy your well-deserved break.",
            });
            await fetchUserData();
        } catch (error) {
             toast({ title: "Error", description: "Failed to claim reward.", variant: "destructive" });
             setIsInteracting(false);
        }
    };

    const isRedeemed = (rewardId: number) => userRewards.some(r => r.rewardId === rewardId);

    if (loading) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    return (
        <Accordion type="multiple" defaultValue={['rewards-store', 'rewards-history']} className="w-full space-y-4">
            <AccordionItem value="rewards-store">
                 <Card>
                    <AccordionTrigger className="p-6 hover:no-underline">
                         <CardHeader className="p-0 text-left">
                            <CardTitle className="flex items-center gap-2">
                                <Gift /> Reward Store
                            </CardTitle>
                            <CardDescription>
                                Your current balance is <span className="font-bold text-primary">{focusCoins} Focus Coins (🧘)</span>.
                            </CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                         <Accordion type="multiple" defaultValue={['cat-0']} className="w-full space-y-4">
                            {REWARD_CATEGORIES.map((category, index) => (
                                <AccordionItem value={`cat-${index}`} key={category.title}>
                                    <Card>
                                        <AccordionTrigger className="p-4 hover:no-underline text-left">
                                            <div className="flex flex-col">
                                                <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: category.color }}>{category.title}</h3>
                                                <p className="text-sm text-muted-foreground font-normal">{category.description}</p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-4 pt-0">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {category.rewards.map(reward => (
                                                    <Card key={reward.id} className={cn("p-4 flex flex-col justify-between", isRedeemed(reward.id) && "bg-green-50 dark:bg-green-900/20")}>
                                                        <div>
                                                            <h4 className="font-semibold">{reward.icon} {reward.name}</h4>
                                                            <p className="text-xs text-muted-foreground mt-1">{reward.description}</p>
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            className="mt-4 w-full"
                                                            onClick={() => handleRedeem(reward)}
                                                            disabled={isInteracting || isRedeemed(reward.id) || focusCoins < reward.cost}
                                                        >
                                                            {isInteracting && <Loader2 className="mr-2 animate-spin" />}
                                                            {isRedeemed(reward.id) ? (
                                                                <><CheckCircle className="mr-2"/> Unlocked</>
                                                            ) : (
                                                                <><Coins className="mr-2" /> Redeem for {reward.cost} 🧘</>
                                                            )}
                                                        </Button>
                                                    </Card>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </Card>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </AccordionContent>
                 </Card>
            </AccordionItem>
            
            <AccordionItem value="rewards-history">
                 <Card>
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <CardHeader className="p-0 text-left">
                             <CardTitle className="flex items-center gap-2">
                                <Trophy /> My Rewards History
                            </CardTitle>
                            <CardDescription>A log of all your unlocked and claimed rewards.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                        {userRewards.length > 0 ? (
                            <div className="space-y-2">
                                {userRewards.map(reward => (
                                    <Card key={reward.id} className={cn("p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", reward.status === 'claimed' && "bg-muted/50 text-muted-foreground")}>
                                        <div className="flex-grow">
                                            <h4 className={cn("font-semibold", reward.status === 'claimed' && "text-muted-foreground")}>{reward.icon} {reward.name}</h4>
                                            <p className="text-sm">{reward.description}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <Badge variant="outline">Cost: {reward.cost} 🧘</Badge>
                                                <Badge variant="outline">Redeemed: {format(new Date(reward.redeemedAt), "MMM d, yyyy")}</Badge>
                                            </div>
                                        </div>
                                        {reward.status === 'unclaimed' ? (
                                            <Button variant="secondary" onClick={() => handleClaim(reward.id)} disabled={isInteracting} className="w-full sm:w-auto">
                                                {isInteracting && <Loader2 className="mr-2 animate-spin" />}
                                                <CheckCircle className="mr-2" /> Mark as Claimed
                                            </Button>
                                        ) : (
                                            <div className="text-center sm:text-right">
                                                <Badge variant="outline">Claimed</Badge>
                                                {reward.claimedAt && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        on {format(new Date(reward.claimedAt), "MMM d, yyyy")}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border rounded-lg border-dashed">
                                <p className="text-muted-foreground">You have no rewards yet. Redeem one from the store above!</p>
                            </div>
                        )}
                    </AccordionContent>
                 </Card>
            </AccordionItem>
        </Accordion>
    );
}
