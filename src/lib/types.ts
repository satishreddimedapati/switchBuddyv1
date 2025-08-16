import {z} from 'zod';
import type { Timestamp } from 'firebase/firestore';

export type JobApplication = {
  id: string;
  company: string;
  title: string;
  stage: KanbanColumnId;
  logoUrl?: string;
  userId: string;
};

export type KanbanColumnId =
  | 'Wishlist'
  | 'Applying'
  | 'Interview'
  | 'Offer'
  | 'Rejected';

export type KanbanColumnData = {
  id: KanbanColumnId;
  title: string;
  jobs: JobApplication[];
};

export const DailyTaskSchema = z.object({
  id: z.string(),
  time: z.string(), // e.g., "08:00"
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['schedule', 'interview']),
  date: z.string(), // e.g., "YYYY-MM-DD"
  completed: z.boolean(),
  userId: z.string(),
});

export type DailyTask = z.infer<typeof DailyTaskSchema>;

// AI Scheduler Schemas

// Schema for a scheduled task item in the output
export const ScheduledTaskSchema = z.object({
  time: z.string().describe('The time for the task, e.g., "06:00 AM".'),
  task: z.string().describe('The name or description of the task.'),
  motivation: z.string().describe('A short motivational note for the task.'),
});
export type ScheduledTask = z.infer<typeof ScheduledTaskSchema>;


// Input for generating a daily plan - now simplified
export const GenerateDailyPlanInputSchema = z.object({});
export type GenerateDailyPlanInput = z.infer<
  typeof GenerateDailyPlanInputSchema
>;

// Output for a generated daily plan
export const GenerateDailyPlanOutputSchema = z.object({
  optimizedSchedule: z
    .array(ScheduledTaskSchema)
    .describe(
      'An optimized, full-day schedule from 6:00 AM to 10:00 PM.'
    ),
});
export type GenerateDailyPlanOutput = z.infer<
  typeof GenerateDailyPlanOutputSchema
>;

// Input for generating a daily summary
export const GenerateDailySummaryInputSchema = z.object({
  tasks: z
    .array(DailyTaskSchema)
    .describe("A list of today's tasks, including their completion status."),
});
export type GenerateDailySummaryInput = z.infer<
  typeof GenerateDailySummaryInputSchema
>;

// Output for a generated daily summary
export const GenerateDailySummaryOutputSchema = z.object({
  motivationalSummary: z
    .string()
    .describe("A short, encouraging summary of the day's achievements."),
  nextDayPriorities: z
    .array(z.string())
    .describe('The top 3 recommended priority tasks for tomorrow.'),
});
export type GenerateDailySummaryOutput = z.infer<
  typeof GenerateDailySummaryOutputSchema
>;

// Interview Topic Scheduler Schemas
export const GenerateInterviewTopicScheduleInputSchema = z.object({
  topic: z.string().describe('The interview topic, e.g., ".NET", "Angular", "Python"'),
  numberOfDays: z.number().int().positive().describe('The number of days to generate a schedule for.'),
  startDate: z.string().describe('The start date in YYYY-MM-DD format.'),
});
export type GenerateInterviewTopicScheduleInput = z.infer<typeof GenerateInterviewTopicScheduleInputSchema>;

export const InterviewPrepTaskSchema = z.object({
    date: z.string().describe("The date for the subtopic in YYYY-MM-DD format."),
    topic: z.string().describe("The main topic being studied."),
    subtopic: z.string().describe("A specific interview prep subtopic for that day.")
});

export const GenerateInterviewTopicScheduleOutputSchema = z.object({
  schedule: z.array(InterviewPrepTaskSchema).describe("The generated day-by-day interview preparation schedule."),
});
export type GenerateInterviewTopicScheduleOutput = z.infer<typeof GenerateInterviewTopicScheduleOutputSchema>;


// MOCK INTERVIEW SCHEMAS

// Firestore: interview_plans
export const InterviewPlanSchema = z.object({
  id: z.string().optional(), // ID is not present on creation
  userId: z.string(),
  topic: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  durationMinutes: z.number().int(),
  numberOfQuestions: z.number().int(),
  totalInterviews: z.number().int(),
  completedInterviews: z.number().int(),
  createdAt: z.union([z.instanceof(Date), z.string()]), // Allow Date or ISO string
});

export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

// Helper to convert Firestore data to a serializable InterviewPlan
export function toSerializableInterviewPlan(docData: any): Omit<InterviewPlan, 'id'> {
    const { createdAt, ...rest } = docData;
    return {
        ...rest,
        createdAt: (createdAt as Timestamp).toDate().toISOString(),
    };
}


// Firestore: interview_sessions
export const InterviewSessionQuestionSchema = z.object({
    qNo: z.number(),
    question: z.string(),
    answer: z.string().optional(),
    aiReview: z.string().optional(),
    rating: z.number().min(1).max(10).optional(),
});
export type InterviewSessionQuestion = z.infer<typeof InterviewSessionQuestionSchema>;

