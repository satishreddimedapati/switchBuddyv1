'use server';

import { db } from "@/lib/firebase";
import type { InterviewPlan } from "@/lib/types";
import { toSerializableInterviewPlan } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp, getDoc } from "firebase/firestore";

const plansCollection = collection(db, "interview_plans");

export async function getInterviewPlans(userId: string): Promise<InterviewPlan[]> {
  if (!userId) return [];

  try {
    const q = query(plansCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const serializableData = toSerializableInterviewPlan(data);
        return {
            id: doc.id,
            ...serializableData,
        } as InterviewPlan;
    });
  } catch (error) {
    console.error("Error fetching interview plans: ", error);
    return [];
  }
}

export async function getInterviewPlan(planId: string): Promise<InterviewPlan | null> {
    try {
        const planRef = doc(db, "interview_plans", planId);
        const docSnap = await getDoc(planRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const serializableData = toSerializableInterviewPlan(data);
            return {
                id: docSnap.id,
                ...serializableData
            } as InterviewPlan
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching interview plan:", error);
        return null;
    }
}


export async function addInterviewPlan(plan: Omit<InterviewPlan, 'id' | 'createdAt'>) {
    if (!plan.userId) {
        throw new Error("Authentication required to add a plan.");
    }
    const docRef = await addDoc(plansCollection, {
        ...plan,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateInterviewPlan(planId: string, updates: Partial<Omit<InterviewPlan, 'id' | 'userId'>>, userId: string) {
  const planRef = doc(db, "interview_plans", planId);
  // Add an ownership check in a real app
  const planDoc = await getDoc(planRef);
  if (!planDoc.exists() || planDoc.data().userId !== userId) {
      throw new Error("Permission denied or plan not found.");
  }
  await updateDoc(planRef, updates);
}

export async function deleteInterviewPlan(planId: string, userId: string) {
  // Add an ownership check in a real app
  const planRef = doc(db, "interview_plans", planId);
    const planDoc = await getDoc(planRef);
    if (!planDoc.exists() || planDoc.data().userId !== userId) {
      throw new Error("Permission denied or plan not found.");
  }
  await deleteDoc(planRef);
}
