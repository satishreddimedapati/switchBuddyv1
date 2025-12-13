

'use server';

import { db } from "@/lib/firebase";
import type { InterviewExperience, InterviewQuestion } from "@/lib/types";
import { toSerializableInterviewExperience } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, serverTimestamp, getDoc } from "firebase/firestore";
import { generateBulkAnswerAnalysis } from '@/ai/flows/generate-answer-analysis';

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
  questions: Array<Omit<InterviewQuestion, 'id' | 'analysis'>>
};

export async function addInterviewExperience(experience: NewExperienceData) {
    if (!experience.userId) {
        throw new Error("Authentication required to add an experience.");
    }
    
    // Prepare questions for bulk analysis
    const questionsToAnalyze = experience.questions.map(q => ({
        questionText: q.questionText,
        userAnswer: q.userAnswer,
        evaluationMode: q.evaluationMode,
    }));

    // Call the new bulk analysis flow once
    const bulkAnalysisResult = await generateBulkAnswerAnalysis({ questions: questionsToAnalyze });

    // Map results back to questions
    const analyzedQuestions = experience.questions.map((q, index) => {
        const analysis = bulkAnalysisResult.analyses[index];
        return {
            ...q,
            id: crypto.randomUUID(), // Generate a client-side UUID for the sub-object
            analysis: analysis ? {
                aiRating: analysis.aiRating,
                idealAnswer: analysis.idealAnswer,
                shortcut: analysis.shortcut,
            } : undefined,
        };
    });

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
  
  const questionsToAnalyze = updates.questions
    .filter((q: any) => !q.analysis) // Only analyze questions that don't have one
    .map((q: any) => ({
      questionText: q.questionText,
      userAnswer: q.userAnswer,
      evaluationMode: q.evaluationMode,
    }));

  let analysisMap = new Map<string, any>();

  if (questionsToAnalyze.length > 0) {
    const bulkAnalysisResult = await generateBulkAnswerAnalysis({ questions: questionsToAnalyze });
    questionsToAnalyze.forEach((q, index) => {
      // Create a key to map original question to its analysis
      const key = `${q.questionText}-${q.userAnswer}`;
      analysisMap.set(key, bulkAnalysisResult.analyses[index]);
    });
  }

  const finalQuestions = updates.questions.map((q: any) => {
    // If it already has an analysis, keep it.
    if (q.analysis) return q;

    // Otherwise, find its new analysis from the map
    const key = `${q.questionText}-${q.userAnswer}`;
    const analysis = analysisMap.get(key);
    
    return {
      ...q,
      id: q.id || crypto.randomUUID(),
      analysis: analysis ? {
          aiRating: analysis.aiRating,
          idealAnswer: analysis.idealAnswer,
          shortcut: analysis.shortcut,
      } : undefined,
    };
  });


  const finalUpdates = {
      ...updates,
      questions: finalQuestions,
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