export const InterviewSessionSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    planId: z.string(),
    interviewNumber: z.number(),
    status: z.enum(['in-progress', 'completed', 'draft']),
    questions: z.array(InterviewSessionQuestionSchema),
    overallScore: z.number().optional(),
    startedAt: z.union([z.any(), z.string()]), // Using any for Firestore Timestamps
    completedAt: z.union([z.any(), z.string()]).optional(),
});
export type InterviewSession = z.infer<typeof InterviewSessionSchema>;

export function toSerializableInterviewSession(docData: any): Omit<InterviewSession, 'id'> {
    const { startedAt, completedAt, ...rest } = docData;
    const serializable: Omit<InterviewSession, 'id'> & { completedAt?: string, startedAt?: string } = { ...rest };

    if (startedAt) {
      if (typeof startedAt === 'string') {
        serializable.startedAt = startedAt;
      } else if (startedAt.toDate) { // Check if it's a Firestore Timestamp
        serializable.startedAt = (startedAt as Timestamp).toDate().toISOString();
      }
    }

    if (completedAt) {
        if (typeof completedAt === 'string') {
            serializable.completedAt = completedAt;
        } else if (completedAt.toDate) { // Check if it's a Firestore Timestamp
            serializable.completedAt = (completedAt as Timestamp).toDate().toISOString();
        }
    }
    return serializable as Omit<InterviewSession, 'id'>;
}


