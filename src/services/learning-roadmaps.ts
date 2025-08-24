

'use server';

import { db } from "@/lib/firebase";
import type { LearningRoadmap, InteractiveLesson, DailyTaskItem } from "@/lib/types";
import { toSerializableLearningRoadmap } from "@/lib/types";
import { collection, getDocs, doc, addDoc, query, where, serverTimestamp, orderBy, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

const roadmapsCollection = collection(db, "learning_roadmaps");

export async function getLearningRoadmapsForUser(userId: string): Promise<LearningRoadmap[]> {
    if (!userId) return [];

    try {
        // Removed orderBy to avoid needing a composite index
        const q = query(roadmapsCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return [];
        }
        
        const roadmaps = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const serializableData = toSerializableLearningRoadmap(data);
            return { id: doc.id, ...serializableData } as LearningRoadmap;
        });

        // Sort in code after fetching
        roadmaps.sort((a,b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        
        return roadmaps;

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


export async function addInteractiveLesson(roadmapId: string, topic: string, lesson: Omit<InteractiveLesson, 'id'>): Promise<string> {
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
        
        return newLesson.id!;

    } catch (error) {
        console.error(`Error adding interactive lesson for topic "${topic}":`, error);
        throw new Error("Failed to save the new interactive lesson.");
    }
}

export async function updateTaskCompletionInRoadmap(roadmapId: string, taskTopic: string, completed: boolean): Promise<void> {
    try {
        const roadmapRef = doc(db, "learning_roadmaps", roadmapId);
        const roadmapDoc = await getDoc(roadmapRef);

        if (!roadmapDoc.exists()) {
            throw new Error("Roadmap not found.");
        }

        const roadmapData = roadmapDoc.data() as LearningRoadmap;
        const weeks = roadmapData.roadmap.weeks;

        // Find and update the specific task
        const newWeeks = weeks.map(week => {
            return {
                ...week,
                daily_tasks: week.daily_tasks.map(task => {
                    if (task.topic === taskTopic) {
                        return { ...task, completed: completed };
                    }
                    return task;
                })
            };
        });

        // Update the entire roadmap object in Firestore
        await updateDoc(roadmapRef, {
            'roadmap.weeks': newWeeks
        });

    } catch (error) {
        console.error(`Error updating task completion for topic "${taskTopic}":`, error);
        throw new Error("Failed to update task completion status.");
    }
}
