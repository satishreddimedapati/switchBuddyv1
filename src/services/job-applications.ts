'use server';

import { db } from "@/lib/firebase";
import type { JobApplication, KanbanColumnId } from "@/lib/types";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

export async function getJobApplications(): Promise<JobApplication[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "job-applications"));
    if (querySnapshot.empty) {
      console.log('No job applications found, returning sample data.');
      return getSampleJobApplications();
    }
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as JobApplication));
  } catch (error) {
    console.error("Error fetching job applications, returning sample data: ", error);
    return getSampleJobApplications();
  }
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

// Sample data to be used when the database is empty or inaccessible.
function getSampleJobApplications(): JobApplication[] {
  return [
    { id: '1', company: 'Google', title: 'Software Engineer', stage: 'Interview', logoUrl: 'https://placehold.co/40x40.png' },
    { id: '2', company: 'Facebook', title: 'Product Manager', stage: 'Applying', logoUrl: 'https://placehold.co/40x40.png' },
    { id: '3', company: 'Amazon', title: 'Data Scientist', stage: 'Wishlist', logoUrl: 'https://placehold.co/40x40.png' },
    { id: '4', company: 'Netflix', title: 'UX Designer', stage: 'Offer', logoUrl: 'https://placehold.co/40x40.png' },
    { id: '5', company: 'Apple', title: 'iOS Developer', stage: 'Rejected', logoUrl: 'https://placehold.co/40x40.png' },
    { id: '6', company: 'Microsoft', title: 'Cloud Engineer', stage: 'Wishlist', logoUrl: 'https://placehold.co/40x40.png' },
  ];
}
