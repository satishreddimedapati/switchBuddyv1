
"use server";

import { tailorResume } from "@/ai/flows/tailor-resume";
import { generateRecruiterMessage } from "@/ai/flows/generate-recruiter-message";
import { z } from "zod";
import { format } from "date-fns";

const FormSchema = z.object({
  resume: z.string().min(1, "Resume cannot be empty."),
  jobDescription: z.string().min(1, "Job description cannot be empty."),
  action: z.enum(['analyze', 'message']),
  // Fields for cover letter
  userName: z.string().optional(),
  userContactInfo: z.string().optional(),
  companyName: z.string().optional(),
});

export type FormState = {
  message: string;
  fitScoreAnalysis?: string;
  recruiterMessage?: string;
  error?: boolean;
};

function extractJobTitle(jd: string): string {
    const match = jd.match(/(job title|role|position):\s*(.*)/i);
    if (match && match[2]) {
        return match[2].split('\n')[0].trim();
    }
    // Fallback: try to find common titles
    const commonTitles = ["Software Engineer", "Developer", "Analyst", "Manager", "Designer"];
    for (const title of commonTitles) {
        if (jd.toLowerCase().includes(title.toLowerCase())) {
            return title;
        }
    }
    return "the role"; // generic fallback
}


export async function handleAnalysis(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse({
    resume: formData.get("resume"),
    jobDescription: formData.get("jobDescription"),
    action: formData.get("action"),
    userName: formData.get("userName"),
    userContactInfo: formData.get("userContactInfo"),
    companyName: formData.get("companyName"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. All fields are required.",
      error: true,
    };
  }
  
  const { resume, jobDescription, action, userName, userContactInfo, companyName } = validatedFields.data;

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
        if (!userName || !userContactInfo || !companyName) {
            return { message: "User name, contact info, and company name are required for the cover letter.", error: true };
        }
        const result = await generateRecruiterMessage({ 
            resume, 
            jobDescription: {
                fullText: jobDescription,
                jobTitle: extractJobTitle(jobDescription),
            },
            userName,
            userContactInfo,
            companyName,
            currentDate: format(new Date(), 'MMMM d, yyyy'),
        });
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
