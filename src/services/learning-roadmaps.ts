
'use server';

import { db } from "@/lib/firebase";
import type { LearningRoadmap } from "@/lib/types";
import { collection, getDocs, doc, addDoc, query, where, serverTimestamp, limit } from "firebase/firestore";

const roadmapsCollection = collection(db, "learning_roadmaps");

export async function getLearningRoadmapForUser(userId: string): Promise<LearningRoadmap | null> {
    if (!userId) return null;

    try {
        const q = query(roadmapsCollection, where("userId", "==", userId), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }
        
        const doc = querySnapshot.docs[0];
        // Note: We are not using a toSerializable helper here for simplicity,
        // but in a larger app, you would handle Timestamps properly.
        return { id: doc.id, ...doc.data() } as LearningRoadmap;

    } catch (error) {
        console.error("Error fetching learning roadmap:", error);
        return null;
    }
}

export async function addLearningRoadmap(roadmapData: Omit<LearningRoadmap, 'id' | 'createdAt'>): Promise<string> {
    if (!roadmapData.userId) {
        throw new Error("Authentication required to add a roadmap.");
    }

    const docRef = await addDoc(roadmapsCollection, {
        ...roadmapData,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}
