

'use server';

import { db } from "@/lib/firebase";
import type { DailyTask, UserReward } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { format, subDays, isBefore } from "date-fns";
import { calculateDayActivity } from "@/app/daily-tracker/utils";

const dailyTasksCollection = collection(db, "daily_tasks");

export async function getTasksForDate(date: string, userId: string): Promise<DailyTask[]> {
  if (!userId) return [];

  try {
    // This query is simplified by fetching all tasks and filtering in code.
    const allTasks = await getTasksForUser(userId);
    return allTasks.filter(task => task.date === date);
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


export async function getTasksForWeek(startDate: string, endDate: string, userId: string): Promise<DailyTask[]> {
  if (!userId) return [];

  try {
    const q = query(dailyTasksCollection, where("userId", "==", userId), where("date", ">=", startDate), where("date", "<=", endDate));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DailyTask));
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

// This function is no longer user-specific and should be used with caution
export async function getSampleDailyTasks(date: string): Promise<DailyTask[]> {
  if (date === format(new Date(), 'yyyy-MM-dd')) {
    return [
      { id: 'task1', time: '09:00', title: 'Update resume with latest project', description: 'Focus on the new React project.', type: 'schedule', date, completed: true, userId: 'sample' },
      { id: 'task2', time: '11:00', title: 'Apply to 3 new jobs', description: 'Look for remote-first companies.', type: 'schedule', date, completed: true, userId: 'sample' },
      { id: 'task3', time: '14:00', title: 'Interview with Acme Corp', description: 'Technical interview with the engineering team.', type: 'interview', date, completed: false, userId: 'sample' },
      { id: 'task4', time: '16:00', title: 'Practice STAR method for interviews', type: 'schedule', date, completed: false, userId: 'sample' },
      { id: 'task5', time: '18:30', title: 'Connect with 1 new person on LinkedIn', type: 'schedule', date, completed: true, userId: 'sample' },
    ];
  }
  return [];
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
