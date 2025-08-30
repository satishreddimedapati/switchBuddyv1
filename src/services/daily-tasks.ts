

'use server';

import { db } from "@/lib/firebase";
import type { DailyTask } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { isWithinInterval, format } from "date-fns";

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

export async function getTasksForDateRange(startDate: Date, endDate: Date, userId: string): Promise<DailyTask[]> {
  if (!userId) return [];
  try {
    const q = query(
        dailyTasksCollection, 
        where("userId", "==", userId),
        where("date", ">=", format(startDate, 'yyyy-MM-dd')),
        where("date", "<=", format(endDate, 'yyyy-MM-dd')),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
  } catch (error) {
    console.error("Error fetching tasks for date range. This may require a composite index in Firestore.", error);
    // Fallback for production environments without the index
    console.warn("Falling back to fetching all tasks for the user due to a query error.");
    return getTasksForUserAndFilterByDate(startDate, endDate, userId);
  }
}


async function getTasksForUserAndFilterByDate(startDate: Date, endDate: Date, userId: string): Promise<DailyTask[]> {
    if (!userId) return [];
    try {
        const q = query(dailyTasksCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const allTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
        
        return allTasks.filter(task => {
            try {
                const taskDate = new Date(task.date);
                return isWithinInterval(taskDate, { start: startDate, end: endDate });
            } catch (e) {
                return false; // Invalid date format in task
            }
        });

    } catch (error) {
        console.error("Error fetching all tasks for user:", error);
        throw new Error("Failed to fetch user tasks.");
    }
}


export async function getTasksForWeek(startDate: Date, endDate: Date, userId: string): Promise<DailyTask[]> {
  return getTasksForDateRange(startDate, endDate, userId);
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