// Genkit Flow: Generate single Interview Question (DEPRECATED)
export const InterviewQuestionRequestSchema = z.object({
    topic: z.string(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});
export type InterviewQuestionRequest = z.infer<typeof InterviewQuestionRequestSchema>;

// Genkit Flow: Generate multiple interview questions
export const GenerateInterviewQuestionsRequestSchema = z.object({
    topic: z.string(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    numberOfQuestions: z.number().int().min(1),
});
export type GenerateInterviewQuestionsRequest = z.infer<typeof GenerateInterviewQuestionsRequestSchema>;

export const GenerateInterviewQuestionsResponseSchema = z.object({
    questions: z.array(z.string()).describe("An array of generated interview questions."),
});
export type GenerateInterviewQuestionsResponse = z.infer<typeof GenerateInterviewQuestionsResponseSchema>;


// Genkit Flow: Evaluate single answer (DEPRECATED)
export const AnswerEvaluationRequestSchema = z.object({
    question: z.string(),
    answer: z.string(),
});
export type AnswerEvaluationRequest = z.infer<typeof AnswerEvaluationRequestSchema>;

export const AnswerEvaluationResponseSchema = z.object({
    feedback: z.string().describe("Constructive feedback on the answer."),
    rating: z.number().min(1).max(10).describe("A rating from 1 to 10."),
});
export type AnswerEvaluationResponse = z.infer<typeof AnswerEvaluationResponseSchema>;

// Genkit Flow: Evaluate multiple answers
const QAPairSchema = z.object({
    qNo: z.number(),
    question: z.string(),
    answer: z.string(),
});

export const EvaluateInterviewAnswersRequestSchema = z.object({
    qa_pairs: z.array(QAPairSchema),
});
export type EvaluateInterviewAnswersRequest = z.infer<typeof EvaluateInterviewAnswersRequestSchema>;

const EvaluationSchema = z.object({
    qNo: z.number(),
    feedback: z.string().describe("Constructive feedback on the answer."),
    rating: z.number().min(1).max(10).describe("A rating from 1 to 10."),
});

export const EvaluateInterviewAnswersResponseSchema = z.object({
    evaluations: z.array(EvaluationSchema).describe("An array of evaluations for each question-answer pair."),
});
export type EvaluateInterviewAnswersResponse = z.infer<typeof EvaluateInterviewAnswersResponseSchema>;

// NETWORKING HUB SCHEMAS

export const HrContactSchema = z.object({
    id: z.string(),
    userId: z.string(),
    jobRole: z.string(),
    hrName: z.string(),
    company: z.string(),
    linkedinUrl: z.string().url(),
    email: z.string().email().optional(),
});
export type HrContact = z.infer<typeof HrContactSchema>;

export const NetworkingActivitySchema = z.object({
    id: z.string(),
    userId: z.string(),
    date: z.string(), // ISO String
    note: z.string(),
    status: z.enum(['Pending', 'Replied', 'No Response']),
});
export type NetworkingActivity = z.infer<typeof NetworkingActivitySchema>;

// JOB INTELLIGENCE SCHEMAS

export const GetCompanyInsightsInputSchema = z.object({
  companyName: z.string().describe('The name of the company to get insights for.'),
});
export type GetCompanyInsightsInput = z.infer<typeof GetCompanyInsightsInputSchema>;

export const GetCompanyInsightsOutputSchema = z.object({
  culture: z.string().describe("A summary of the company's work culture."),
  interviewProcess: z.string().describe('A summary of the typical interview process.'),
  pros: z.array(z.string()).describe('A list of common pros of working at the company.'),
  cons: z.array(z.string()).describe('A list of common cons of working at the company.'),
});
export type GetCompanyInsightsOutput = z.infer<typeof GetCompanyInsightsOutputSchema>;


export const GetSalaryBenchmarkInputSchema = z.object({
  jobRole: z.string().describe('The job role, e.g., "Angular Developer".'),
  location: z.string().describe('The city or region, e.g., "Bangalore".'),
});
export type GetSalaryBenchmarkInput = z.infer<typeof GetSalaryBenchmarkInputSchema>;

export const GetSalaryBenchmarkOutputSchema = z.object({
  salaryRange: z.string().describe('The estimated salary range, e.g., "₹8.5 LPA – ₹12 LPA".'),
  commentary: z.string().describe('A brief commentary on the salary range and market conditions.'),
});
export type GetSalaryBenchmarkOutput = z.infer<typeof GetSalaryBenchmarkOutputSchema>;


export const GetMarketIntelligenceInputSchema = z.object({
  jobRole: z.string().describe('The job role, e.g., "Software Engineer".'),
  companyName: z.string().describe('The name of the target company.'),
  location: z.string().describe('The city or region, e.g., "Bangalore", or multiple locations like "Bangalore, Hyderabad".'),
});

export const GetMarketIntelligenceOutputSchema = z.object({
  growthPath: z.array(
    z.object({
        role: z.string().describe("A role in the career path, e.g., 'Senior .NET Developer'."),
        salaryRange: z.string().describe("The typical salary range for this role, e.g., '₹10–14 LPA'.")
    })
  ).describe('A typical career progression path with salary benchmarks for each level.'),

  skillsInDemand: z.array(z.string()).describe('A list of trending skills and tools for this role, e.g., ["ASP.NET Core", "Azure", "Microservices"].'),
  
  locationComparison: z.object({
    commentary: z.string().describe('A comparison of the locations provided, focusing on salary differences and cost of living.'),
  }),

  topCompaniesHiring: z.array(z.string()).describe('A list of 3-5 companies currently hiring for this role in the specified locations.'),

  alumniInsights: z.object({
    avgTenure: z.string().describe('The average tenure for this role at the company.'),
    careerSwitches: z.array(z.string()).describe('Examples of common career switches or paths alumni take, e.g., "TCS -> Senior Developer at Infosys".'),
  }),

  interviewPrep: z.object({
      difficultyRating: z.string().describe('A rating of the interview difficulty, e.g., "Medium", "7/10".'),
      commonQuestionCategories: z.array(z.string()).describe('A list of common question categories for interviews, e.g., "Data structures & algorithms".'),
  }),

  applicationStrategy: z.object({
      bestTimeToApply: z.string().describe('A tip on the best time of year or week to apply for this role.'),
      successRates: z.array(
        z.object({
            method: z.string().describe('The application method, e.g., "Referral".'),
            probability: z.string().describe('The estimated success probability, e.g., "70%".')
        })
      ).describe('A list of application methods and their estimated success probabilities.'),
  })
});

export type GetMarketIntelligenceInput = z.infer<typeof GetMarketIntelligenceInputSchema>;
export type GetMarketIntelligenceOutput = z.infer<typeof GetMarketIntelligenceOutputSchema>;

export const GetPersonalizedSalaryEstimateInputSchema = z.object({
  jobRole: z.string().min(1, 'Job role is required.'),
  yearsOfExperience: z.number().min(0, 'Years of experience cannot be negative.'),
  location: z.string().min(1, 'Location is required.'),
  skills: z.array(z.string()).min(1, 'Please select at least one skill.'),
});
export type GetPersonalizedSalaryEstimateInput = z.infer<typeof GetPersonalizedSalaryEstimateInputSchema>;

export const GetPersonalizedSalaryEstimateOutputSchema = z.object({
  estimatedSalaryRange: z.string().describe('The estimated salary range in LPA, e.g., "₹10 - 12 LPA".'),
  commentary: z.string().describe('A brief commentary explaining how skills and experience affect the estimate.'),
});
export type GetPersonalizedSalaryEstimateOutput = z.infer<typeof GetPersonalizedSalaryEstimateOutputSchema>;

export const highImpactSkills = [
    "React",
    "Angular",
    "Vue.js",
    "Node.js",
    "Python",
    ".NET Core",
    "Java",
    "Spring Boot",
    "Go",
    "AWS",
    "Azure",
    "GCP",
    "Kubernetes",
    "Docker",
    "Terraform",
    "SQL",
    "NoSQL",
    "Microservices",
    "System Design",
    "Machine Learning",
    "Data Science",
    "Cypress",
    "RxJS",
    "NgRx",
];
