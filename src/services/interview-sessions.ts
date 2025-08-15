'use server';

import { db } from "@/lib/firebase";
import type { InterviewSession } from "@/lib/types";
import { toSerializableInterviewSession } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, getDoc, query, where, serverTimestamp, orderBy } from "firebase/firestore";

const sessionsCollection = collection(db, "interview_sessions");

export async function getInterviewSessions(userId: string): Promise<InterviewSession[]> {
    if (!userId) return [];
    try {
        const q = query(sessionsCollection, where("userId", "==", userId), orderBy("startedAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            const serializableData = toSerializableInterviewSession(data);
            return { id: doc.id, ...serializableData } as InterviewSession
        });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return [];
    }
}

export async function getInterviewSession(sessionId: string): Promise<InterviewSession | null> {
    try {
        const docRef = doc(db, "interview_sessions", sessionId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const serializableData = toSerializableInterviewSession(data);
            return { id: docSnap.id, ...serializableData } as InterviewSession;
        }
        return null;
    } catch (error) {
        console.error("Error fetching session:", error);
        return null;
    }
}

export async function addInterviewSession(session: Omit<InterviewSession, 'id' | 'startedAt' | 'completedAt' >) {
    if (!session.userId) {
        throw new Error("Authentication required.");
    }
    const docRef = await addDoc(sessionsCollection, {
        ...session,
        startedAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateInterviewSession(sessionId: string, updates: Partial<InterviewSession>) {
    const sessionRef = doc(db, "interview_sessions", sessionId);
    await updateDoc(sessionRef, updates);
}
