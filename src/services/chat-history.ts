

'use server';

import { db } from "@/lib/firebase";
import type { ChatSession, ChatMessage } from "@/lib/types";
import { toSerializableChatSession } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, query, where, serverTimestamp, orderBy, limit, getDoc, arrayUnion } from "firebase/firestore";

const sessionsCollection = collection(db, "chat_sessions");

export async function createChatSession(userId: string, topic: string, history: ChatMessage[]): Promise<string> {
    if (!userId) {
        throw new Error("Authentication required to create a chat session.");
    }

    const lastMessage = history[history.length - 1];
    const snippet = lastMessage ? lastMessage.content.substring(0, 50) + "..." : `Started a new chat about ${topic}...`;

    const sessionDocRef = await addDoc(sessionsCollection, {
        userId,
        topic,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessageSnippet: snippet,
        history: history,
    });

    return sessionDocRef.id;
}


export async function getChatSessionsForUser(userId: string): Promise<ChatSession[]> {
    if (!userId) return [];
    try {
        const q = query(
            sessionsCollection, 
            where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...toSerializableChatSession(data),
            } as ChatSession;
        });

    } catch (error) {
        console.error("Error fetching chat sessions:", error);
        return [];
    }
}

export async function getChatSessionForTopic(userId: string, topic: string): Promise<ChatSession | null> {
    if (!userId) return null;
    try {
        const q = query(
            sessionsCollection,
            where("userId", "==", userId),
            where("topic", "==", topic),
            orderBy("lastMessageAt", "desc"),
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...toSerializableChatSession(doc.data()),
        } as ChatSession;

    } catch (error) {
        console.error("Error fetching chat session for topic:", error);
        // This query requires a composite index. Firestore usually provides a link to create it
        // in the error message in the functions console.
        throw error;
    }
}


export async function addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
    const sessionRef = doc(db, "chat_sessions", sessionId);
    
    // Add the new message to the history array
    await updateDoc(sessionRef, {
        history: arrayUnion(message),
        lastMessageAt: serverTimestamp(),
        lastMessageSnippet: message.content.substring(0, 50) + "..."
    });
}


export async function getMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
    try {
        const sessionRef = doc(db, "chat_sessions", sessionId);
        const docSnap = await getDoc(sessionRef);

        if (!docSnap.exists()) {
            console.error("No such session document!");
            return [];
        }

        const data = docSnap.data();
        return data.history || [];

    } catch (error) {
        console.error("Error fetching messages for session:", error);
        return [];
    }
}
