
'use server';

import { db } from "@/lib/firebase";
import type { MarketIntelHistoryItem, GetMarketIntelligenceOutput, GetPersonalizedSalaryEstimateOutput } from "@/lib/types";
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
        // Deeply sanitize the AI output to ensure it's a plain object for Firestore.
        // This is the most robust way to fix the serialization errors.
        const intelResult = searchData.intelResult;
        const cleanIntelResult: GetMarketIntelligenceOutput = {
            growthPath: intelResult.growthPath.map(p => ({ role: p.role, salaryRange: p.salaryRange })),
            skillsInDemand: [...intelResult.skillsInDemand],
            locationComparison: { commentary: intelResult.locationComparison.commentary },
            topCompaniesHiring: [...intelResult.topCompaniesHiring],
            alumniInsights: { 
                avgTenure: intelResult.alumniInsights.avgTenure,
                careerSwitches: [...intelResult.alumniInsights.careerSwitches] 
            },
            interviewPrep: {
                difficultyRating: intelResult.interviewPrep.difficultyRating,
                commonQuestionCategories: [...intelResult.interviewPrep.commonQuestionCategories]
            },
            applicationStrategy: {
                bestTimeToApply: intelResult.applicationStrategy.bestTimeToApply,
                successRates: intelResult.applicationStrategy.successRates.map(r => ({ method: r.method, probability: r.probability }))
            }
        };

        let cleanSalaryResult: GetPersonalizedSalaryEstimateOutput | null = null;
        if (searchData.salaryResult) {
            cleanSalaryResult = {
                estimatedSalaryRange: searchData.salaryResult.estimatedSalaryRange,
                commentary: searchData.salaryResult.commentary
            };
        }

        const dataToSave = {
            userId: userId,
            createdAt: serverTimestamp(),
            input: {
                jobRole: searchData.input.jobRole,
                companyName: searchData.input.companyName,
                location: searchData.input.location,
                yearsOfExperience: searchData.input.yearsOfExperience ?? null
            },
            intelResult: cleanIntelResult,
            salaryResult: cleanSalaryResult,
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
