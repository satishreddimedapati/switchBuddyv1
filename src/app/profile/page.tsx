
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Briefcase, Lock, Star } from "lucide-react";
import { RewardsStore } from "./RewardsStore";

// Mock data for a more sophisticated gamification system
const userProfile = {
    level: 5,
    levelName: "Interview Ace",
    xp: 750,
    xpToNextLevel: 1000,
    // The coin balance will now be managed inside the RewardsStore
};

const achievements = [
    { id: 1, name: "First Steps", description: "Complete your first task.", unlocked: true, icon: Star },
    { id: 2, name: "Go-Getter", description: "Apply to 10 jobs.", unlocked: true, icon: Briefcase },
    { id: 3, name: "Streak Starter", description: "Maintain a 3-day streak.", unlocked: true, icon: Award },
    { id: 4, name: "The Finisher", description: "Complete your first mock interview.", unlocked: false, icon: Lock },
    { id: 5, name: "Top Performer", description: "Score 9/10+ on a mock interview.", unlocked: false, icon: Lock },
    { id: 6, name: "AI Enthusiast", description: "Use AI tools 5 times.", unlocked: false, icon: Lock },
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

            <Card>
                <CardHeader>
                    <CardTitle>Level {userProfile.level}: {userProfile.levelName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Progress value={xpProgress} className="h-4" />
                    <p className="text-right text-sm text-muted-foreground mt-2">{userProfile.xp} / {userProfile.xpToNextLevel} XP</p>
                </CardContent>
            </Card>

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
            
            <RewardsStore />
            
        </div>
    )
}
