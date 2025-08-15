"use server";

import { z } from "zod";
import { addJobApplication, updateJobApplicationStage } from "@/services/job-applications";
import { revalidatePath } from "next/cache";
import { KanbanColumnId } from "@/lib/types";
import { auth } from "firebase-admin";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";

const AddJobApplicationSchema = z.object({
  company: z.string().min(1, "Company name cannot be empty."),
  title: z.string().min(1, "Job title cannot be empty."),
  stage: z.enum(['Wishlist', 'Applying', 'Interview', 'Offer', 'Rejected']),
});

export type FormState = {
  message: string;
  error?: boolean;
};

export async function handleAddJobApplication(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) {
    return {
        message: "You must be logged in to add a job application.",
        error: true,
    }
  }

  const validatedFields = AddJobApplicationSchema.safeParse({
    company: formData.get("company"),
    title: formData.get("title"),
    stage: formData.get("stage"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please fill all fields.",
      error: true,
    };
  }

  const { company, title, stage } = validatedFields.data;

  try {
    await addJobApplication({ 
        company, 
        title, 
        stage,
        logoUrl: `https://placehold.co/40x40.png`,
        userId: user.uid,
    });
    
    revalidatePath("/tracker");

    return {
      message: "Job application added successfully!",
    };
  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again.",
      error: true,
    };
  }
}


export async function handleUpdateJobStage(jobId: string, newStage: KanbanColumnId) {
    const user = await getCurrentUser();
    if (!user) {
        return { message: 'Authentication required', error: true };
    }
    
    try {
        await updateJobApplicationStage(jobId, newStage, user.uid);
        revalidatePath('/tracker');
        return { message: 'Job stage updated' };
    } catch (error) {
        console.error("Error updating job stage:", error);
        return { message: 'Failed to update job stage', error: true };
    }
}
