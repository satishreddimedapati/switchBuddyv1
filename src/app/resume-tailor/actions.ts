"use server";

import { tailorResume } from "@/ai/flows/tailor-resume";
import { z } from "zod";

const TailorResumeSchema = z.object({
  resume: z.string().min(1, "Resume cannot be empty."),
  jobDescription: z.string().min(1, "Job description cannot be empty."),
});

export type FormState = {
  message: string;
  tailoredResume?: string;
  error?: boolean;
};

export async function handleTailorResume(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = TailorResumeSchema.safeParse({
    resume: formData.get("resume"),
    jobDescription: formData.get("jobDescription"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Both fields are required.",
      error: true,
    };
  }
  
  const { resume, jobDescription } = validatedFields.data;

  try {
    const result = await tailorResume({ resume, jobDescription });
    if (result.tailoredResume) {
      return {
        message: "Resume tailored successfully!",
        tailoredResume: result.tailoredResume,
      };
    } else {
      return { message: "Failed to get a result from the AI.", error: true };
    }
  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again.",
      error: true,
    };
  }
}
