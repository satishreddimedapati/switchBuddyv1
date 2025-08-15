'use server';

import { db } from "@/lib/firebase";
import type { JobApplication, KanbanColumnId } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where } from "firebase/firestore";
import { getCurrentUser } from "@/lib/auth";

const jobApplicationsCollection = collection(db, "job-applications");

export async function getJobApplications(): Promise<JobApplication[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    const q = query(jobApplicationsCollection, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No job applications found for this user.');
      // Optionally, add sample data for new users
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
  // TODO: Add a check to ensure the job belongs to the user
  const jobRef = doc(db, "job-applications", jobId);
  await updateDoc(jobRef, { stage: newStage });
}

export async function addJobApplication(job: Omit<JobApplication, 'id'>) {
    const docRef = await addDoc(jobApplicationsCollection, job);
    return docRef.id;
}

export async function deleteJobApplication(jobId: string) {
    // TODO: Add a check to ensure the job belongs to the user
    await deleteDoc(doc(db, "job-applications", jobId));
}
