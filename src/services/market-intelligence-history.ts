
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
        // Construct the correct object to save to Firestore
        const dataToSave = {
            userId,
            createdAt: serverTimestamp(),
            input: searchData.input,
            intelResult: searchData.intelResult,
            salaryResult: searchData.salaryResult,
        };
        await addDoc(historyCollection, dataToSave);
    } catch (error) {
        console.error("Error saving search to history:", error);
        throw new Error("Failed to save search data to Firestore.");
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
