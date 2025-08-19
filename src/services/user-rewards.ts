
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, addDoc, query, where, serverTimestamp, writeBatch } from "firebase/firestore";
import type { DailyTask } from "@/lib/types";
import { calculateDayActivity } from "@/app/profile/utils";
import type { Reward, UserReward } from "@/lib/rewards";
import { toSerializableUserReward } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

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
    
    const redeemedRewards = await getUserRewards(userId);

    const rewardsGroupedByDate = redeemedRewards.reduce((acc, reward) => {
        const date = new Date(reward.redeemedAt).toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(reward);
        return acc;
    }, {} as Record<string, UserReward[]>);

    const allDates = [...Object.keys(groupedByDate), ...Object.keys(rewardsGroupedByDate)];
    const uniqueDates = [...new Set(allDates)];

    const totalNetChange = uniqueDates.reduce((total, date) => {
        const tasksForDay = groupedByDate[date] || [];
        const rewardsForDay = rewardsGroupedByDate[date] || [];
        const dayActivity = calculateDayActivity(tasksForDay, allTasks, rewardsForDay);
        return total + dayActivity.netChange;
    }, 0);
    
    return totalNetChange;
}

export async function getUserRewards(userId: string): Promise<UserReward[]> {
    if (!userId) return [];
    const rewardsCollection = collection(db, "redeemed_rewards");
    const q = query(rewardsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => toSerializableUserReward({ id: doc.id, ...doc.data() }));
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

    

    
