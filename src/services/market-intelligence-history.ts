
'use server';

import { db } from "@/lib/firebase";
import type { MarketIntelHistoryItem } from "@/lib/types";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";

const historyCollection = collection(db, "market_intelligence_history");

export async function addSearchToHistory(
    userId: string, 
    searchData: Omit<MarketIntelHistoryItem, 'id' | 'userId' | 'createdAt'>
) {
    if (!userId) {
        throw new Error("Authentication required to save history.");
    }

    try {
        await addDoc(historyCollection, {
            ...searchData,
            userId,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error saving search to history:", error);
        // We can choose to fail silently or throw, for now, we log it.
    }
}

export async function getSearchHistory(userId: string): Promise<MarketIntelHistoryItem[]> {
    if (!userId) return [];

    try {
        const q = query(
            historyCollection, 
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt.toDate().toISOString(),
            } as MarketIntelHistoryItem;
        });

    } catch (error) {
        console.error("Error fetching search history:", error);
        return [];
    }
}
