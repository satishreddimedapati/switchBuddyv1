'use server';

import { db } from "@/lib/firebase";
import type { InterviewPlan } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";

const plansCollection = collection(db, "interview_plans");

export async function getInterviewPlans(userId: string): Promise<InterviewPlan[]> {
  if (!userId) return [];

  try {
    const q = query(plansCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InterviewPlan));
  } catch (error) {
    console.error("Error fetching interview plans: ", error);
    return [];
  }
}

export async function addInterviewPlan(plan: Omit<InterviewPlan, 'id'>) {
    if (!plan.userId) {
        throw new Error("Authentication required to add a plan.");
    }
    const docRef = await addDoc(plansCollection, {
        ...plan,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateInterviewPlan(planId: string, updates: Partial<InterviewPlan>, userId: string) {
  const planRef = doc(db, "interview_plans", planId);
  // Add an ownership check in a real app
  await updateDoc(planRef, updates);
}

export async function deleteInterviewPlan(planId: string, userId: string) {
  // Add an ownership check in a real app
  const planRef = doc(db, "interview_plans", planId);
  await deleteDoc(planRef);
}
