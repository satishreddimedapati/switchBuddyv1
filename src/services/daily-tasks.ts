

'use server';

import { db } from "@/lib/firebase";
import type { DailyTask, UserReward } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { format, subDays, isBefore, isWithinInterval } from "date-fns";
import { calculateDayActivity } from "@/app/daily-tracker/utils";

const dailyTasksCollection = collection(db, "daily_tasks");

export async function getTasksForDate(date: string, userId: string): Promise<DailyTask[]> {
  if (!userId) return [];

  try {
    const q = query(dailyTasksCollection, where("userId", "==", userId), where("date", "==", date));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
  } catch (error) {
    console.error("Error fetching tasks for date: ", error);
    return [];
  }
}

async function getTasksForUser(userId: string): Promise<DailyTask[]> {
    if (!userId) return [];
    try {
        const q = query(dailyTasksCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
    } catch (error) {
        console.error("Error fetching all tasks for user:", error);
        throw new Error("Failed to fetch user tasks.");
    }
}


export async function getTasksForWeek(startDate: Date, endDate: Date, userId: string): Promise<DailyTask[]> {
  if (!userId) return [];

  try {
    // Fetch all tasks for the user and filter in code to avoid composite index
    const allTasks = await getTasksForUser(userId);
    const weeklyTasks = allTasks.filter(task => {
        const taskDate = new Date(task.date);
        return isWithinInterval(taskDate, { start: startDate, end: endDate });
    });
    return weeklyTasks;
  } catch (error) {
    console.error("Error fetching tasks for week: ", error);
    return [];
  }
}

export async function updateTask(taskId: string, updates: Partial<Omit<DailyTask, 'id'>>, userId: string) {
  if (!userId) throw new Error("Authentication required");
  const taskRef = doc(db, "daily_tasks", taskId);
  // In a real app, you'd check ownership here.
  await updateDoc(taskRef, updates);
}

export async function addTask(task: Omit<DailyTask, 'id'>, userId: string) {
    if (!userId) throw new Error("Authentication required");

    const taskWithUser = { ...task, userId };
    const docRef = await addDoc(dailyTasksCollection, taskWithUser);
    return docRef.id;
}

export async function deleteTask(taskId: string, userId: string) {
    if (!userId) throw new Error("Authentication required");
     // In a real app, you'd check ownership here.
    await deleteDoc(doc(db, "daily_tasks", taskId));
}


export async function getFocusCoinBalance(userId: string): Promise<number> {
    if (!userId) return 0;

    const tasksCollection = collection(db, "daily_tasks");
    const tasksQuery = query(tasksCollection, where("userId", "==", userId));
    
    const rewardsCollection = collection(db, "redeemed_rewards");
    const rewardsQuery = query(rewardsCollection, where("userId", "==", userId));

    const [tasksSnapshot, rewardsSnapshot] = await Promise.all([
        getDocs(tasksQuery),
        getDocs(rewardsQuery)
    ]);
    
    const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
    const allRewards = rewardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserReward));


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

    const totalCostOfRedeemed = allRewards.reduce((total, reward) => total + reward.cost, 0);

    return totalNetChange - totalCostOfRedeemed;
}
