
"use server";

import { tailorResume } from "@/ai/flows/tailor-resume";
import { generateRecruiterMessage } from "@/ai/flows/generate-recruiter-message";
import { getCompanyInsights, GetCompanyInsightsOutput } from "@/ai/flows/get-company-insights";
import { getSalaryBenchmark, GetSalaryBenchmarkOutput } from "@/ai/flows/get-salary-benchmark";
import { generateInterviewQuestions, GenerateInterviewQuestionsOutput } from "@/ai/flows/generate-interview-questions";
import { z } from "zod";
import { format } from "date-fns";
import type { TailorResumeOutput } from "@/lib/types";


const FormSchema = z.object({
  resume: z.string().min(1, "Resume cannot be empty."),
  jobDescription: z.string().min(1, "Job description cannot be empty."),
  // Fields for cover letter & other tools
  userName: z.string().optional(),
  userContactInfo: z.string().optional(),
  companyName: z.string().optional(),
  location: z.string().optional(),
});

export type FormState = {
  message: string;
  analysis?: TailorResumeOutput;
  recruiterMessage?: string;
  companyInsights?: GetCompanyInsightsOutput;
  salaryBenchmark?: GetSalaryBenchmarkOutput;
  interviewQuestions?: GenerateInterviewQuestionsOutput;
  error?: boolean;
};

function extractJobTitle(jd: string): string {
    const match = jd.match(/(job title|role|position):\s*(.*)/i);
    if (match && match[2]) {
        return match[2].split('\n')[0].trim();
    }
    const commonTitles = ["Software Engineer", "Developer", "Analyst", "Manager", "Designer", "Full Stack Developer"];
    for (const title of commonTitles) {
        if (jd.toLowerCase().includes(title.toLowerCase())) {
            return title;
        }
    }
    return "the role";
}

function extractLocation(jd: string): string | undefined {
    const lines = jd.split('\n');
    for (const line of lines) {
        if (line.toLowerCase().includes('location:')) {
            return line.split(':')[1].trim();
        }
    }
    return undefined;
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
    location: formData.get("location"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. All fields are required.",
      error: true,
    };
  }
  
  const { resume, jobDescription, userName, userContactInfo, companyName, location } = validatedFields.data;
  const jobTitle = extractJobTitle(jobDescription);

  try {
    const promises = [];
    
    // Core analysis
    promises.push(tailorResume({ resume, jobDescription }));
    
    // Recruiter Message
    if (userName && userContactInfo && companyName) {
        promises.push(generateRecruiterMessage({ 
            resume, 
            jobDescription: { fullText: jobDescription, jobTitle },
            userName, userContactInfo, companyName,
            currentDate: format(new Date(), 'MMMM d, yyyy'),
        }));
    } else {
        promises.push(Promise.resolve(null)); // Placeholder
    }
    
    // Company Insights
    if (companyName) {
        promises.push(getCompanyInsights({ companyName }));
    } else {
        promises.push(Promise.resolve(null)); // Placeholder
    }

    // Salary Benchmark
    if (location) {
         promises.push(getSalaryBenchmark({ jobRole: jobTitle, location }));
    } else {
        promises.push(Promise.resolve(null));
    }

    // Interview Questions
    promises.push(generateInterviewQuestions({ jobDescription }));


    const [analysisResult, messageResult, insightsResult, salaryResult, questionsResult] = await Promise.all(promises);

    if (!analysisResult) {
        return { message: "Failed to get analysis from the AI.", error: true };
    }

    return {
      message: "Analysis complete!",
      analysis: analysisResult,
      recruiterMessage: messageResult?.recruiterMessage,
      companyInsights: insightsResult,
      salaryBenchmark: salaryResult,
      interviewQuestions: questionsResult
    };

  } catch (e) {
    console.error(e);
    return {
      message: "An unexpected error occurred. Please try again.",
      error: true,
    };
  }
}
