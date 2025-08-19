

'use server';

import { db } from "@/lib/firebase";
import type { LearningRoadmap, InteractiveLesson } from "@/lib/types";
import { toSerializableLearningRoadmap } from "@/lib/types";
import { collection, getDocs, doc, addDoc, query, where, serverTimestamp, orderBy, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

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
        startDate: Timestamp.fromDate(new Date(roadmapData.startDate)),
        endDate: Timestamp.fromDate(new Date(roadmapData.endDate)),
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
    
    const finalUpdates: any = { ...updates };
    if (updates.startDate && typeof updates.startDate === 'string') {
        finalUpdates.startDate = Timestamp.fromDate(new Date(updates.startDate));
    }
    if (updates.endDate && typeof updates.endDate === 'string') {
        finalUpdates.endDate = Timestamp.fromDate(new Date(updates.endDate));
    }

    await updateDoc(roadmapRef, finalUpdates);
}

export async function deleteLearningRoadmap(roadmapId: string, userId: string) {
    const roadmapRef = doc(db, "learning_roadmaps", roadmapId);
    const roadmapDoc = await getDoc(roadmapRef);

    if (!roadmapDoc.exists() || roadmapDoc.data().userId !== userId) {
        throw new Error("Permission denied or roadmap not found.");
    }
    
    await deleteDoc(roadmapRef);
}


// Functions for Interactive Lessons within a Roadmap

export async function getInteractiveLessonsForTopic(roadmapId: string, topic: string): Promise<InteractiveLesson[]> {
    try {
        const roadmap = await getLearningRoadmap(roadmapId);
        if (!roadmap || !roadmap.lessons) {
            return [];
        }
        return (roadmap.lessons[topic] || []).map(lesson => ({
            ...lesson,
            id: lesson.id || crypto.randomUUID(), // Assign a temporary ID if it's missing
        }));
    } catch (error) {
        console.error(`Error fetching interactive lessons for topic "${topic}":`, error);
        return [];
    }
}


export async function addInteractiveLesson(roadmapId: string, topic: string, lesson: Omit<InteractiveLesson, 'id'>): Promise<void> {
    try {
        const roadmapRef = doc(db, "learning_roadmaps", roadmapId);
        const roadmapDoc = await getDoc(roadmapRef);

        if (!roadmapDoc.exists()) {
            throw new Error("Roadmap not found.");
        }
        
        const newLesson: InteractiveLesson = {
            ...lesson,
            id: crypto.randomUUID(),
        };

        const roadmapData = roadmapDoc.data() as LearningRoadmap;
        const existingLessons = roadmapData.lessons || {};
        const topicLessons = existingLessons[topic] || [];

        const newTopicLessons = [...topicLessons, newLesson];

        await updateDoc(roadmapRef, {
            [`lessons.${topic}`]: newTopicLessons
        });

    } catch (error) {
        console.error(`Error adding interactive lesson for topic "${topic}":`, error);
        throw new Error("Failed to save the new interactive lesson.");
    }
}
