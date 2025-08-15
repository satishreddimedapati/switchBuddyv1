'use server';

import { db } from "@/lib/firebase";
import type { JobApplication, KanbanColumnId } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

export async function getJobApplications(): Promise<JobApplication[]> {
  const querySnapshot = await getDocs(collection(db, "job-applications"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as JobApplication));
}

export async function updateJobApplicationStage(jobId: string, newStage: KanbanColumnId) {
  const jobRef = doc(db, "job-applications", jobId);
  await updateDoc(jobRef, { stage: newStage });
}

export async function addJobApplication(job: Omit<JobApplication, 'id'>) {
    const docRef = await addDoc(collection(db, "job-applications"), job);
    return docRef.id;
}

export async function deleteJobApplication(jobId: string) {
    await deleteDoc(doc(db, "job-applications", jobId));
}
