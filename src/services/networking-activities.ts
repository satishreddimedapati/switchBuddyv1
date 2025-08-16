'use server';

import { db } from "@/lib/firebase";
import type { NetworkingActivity } from "@/lib/types";
import { collection, getDocs, doc, addDoc, query, where, orderBy } from "firebase/firestore";

const activitiesCollection = collection(db, "networking_activities");

export async function getNetworkingActivities(userId: string): Promise<NetworkingActivity[]> {
  if (!userId) return [];

  try {
    const q = query(
        activitiesCollection, 
        where("userId", "==", userId),
        orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NetworkingActivity));
  } catch (error) {
    console.error("Error fetching networking activities: ", error);
    return [];
  }
}

export async function addNetworkingActivity(activity: Omit<NetworkingActivity, 'id'>): Promise<string> {
    if (!activity.userId) {
        throw new Error("Authentication required to log an activity.");
    }
    const docRef = await addDoc(activitiesCollection, activity);
    return docRef.id;
}
