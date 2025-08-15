'use server';

import { db } from "@/lib/firebase";
import type { DailyTask } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { format } from "date-fns";

const dailyTasksCollection = collection(db, "daily_tasks");

export async function getTasksForDate(date: string): Promise<DailyTask[]> {
  try {
    const q = query(dailyTasksCollection, where("date", "==", date));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return [];
    }
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DailyTask));
  } catch (error) {
    console.error("Error fetching tasks for date: ", error);
    return getSampleDailyTasks(date);
  }
}

export async function getTasksForWeek(startDate: string, endDate: string): Promise<DailyTask[]> {
   try {
    const q = query(dailyTasksCollection, where("date", ">=", startDate), where("date", "<=", endDate));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return [];
    }
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as DailyTask));
  } catch (error) {
    console.error("Error fetching tasks for week: ", error);
    // Return empty array on error for weekly view
    return [];
  }
}


export async function updateTask(taskId: string, updates: Partial<Omit<DailyTask, 'id'>>) {
  const taskRef = doc(db, "daily_tasks", taskId);
  await updateDoc(taskRef, updates);
}

export async function addTask(task: Omit<DailyTask, 'id'>) {
    const docRef = await addDoc(dailyTasksCollection, task);
    return docRef.id;
}

export async function deleteTask(taskId: string) {
    await deleteDoc(doc(db, "daily_tasks", taskId));
}

// Sample data to be used when the database is empty or inaccessible.
export async function getSampleDailyTasks(date: string): Promise<DailyTask[]> {
  if (date === format(new Date(), 'yyyy-MM-dd')) {
    return [
      { id: 'task1', time: '09:00', title: 'Update resume with latest project', description: 'Focus on the new React project.', type: 'schedule', date, completed: true },
      { id: 'task2', time: '11:00', title: 'Apply to 3 new jobs', description: 'Look for remote-first companies.', type: 'schedule', date, completed: true },
      { id: 'task3', time: '14:00', title: 'Interview with Acme Corp', description: 'Technical interview with the engineering team.', type: 'interview', date, completed: false },
      { id: 'task4', time: '16:00', title: 'Practice STAR method for interviews', type: 'schedule', date, completed: false },
      { id: 'task5', time: '18:30', title: 'Connect with 1 new person on LinkedIn', type: 'schedule', date, completed: true },
    ];
  }
  return [];
}
