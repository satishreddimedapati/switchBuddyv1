

'use server';

import { db } from "@/lib/firebase";
import type { InterviewExperience } from "@/lib/types";
import { toSerializableInterviewExperience } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp, getDoc } from "firebase/firestore";
import { generateAnswerAnalysis } from '@/ai/flows/generate-answer-analysis';

const experiencesCollection = collection(db, "interview-experiences");

const checkOwnership = async (docId: string, userId: string): Promise<boolean> => {
    const docRef = doc(db, "interview-experiences", docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
        return false;
    }
    return true;
}

export async function getInterviewExperiences(userId: string): Promise<InterviewExperience[]> {
  if (!userId) return [];

  try {
    const q = query(experiencesCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...toSerializableInterviewExperience(doc.data()),
    } as InterviewExperience));
  } catch (error) {
    console.error("Error fetching interview experiences: ", error);
    return [];
  }
}

export async function getInterviewExperience(experienceId: string): Promise<InterviewExperience | null> {
    const docRef = doc(db, 'interview-experiences', experienceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return {
            id: docSnap.id,
            ...toSerializableInterviewExperience(docSnap.data()),
        } as InterviewExperience
    }
    return null;
}

type NewExperienceData = Omit<InterviewExperience, 'id' | 'createdAt' | 'questions'> & {
  questions: Array<Omit<InterviewExperience['questions'][number], 'id' | 'analysis'>>
};

export async function addInterviewExperience(experience: NewExperienceData) {
    if (!experience.userId) {
        throw new Error("Authentication required to add an experience.");
    }
    
    const analyzedQuestions = await Promise.all(
        experience.questions.map(async (q) => {
            const analysisResult = await generateAnswerAnalysis({
                questionText: q.questionText,
                userAnswer: q.userAnswer,
            });
            return {
                ...q,
                id: crypto.randomUUID(), // Generate a client-side UUID for the sub-object
                analysis: {
                    aiRating: analysisResult.aiRating,
                    idealAnswer: analysisResult.idealAnswer,
                    shortcut: analysisResult.shortcut,
                },
            };
        })
    );

    const finalExperience = {
        ...experience,
        questions: analyzedQuestions,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(experiencesCollection, finalExperience);
    return docRef.id;
}


export async function updateInterviewExperience(experienceId: string, updates: NewExperienceData, userId: string) {
  if (!await checkOwnership(experienceId, userId)) {
    throw new Error("User does not have permission to update this document.");
  }
  
  const analyzedQuestions = await Promise.all(
        updates.questions.map(async (q: any) => {
            // If analysis already exists, keep it. Otherwise, generate it.
            if (q.analysis) {
                return q;
            }
            const analysisResult = await generateAnswerAnalysis({
                questionText: q.questionText,
                userAnswer: q.userAnswer,
            });
            return {
                ...q,
                id: q.id || crypto.randomUUID(),
                analysis: {
                    aiRating: analysisResult.aiRating,
                    idealAnswer: analysisResult.idealAnswer,
                    shortcut: analysisResult.shortcut,
                },
            };
        })
    );

  const finalUpdates = {
      ...updates,
      questions: analyzedQuestions,
  }
  
  const experienceRef = doc(db, "interview-experiences", experienceId);
  await updateDoc(experienceRef, finalUpdates as any);
}

export async function deleteInterviewExperience(experienceId: string, userId: string) {
  if (!await checkOwnership(experienceId, userId)) {
    throw new Error("User does not have permission to delete this document.");
  }
  const experienceRef = doc(db, "interview-experiences", experienceId);
  await deleteDoc(experienceRef);
}
