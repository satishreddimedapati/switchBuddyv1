'use server';

/**
 * @fileOverview A flow to generate a professional cover letter.
 *
 * - generateRecruiterMessage - A function that generates the cover letter.
 * - GenerateRecruiterMessageInput - The input type for the function.
 * - GenerateRecruiterMessageOutput - The return type for the function.
 */

import { createAI } from '@/ai/genkit';
import { cookies } from 'next/headers';
import { GenerateRecruiterMessageInputSchema, GenerateRecruiterMessageOutputSchema } from '@/lib/types';
import { z } from 'zod';

export type GenerateRecruiterMessageInput = z.infer<typeof GenerateRecruiterMessageInputSchema>;
export type GenerateRecruiterMessageOutput = z.infer<typeof GenerateRecruiterMessageOutputSchema>;


export async function generateRecruiterMessage(input: GenerateRecruiterMessageInput): Promise<GenerateRecruiterMessageOutput> {
  const cookieStore = await cookies();
  const provider = (cookieStore.get('ai_provider')?.value || 'gemini') as 'gemini' | 'groq';
  const apiKey = cookieStore.get('ai_api_key')?.value;
  if (!apiKey) throw new Error("API Key is missing. Please configure it in AI Settings.");
  
  const ai = createAI(apiKey, provider);

  let finalPrompt = `You are an expert career coach helping a job seeker draft a professional cover letter.

Based on the provided resume and job description, generate a comprehensive, well-structured cover letter.

Follow this exact format:

Hiring Team
{{companyName}}

{{userName}}
{{userContactInfo}}

{{currentDate}}

Dear Hiring Team,

I hope you're doing well. Iʼm excited to apply for the {{jobDescription.jobTitle}} role at {{companyName}}. [Based on the resume and job description, write a compelling opening paragraph that highlights 2-3 key skills and years of experience.]

[Based on the resume, write a detailed paragraph highlighting relevant work experience, projects, and accomplishments. Connect these experiences directly to the requirements in the job description.]

What excites me about this opportunity is {{companyName}}’s focus on [mention something specific about the company's focus, values, or projects based on the job description or general knowledge]. The chance to work on cutting-edge technologies, collaborate with talented professionals, and contribute to meaningful projects is something I’d love to be a part of. Iʼm eager to bring my problem-solving skills, technical expertise, and enthusiasm for learning to your team.

Iʼd welcome the opportunity to discuss how my skills align with the role. Thank you for your time, and I look
forward to the possibility of contributing to {{companyName}}.

Best regards,
{{userName}}

---
Resume:
{{{resume}}}

---
Job Description:
{{{jobDescription.fullText}}}
---
`;
  for (const key of Object.keys(input)) {
    finalPrompt = finalPrompt.replace(new RegExp('{{{\s*' + key + '\s*}}}', 'g'), (input as any)[key]);
    finalPrompt = finalPrompt.replace(new RegExp('{{' + key + '}}', 'g'), (input as any)[key]);
  }

  const result = await ai.generate({
    prompt: finalPrompt,
    output: { schema: GenerateRecruiterMessageOutputSchema },
  });

  return result.output as GenerateRecruiterMessageOutput;
}





