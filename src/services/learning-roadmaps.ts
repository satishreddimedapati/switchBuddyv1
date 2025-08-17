
'use server';

import { db } from "@/lib/firebase";
import type { LearningRoadmap } from "@/lib/types";
import { toSerializableLearningRoadmap } from "@/lib/types";
import { collection, getDocs, doc, addDoc, query, where, serverTimestamp, orderBy } from "firebase/firestore";

const roadmapsCollection = collection(db, "learning_roadmaps");

export async function getLearningRoadmapsForUser(userId: string): Promise<LearningRoadmap[]> {
    if (!userId) return [];

    try {
        const q = query(roadmapsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            const serializableData = toSerializableLearningRoadmap(data);
            return { id: doc.id, ...serializableData } as LearningRoadmap;
        });

    } catch (error) {
        console.error("Error fetching learning roadmaps:", error);
        return [];
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
