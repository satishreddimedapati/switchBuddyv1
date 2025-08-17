
'use server';

import { db } from "@/lib/firebase";
import type { LearningRoadmap } from "@/lib/types";
import { toSerializableLearningRoadmap } from "@/lib/types";
import { collection, getDocs, doc, addDoc, query, where, serverTimestamp, orderBy, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
        // This will likely fail with an index error first. The user needs to create the index.
        throw error;
    }
}

export async function getLearningRoadmap(roadmapId: string): Promise<LearningRoadmap | null> {
    try {
        const roadmapRef = doc(db, "learning_roadmaps", roadmapId);
        const docSnap = await getDoc(roadmapRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const serializableData = toSerializableLearningRoadmap(data);
            return { id: docSnap.id, ...serializableData } as LearningRoadmap;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching roadmap:", error);
        return null;
    }
}


export async function addLearningRoadmap(roadmapData: Omit<LearningRoadmap, 'id' | 'createdAt' | 'roadmap'> & { roadmap: any }) {
    if (!roadmapData.userId) {
        throw new Error("Authentication required to add a roadmap.");
    }
    
    const dataToStore = {
        ...roadmapData,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(roadmapsCollection, dataToStore);

    return docRef.id;
}


export async function updateLearningRoadmap(roadmapId: string, updates: Partial<Omit<LearningRoadmap, 'id' | 'userId' | 'createdAt'>>, userId: string) {
    const roadmapRef = doc(db, "learning_roadmaps", roadmapId);
    const roadmapDoc = await getDoc(roadmapRef);

    if (!roadmapDoc.exists() || roadmapDoc.data().userId !== userId) {
        throw new Error("Permission denied or roadmap not found.");
    }

    await updateDoc(roadmapRef, updates);
}

export async function deleteLearningRoadmap(roadmapId: string, userId: string) {
    const roadmapRef = doc(db, "learning_roadmaps", roadmapId);
    const roadmapDoc = await getDoc(roadmapRef);

    if (!roadmapDoc.exists() || roadmapDoc.data().userId !== userId) {
        throw new Error("Permission denied or roadmap not found.");
    }
    
    await deleteDoc(roadmapRef);
}
