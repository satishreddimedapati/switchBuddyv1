
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, where, serverTimestamp, writeBatch } from "firebase/firestore";
import type { DailyTask } from "@/lib/types";
import { calculateDayActivity } from "@/app/profile/utils";
import type { Reward, UserReward } from "@/lib/rewards";

export async function getFocusCoinBalance(userId: string): Promise<number> {
    if (!userId) return 0;

    const tasksCollection = collection(db, "daily_tasks");
    const q = query(tasksCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const allTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));

    const groupedByDate = allTasks.reduce((acc, task) => {
        const date = task.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(task);
        return acc;
    }, {} as Record<string, DailyTask[]>);

    const totalNetChange = Object.values(groupedByDate).reduce((total, tasksForDay) => {
        const dayActivity = calculateDayActivity(tasksForDay, allTasks);
        return total + dayActivity.netChange;
    }, 0);

    const redeemedRewards = await getUserRewards(userId);
    const totalCostOfRedeemed = redeemedRewards.reduce((total, reward) => total + reward.cost, 0);

    return totalNetChange - totalCostOfRedeemed;
}

export async function getUserRewards(userId: string): Promise<UserReward[]> {
    if (!userId) return [];
    const rewardsCollection = collection(db, 'redeemed_rewards');
    const q = query(rewardsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReward));
}

export async function redeemReward(userId: string, reward: Reward): Promise<void> {
    if (!userId) throw new Error("User not authenticated.");

    const currentBalance = await getFocusCoinBalance(userId);
    if (currentBalance < reward.cost) {
        throw new Error("Insufficient funds.");
    }
    
    const rewardsCollection = collection(db, "redeemed_rewards");
    await addDoc(rewardsCollection, {
        userId,
        rewardId: reward.id,
        name: reward.name,
        description: reward.description,
        icon: reward.icon,
        cost: reward.cost,
        status: 'unclaimed',
        redeemedAt: serverTimestamp(),
    });
}


export async function claimReward(userId: string, userRewardId: string): Promise<void> {
    if (!userId) throw new Error("User not authenticated.");

    const rewardRef = doc(db, "redeemed_rewards", userRewardId);
    await updateDoc(rewardRef, {
        status: 'claimed',
        claimedAt: serverTimestamp(),
    });
}
