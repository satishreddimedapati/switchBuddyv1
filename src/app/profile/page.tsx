
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Coins, Gift, Lock, Star } from "lucide-react";

// Mock data - in a real app, this would come from a user profile service
const userProfile = {
    level: 5,
    levelName: "Interview Ace",
    xp: 750,
    xpToNextLevel: 1000,
    coins: 450,
};

const achievements = [
    { id: 1, name: "First Steps", description: "Complete your first task.", unlocked: true, icon: Star },
    { id: 2, name: "Go-Getter", description: "Apply to 10 jobs.", unlocked: true, icon: Award },
    { id: 3, name: "Streak Starter", description: "Maintain a 3-day streak.", unlocked: true, icon: Award },
    { id: 4, name: "The Finisher", description: "Complete your first mock interview.", unlocked: false, icon: Lock },
    { id: 5, name: "Top Performer", description: "Score 9/10+ on a mock interview.", unlocked: false, icon: Lock },
    { id: 6, name: "AI Enthusiast", description: "Use AI tools 5 times.", unlocked: false, icon: Lock },
];

const rewards = [
    { id: 1, name: "AI LinkedIn Profile Review", description: "Get a detailed, AI-powered review of your LinkedIn profile to optimize it for recruiters.", cost: 150 },
    { id: 2, name: "Unlock 'Cyberpunk' Theme", description: "Give your dashboard a cool, futuristic new look.", cost: 50 },
    { id: 3, name: "AI Career Path Report", description: "Get a detailed report on potential career paths based on your skills.", cost: 250 },
];

export default function ProfilePage() {
    const xpProgress = (userProfile.xp / userProfile.xpToNextLevel) * 100;

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Profile & Rewards
                </h1>
                <p className="text-muted-foreground">
                    Track your progress, view achievements, and redeem rewards.
                </p>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Level {userProfile.level}: {userProfile.levelName}</CardTitle>
                        <CardDescription>Keep completing tasks to level up!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Progress value={xpProgress} className="h-4" />
                        <p className="text-right text-sm text-muted-foreground mt-2">{userProfile.xp} / {userProfile.xpToNextLevel} XP</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Coins /> Your Coins</CardTitle>
                        <CardDescription>Earned from tasks and achievements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{userProfile.coins}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Achievements */}
            <Card>
                <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                    <CardDescription>Your trophy case of accomplishments.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {achievements.map(ach => {
                        const Icon = ach.icon;
                        return (
                            <Card key={ach.id} className={`p-4 flex flex-col items-center justify-center text-center gap-2 ${!ach.unlocked ? 'bg-muted/50 text-muted-foreground' : ''}`}>
                                <Icon className={`h-10 w-10 ${ach.unlocked ? 'text-primary' : ''}`} />
                                <p className="font-semibold text-sm">{ach.name}</p>
                                <p className="text-xs">{ach.description}</p>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
            
            {/* Rewards Store */}
            <Card>
                <CardHeader>
                    <CardTitle>Rewards Store</CardTitle>
                    <CardDescription>Spend your hard-earned coins on valuable rewards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {rewards.map(reward => (
                        <Card key={reward.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-grow">
                                <h3 className="font-semibold flex items-center gap-2"><Gift /> {reward.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                            </div>
                            <Button disabled={userProfile.coins < reward.cost}>
                                <Coins className="mr-2" /> Redeem for {reward.cost}
                            </Button>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
