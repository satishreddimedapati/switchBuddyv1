'use server';

import { db } from "@/lib/firebase";
import type { JobApplication, KanbanColumnId } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";

const jobApplicationsCollection = collection(db, "job-applications");

export async function getJobApplications(userId: string): Promise<JobApplication[]> {
  if (!userId) return [];

  try {
    const q = query(jobApplicationsCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No job applications found for this user.');
      return [];
    }

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JobApplication));
  } catch (error) {
    console.error("Error fetching job applications: ", error);
    return [];
  }
}

export async function updateJobApplicationStage(jobId: string, newStage: KanbanColumnId, userId: string) {
  const jobRef = doc(db, "job-applications", jobId);
  // In a real app, you'd want to verify the user owns this document before updating.
  await updateDoc(jobRef, { stage: newStage });
}

export async function addJobApplication(job: Omit<JobApplication, 'id'>) {
    const docRef = await addDoc(jobApplicationsCollection, job);
    return docRef.id;
}

export async function deleteJobApplication(jobId: string) {
    const jobRef = doc(db, "job-applications", jobId);
    // In a real app, you'd want to verify the user owns this document before deleting.
    await deleteDoc(jobRef);
}
