
'use server';

import { db } from "@/lib/firebase";
import type { ChatSession, ChatMessage } from "@/lib/types";
import { toSerializableChatSession } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, query, where, serverTimestamp, orderBy, limit, onSnapshot } from "firebase/firestore";

const sessionsCollection = collection(db, "chat_sessions");

export async function createChatSession(userId: string, topic: string): Promise<string> {
    if (!userId) {
        throw new Error("Authentication required to create a chat session.");
    }

    const docRef = await addDoc(sessionsCollection, {
        userId,
        topic,
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        lastMessageSnippet: `Started a new chat about ${topic}...`
    });

    return docRef.id;
}

export async function getChatSessionsForUser(userId: string): Promise<ChatSession[]> {
    if (!userId) return [];
    try {
        const q = query(
            sessionsCollection, 
            where("userId", "==", userId),
            orderBy("lastMessageAt", "desc")
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
        return null;
    }
}


export async function addMessageToSession(sessionId: string, message: ChatMessage): Promise<string> {
    const messagesRef = collection(db, `chat_sessions/${sessionId}/messages`);
    
    // Add the new message
    const messageDocRef = await addDoc(messagesRef, {
        ...message,
        createdAt: serverTimestamp(),
    });

    // Update the parent session document
    const sessionRef = doc(db, "chat_sessions", sessionId);
    await updateDoc(sessionRef, {
        lastMessageAt: serverTimestamp(),
        lastMessageSnippet: message.content.substring(0, 50) + "..."
    });

    return messageDocRef.id;
}


export async function getMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
    try {
        const messagesRef = collection(db, `chat_sessions/${sessionId}/messages`);
        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Note: Timestamps are not converted here, but you could if needed.
            // For simple display, Firestore's automatic handling is often fine.
            return data as ChatMessage;
        });

    } catch (error) {
        console.error("Error fetching messages for session:", error);
        return [];
    }
}
