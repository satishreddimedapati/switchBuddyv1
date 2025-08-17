
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Coins, Gift, Lock, Star, Film, Users, Brain, Briefcase } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Mock data for a more sophisticated gamification system
const userProfile = {
    level: 5,
    levelName: "Interview Ace",
    xp: 750,
    xpToNextLevel: 1000,
    careerCoins: 280, // New: For professional rewards
    focusCoins: 95,   // New: For personal/wellness rewards
};

const achievements = [
    { id: 1, name: "First Steps", description: "Complete your first task.", unlocked: true, icon: Star },
    { id: 2, name: "Go-Getter", description: "Apply to 10 jobs.", unlocked: true, icon: Briefcase },
    { id: 3, name: "Streak Starter", description: "Maintain a 3-day streak.", unlocked: true, icon: Award },
    { id: 4, name: "The Finisher", description: "Complete your first mock interview.", unlocked: false, icon: Lock },
    { id: 5, name: "Top Performer", description: "Score 9/10+ on a mock interview.", unlocked: false, icon: Lock },
    { id: 6, name: "AI Enthusiast", description: "Use AI tools 5 times.", unlocked: false, icon: Lock },
];

// Two distinct reward lists
const careerRewards = [
    { id: 1, name: "AI Career Path Report", description: "Get a detailed report on potential career paths based on your skills.", cost: 250 },
    { id: 2, name: "LinkedIn Premium (1 Month)", description: "Unlock the full power of LinkedIn for your job search.", cost: 500 },
];

const personalRewards = [
    { id: 1, name: "Watch a Movie", description: "Take a break and enjoy a movie, guilt-free.", cost: 50 },
    { id: 2, name: "1 Hour Extra Family Time", description: "Log off early and spend quality time with loved ones.", cost: 75 },
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

            {/* Profile & Coin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Level {userProfile.level}: {userProfile.levelName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress value={xpProgress} className="h-4" />
                        <p className="text-right text-sm text-muted-foreground mt-2">{userProfile.xp} / {userProfile.xpToNextLevel} XP</p>
                    </CardContent>
                </Card>
                 <Card className="flex flex-col justify-center">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg"><Briefcase /> Career Coins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{userProfile.careerCoins} 💎</p>
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg"><Users /> Focus Coins</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{userProfile.focusCoins} 🧘</p>
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
            
            {/* Rewards Store - Differentiated */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Briefcase /> Career Rewards Store</CardTitle>
                        <CardDescription>Spend your Career Coins (💎) on professional development.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {careerRewards.map(reward => (
                            <Card key={reward.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-grow">
                                    <h3 className="font-semibold flex items-center gap-2"><Brain /> {reward.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                                </div>
                                <Button disabled={userProfile.careerCoins < reward.cost}>
                                    <Coins className="mr-2" /> Redeem for {reward.cost} 💎
                                </Button>
                            </Card>
                        ))}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> Personal & Wellness Rewards</CardTitle>
                        <CardDescription>Spend your Focus Coins (🧘) on personal well-being.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {personalRewards.map(reward => (
                            <Card key={reward.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-grow">
                                    <h3 className="font-semibold flex items-center gap-2"><Film /> {reward.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                                </div>
                                <Button disabled={userProfile.focusCoins < reward.cost}>
                                    <Coins className="mr-2" /> Redeem for {reward.cost} 🧘
                                </Button>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

    