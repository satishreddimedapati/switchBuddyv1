"use server";

import { z } from "zod";
import { addJobApplication } from "@/services/job-applications";
import { revalidatePath } from "next/cache";

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
        logoUrl: `https://placehold.co/40x40.png` 
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
