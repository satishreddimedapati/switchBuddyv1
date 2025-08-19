
'use server';

/**
 * @fileOverview A flow to generate a personalized, quick interview roadmap.
 */

import { ai } from '@/ai/genkit';
import { GenerateQuickRoadmapInputSchema, GenerateQuickRoadmapOutputSchema } from '@/lib/types';
import { z } from 'zod';
import { addDays, format, getISOWeek } from 'date-fns';

export type GenerateQuickRoadmapInput = z.infer<typeof GenerateQuickRoadmapInputSchema>;
export type GenerateQuickRoadmapOutput = z.infer<typeof GenerateQuickRoadmapOutputSchema>;

export async function generateQuickRoadmap(input: GenerateQuickRoadmapInput): Promise<GenerateQuickRoadmapOutput> {
    return generateQuickRoadmapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuickRoadmapPrompt',
  input: { schema: GenerateQuickRoadmapInputSchema },
  output: { schema: GenerateQuickRoadmapOutputSchema },
  prompt: `You are an expert career coach creating a hyper-focused interview preparation plan.

The user has an interview in {{daysToPrepare}} days for a {{role}} position at {{company}}.

User's self-assessment of skills:
- Tech Stack: {{#each techStack}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{#if selfAssessment}}
- Strengths & Weaknesses: "{{selfAssessment}}"
{{/if}}

Your task is to generate a day-by-day study plan for the next {{daysToPrepare}} days. The plan should be intense and practical.

Rules:
1.  Create exactly {{daysToPrepare}} daily tasks.
2.  Prioritize topics based on the user's self-assessment. Allocate more time and deeper dives for weak areas. Cover strong areas with quick revision tasks.
3.  Each day must have a specific, actionable topic. Examples: "Data Structures: Advanced Trees & Graphs", "Company Research: Culture & Products", "Behavioral: STAR Method Practice".
4.  Include a mix of technical skills, behavioral preparation, and company-specific research.
5.  For each day, suggest a 'challenge' that forces practical application, like "Solve 2 hard LeetCode problems on this topic" or "Draft 3 stories for behavioral questions".
6.  Suggest a 'resource_type' for each day, like 'Video', 'Article', 'Interactive Tutorial', or 'Chat Lessons'.
7.  The entire plan should be logically sequenced, starting with fundamentals and building up to mock interviews or final reviews.
8.  Format the output as a single JSON object with a "weeks" key, containing one "week" with all the daily tasks.
`,
});

const generateQuickRoadmapFlow = ai.defineFlow(
  {
    name: 'generateQuickRoadmapFlow',
    inputSchema: GenerateQuickRoadmapInputSchema,
    outputSchema: GenerateQuickRoadmapOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output || !output.weeks || output.weeks.length === 0 || output.weeks[0].daily_tasks.length === 0) {
        throw new Error("The AI failed to generate a valid roadmap structure. Please try again.");
    }

    // The AI returns the plan in a single week. We need to assign dates.
    const tasks = output.weeks[0].daily_tasks;
    let currentDate = new Date();
    
    const datedTasks = tasks.map((task, index) => {
        const taskDate = addDays(currentDate, index);
        return {
            ...task,
            date: format(taskDate, 'yyyy-MM-dd'),
            day: format(taskDate, 'EEEE'),
        };
    });

    // Re-structure back into the expected output format
    const finalRoadmap: GenerateQuickRoadmapOutput = {
      weeks: [
        {
          week: 1,
          theme: `Your ${input.daysToPrepare}-Day Interview Prep Plan`,
          daily_tasks: datedTasks,
        },
      ],
    };
    
    return finalRoadmap;
  }
);
