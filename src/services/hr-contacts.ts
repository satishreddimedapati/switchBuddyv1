'use server';

import { db } from "@/lib/firebase";
import type { HrContact } from "@/lib/types";
import { collection, getDocs, doc, addDoc, query, where, orderBy } from "firebase/firestore";

const hrContactsCollection = collection(db, "hiring_hr");

export async function searchHrContacts(jobRole: string, userId: string): Promise<HrContact[]> {
  if (!userId) return [];

  try {
    const q = query(
        hrContactsCollection, 
        where("userId", "==", userId),
        where("jobRole", "==", jobRole)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HrContact));
  } catch (error) {
    console.error("Error searching HR contacts: ", error);
    return [];
  }
}

export async function addHrContact(contact: Omit<HrContact, 'id'>): Promise<string> {
    if (!contact.userId) {
        throw new Error("Authentication required to add a contact.");
    }
    const docRef = await addDoc(hrContactsCollection, contact);
    return docRef.id;
}
