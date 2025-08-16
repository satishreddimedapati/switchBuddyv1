
"use server";

import { tailorResume } from "@/ai/flows/tailor-resume";
import { generateRecruiterMessage } from "@/ai/flows/generate-recruiter-message";
import { z } from "zod";

const FormSchema = z.object({
  resume: z.string().min(1, "Resume cannot be empty."),
  jobDescription: z.string().min(1, "Job description cannot be empty."),
  tone: z.enum(['Formal', 'Friendly', 'Confident']).optional(),
  action: z.enum(['analyze', 'message'])
});

export type FormState = {
  message: string;
  fitScoreAnalysis?: string;
  recruiterMessage?: string;
  error?: boolean;
};

export async function handleAnalysis(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse({
    resume: formData.get("resume"),
    jobDescription: formData.get("jobDescription"),
    tone: formData.get("tone"),
    action: formData.get("action"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. All fields are required.",
      error: true,
    };
  }
  
  const { resume, jobDescription, tone, action } = validatedFields.data;

  try {
    if (action === 'analyze') {
      const result = await tailorResume({ resume, jobDescription });
      if (result.tailoredResume) {
        return {
          message: "Resume analysis complete!",
          fitScoreAnalysis: result.tailoredResume,
        };
      } else {
        return { message: "Failed to get a result from the AI.", error: true };
      }
    }

    if (action === 'message') {
        const result = await generateRecruiterMessage({ resume, jobDescription, tone: tone || 'Friendly' });
        if (result.recruiterMessage) {
            return {
                message: "Recruiter message generated!",
                recruiterMessage: result.recruiterMessage,
            };
        } else {
            return { message: "Failed to get a result from the AI.", error: true };
        }
    }

    return { message: "Invalid action.", error: true };

  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again.",
      error: true,
    };
  }
}
