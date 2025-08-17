'use client';

import { useState, useEffect, useCallback } from "react";
import { REWARD_CATEGORIES, Reward, UserReward } from "@/lib/rewards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Coins, CheckCircle, Gift, Trophy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { getUserRewards, redeemReward, claimReward, getFocusCoinBalance } from "@/services/user-rewards";
import { Skeleton } from "@/components/ui/skeleton";

export function RewardsStore() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [focusCoins, setFocusCoins] = useState(0);
    const [userRewards, setUserRewards] = useState<UserReward[]>([]);

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [balance, rewards] = await Promise.all([
                getFocusCoinBalance(user.uid),
                getUserRewards(user.uid),
            ]);
            setFocusCoins(balance);
            setUserRewards(rewards);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            toast({ title: "Error", description: "Could not load your rewards data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleRedeem = async (reward: Reward) => {
        if (!user) return;
        if (focusCoins >= reward.cost) {
            try {
                await redeemReward(user.uid, reward);
                toast({
                    title: "Reward Unlocked!",
                    description: `You've redeemed "${reward.name}".`,
                });
                await fetchUserData(); // Refresh data
            } catch (error) {
                 toast({ title: "Error", description: "Failed to redeem reward.", variant: "destructive" });
            }
        } else {
            toast({
                title: "Not enough coins",
                description: `You need ${reward.cost - focusCoins} more coins to unlock this.`,
                variant: "destructive",
            });
        }
    };

    const handleClaim = async (userRewardId: string) => {
        if (!user) return;
        try {
            await claimReward(user.uid, userRewardId);
             toast({
                title: "Reward Claimed!",
                description: "Enjoy your well-deserved break.",
            });
            await fetchUserData(); // Refresh data
        } catch (error) {
             toast({ title: "Error", description: "Failed to claim reward.", variant: "destructive" });
        }
    };

    const isRedeemed = (rewardId: number) => userRewards.some(r => r.rewardId === rewardId && r.status === 'unclaimed');
    const unclaimedRewards = userRewards.filter(r => r.status === 'unclaimed');

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift /> Focus Wallet & Reward Store
                    </CardTitle>
                    <CardDescription>
                        Your current balance is <span className="font-bold text-primary">{focusCoins} Focus Coins (🧘)</span>. Use them to unlock rewards!
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                                        disabled={isRedeemed(reward.id) || focusCoins < reward.cost}
                                                    >
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

                    <Separator className="my-6" />

                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <Trophy /> My Unclaimed Rewards
                        </h3>
                        {unclaimedRewards.length > 0 ? (
                            <div className="space-y-2">
                                {unclaimedRewards.map(reward => (
                                    <Card key={reward.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold">{reward.icon} {reward.name}</h4>
                                            <p className="text-sm text-muted-foreground">{reward.description}</p>
                                        </div>
                                        <Button variant="secondary" onClick={() => handleClaim(reward.id)}>
                                            <CheckCircle className="mr-2" /> Mark as Claimed
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border rounded-lg border-dashed">
                                <p className="text-muted-foreground">You have no unclaimed rewards. Redeem one from the store above!</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
