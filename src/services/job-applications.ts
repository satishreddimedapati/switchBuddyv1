'use server';

import { db } from "@/lib/firebase";
import type { JobApplication, KanbanColumnId } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, query, where, getDoc } from "firebase/firestore";

const jobApplicationsCollection = collection(db, "job-applications");

const checkOwnership = async (docId: string, userId: string): Promise<boolean> => {
    const docRef = doc(db, "job-applications", docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
        return false;
    }
    return true;
}

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
  if (!await checkOwnership(jobId, userId)) {
    throw new Error("User does not have permission to update this document.");
  }
  const jobRef = doc(db, "job-applications", jobId);
  await updateDoc(jobRef, { stage: newStage });
}

export async function addJobApplication(job: Omit<JobApplication, 'id'>) {
    if (!job.userId) {
        throw new Error("Authentication required to add an application.");
    }
    const docRef = await addDoc(jobApplicationsCollection, job);
    return docRef.id;
}

export async function deleteJobApplication(jobId: string, userId: string) {
    if (!await checkOwnership(jobId, userId)) {
    throw new Error("User does not have permission to delete this document.");
  }
  const jobRef = doc(db, "job-applications", jobId);
  await deleteDoc(jobRef);
}
