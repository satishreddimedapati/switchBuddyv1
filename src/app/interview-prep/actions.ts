"use server";

import { generateInterviewQuestions } from "@/ai/flows/generate-interview-questions";
import { z } from "zod";

const InterviewPrepSchema = z.object({
  jobDescription: z.string().min(1, "Job description cannot be empty."),
});

export type FormState = {
  message: string;
  questions?: string[];
  error?: boolean;
};

export async function handleGenerateQuestions(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = InterviewPrepSchema.safeParse({
    jobDescription: formData.get("jobDescription"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Job description is required.",
      error: true,
    };
  }
  
  const { jobDescription } = validatedFields.data;

  try {
    const result = await generateInterviewQuestions({ jobDescription });
    if (result.interviewQuestions && result.interviewQuestions.length > 0) {
      return {
        message: "Questions generated successfully!",
        questions: result.interviewQuestions,
      };
    } else {
      return { message: "The AI did not return any questions. Try refining the job description.", error: true };
    }
  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again.",
      error: true,
    };
  }
}
