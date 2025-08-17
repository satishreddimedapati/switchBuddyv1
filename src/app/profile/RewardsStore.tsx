
'use client';

import { useState } from "react";
import { REWARD_CATEGORIES, Reward, RewardCategory } from "@/lib/rewards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Coins, CheckCircle, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function RewardsStore() {
    // In a real app, this would come from the user's profile/db
    const [focusCoins, setFocusCoins] = useState(95); 
    const [redeemedRewards, setRedeemedRewards] = useState<Reward[]>([]);
    const { toast } = useToast();

    const handleRedeem = (reward: Reward) => {
        if (focusCoins >= reward.cost) {
            setFocusCoins(prev => prev - reward.cost);
            setRedeemedRewards(prev => [...prev, reward]);
            toast({
                title: "Reward Unlocked!",
                description: `You've redeemed "${reward.name}".`,
            });
        } else {
            toast({
                title: "Not enough coins",
                description: `You need ${reward.cost - focusCoins} more coins to unlock this.`,
                variant: "destructive",
            });
        }
    };

    const isRedeemed = (rewardId: number) => redeemedRewards.some(r => r.id === rewardId);

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
                                                        disabled={isRedeemed(reward.id)}
                                                    >
                                                        {isRedeemed(reward.id) ? (
                                                            <><CheckCircle className="mr-2"/> Claimed</>
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
                </CardContent>
            </Card>
        </div>
    );
}
