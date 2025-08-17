
'use client';

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RewardsStore } from "./RewardsStore";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Focus Wallet &amp; Rewards
                </h1>
                <p className="text-muted-foreground">
                    Earn coins by completing daily tasks and redeem them for well-deserved rewards.
                </p>
            </div>
            
            {user ? (
                 <RewardsStore />
            ) : (
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent><Skeleton className="h-48 w-full" /></CardContent>
                </Card>
            )}
            
        </div>
    )
}
