
"use server";

import { tailorResume } from "@/ai/flows/tailor-resume";
import { generateRecruiterMessage } from "@/ai/flows/generate-recruiter-message";
import { z } from "zod";
import { format } from "date-fns";

const FormSchema = z.object({
  resume: z.string().min(1, "Resume cannot be empty."),
  jobDescription: z.string().min(1, "Job description cannot be empty."),
  // Fields for cover letter
  userName: z.string().optional(),
  userContactInfo: z.string().optional(),
  companyName: z.string().optional(),
});

export type FormState = {
  message: string;
  analysis?: {
    fitScore: number;
    breakdown: {
      skillsMatch: string;
      experienceMatch: string;
      educationMatch: string;
    };
    missingSkills: string[];
    tailoredResume: string;
  };
  recruiterMessage?: string;
  error?: boolean;
};

function extractJobTitle(jd: string): string {
    const match = jd.match(/(job title|role|position):\s*(.*)/i);
    if (match && match[2]) {
        return match[2].split('\n')[0].trim();
    }
    const commonTitles = ["Software Engineer", "Developer", "Analyst", "Manager", "Designer"];
    for (const title of commonTitles) {
        if (jd.toLowerCase().includes(title.toLowerCase())) {
            return title;
        }
    }
    return "the role";
}


export async function handleAnalysis(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = FormSchema.safeParse({
    resume: formData.get("resume"),
    jobDescription: formData.get("jobDescription"),
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
  
  const { resume, jobDescription, userName, userContactInfo, companyName } = validatedFields.data;

  try {
    const analysisPromise = tailorResume({ resume, jobDescription });
    
    const messagePromise = generateRecruiterMessage({ 
        resume, 
        jobDescription: {
            fullText: jobDescription,
            jobTitle: extractJobTitle(jobDescription),
        },
        userName: userName || 'Applicant',
        userContactInfo: userContactInfo || '',
        companyName: companyName || 'the company',
        currentDate: format(new Date(), 'MMMM d, yyyy'),
    });

    const [analysisResult, messageResult] = await Promise.all([analysisPromise, messagePromise]);

    if (!analysisResult || !messageResult) {
        return { message: "Failed to get a complete result from the AI.", error: true };
    }

    return {
      message: "Analysis complete!",
      analysis: analysisResult,
      recruiterMessage: messageResult.recruiterMessage,
    };

  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again.",
      error: true,
    };
  }
}
