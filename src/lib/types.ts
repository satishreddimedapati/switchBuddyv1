

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

export const RescheduledTaskSchema = z.object({
    originalDate: z.string(),
    reason: z.string(),
});
export type RescheduledTask = z.infer<typeof RescheduledTaskSchema>;

export const DailyTaskSchema = z.object({
  id: z.string(),
  time: z.string(), // e.g., "08:00"
  title: z.string(),
  description: z.string().optional(),
  type: z.enum(['schedule', 'interview']),
  date: z.string(), // e.g., "YYYY-MM-DD"
  completed: z.boolean(),
  userId: z.string(),
  rescheduled: RescheduledTaskSchema.optional(),
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

// Schema for a missed task in the summary output
const MissedTaskSchema = z.object({
    title: z.string().describe("The title of the missed task."),
    rescheduledTime: z.string().describe("The suggested rescheduled time for tomorrow, e.g., 'Tomorrow 8AM'."),
});
export type MissedTask = z.infer<typeof MissedTaskSchema>;


// Output for a generated daily summary
export const GenerateDailySummaryOutputSchema = z.object({
  motivationalSummary: z
    .string()
    .describe("A short, encouraging summary of the user's accomplishments."),
  nextDayPriorities: z
    .array(z.string())
    .describe('The top 3 recommended priority tasks for tomorrow.'),
   completedTasks: z.number().describe('The number of tasks completed today.'),
   totalTasks: z.number().describe('The total number of tasks for today.'),
   streak: z.number().describe('The current number of consecutive days with at least one completed task.'),
   missedTasks: z.array(MissedTaskSchema).describe("A list of incomplete tasks from today, with a suggested rescheduled time for tomorrow."),
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

export const GenerateInterviewPlanInputSchema = z.object({
    resume: z.string().describe("The user's resume as plain text."),
    jobDescription: z.string().describe("The job description as plain text."),
});
export type GenerateInterviewPlanInput = z.infer<typeof GenerateInterviewPlanInputSchema>;

export const GenerateInterviewPlanOutputSchema = z.object({
    topic: z.string().describe("The suggested topic for the interview plan."),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe("The suggested difficulty for the plan."),
    questions: z.string().describe("A newline-separated string of suggested interview questions."),
    durationMinutes: z.coerce.number().int().optional(),
    totalInterviews: z.coerce.number().int().optional(),
});
export type GenerateInterviewPlanOutput = z.infer<typeof GenerateInterviewPlanOutputSchema>;

export const GetCompanyInsightsInputSchema = z.object({
  companyName: z.string().describe('The name of the company to get insights for.'),
});
export type GetCompanyInsightsInput = z.infer<typeof GetCompanyInsightsInputSchema>;

export const GetCompanyInsightsOutputSchema = z.object({
  culture: z.string().describe("A summary of the company's work culture."),
  interviewProcess: z.string().describe('A typical summary of the interview process.'),
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
    commentary: z.string().describe('A comparison of the locations provided, focusing on salary and cost of living.'),
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

export const GenerateRecruiterMessageInputSchema = z.object({
    resume: z.string().describe("The user's resume as plain text."),
    jobDescription: z.object({
        fullText: z.string().describe("The full job description as plain text."),
        jobTitle: z.string().describe("The job title, extracted from the job description."),
    }),
    userName: z.string().describe("The user's full name."),
    userContactInfo: z.string().describe("The user's contact info (e.g., phone, email, LinkedIn)."),
    companyName: z.string().describe("The name of the company they are applying to."),
    currentDate: z.string().describe("The current date, formatted as 'Month Day, Year'."),
});
export type GenerateRecruiterMessageInput = z.infer<typeof GenerateRecruiterMessageInputSchema>;

export const GenerateRecruiterMessageOutputSchema = z.object({
    recruiterMessage: z.string().describe("The generated cover letter for the recruiter."),
});
export type GenerateRecruiterMessageOutput = z.infer<typeof GenerateRecruiterMessageOutputSchema>;

export const TailorResumeInputSchema = z.object({
  resume: z.string().describe("The user's resume as plain text."),
  jobDescription: z.string().describe("The job description as plain text."),
});

export const TailorResumeOutputSchema = z.object({
  fitScore: z.number().describe("The percentage fit score."),
  breakdown: z.object({
    skillsMatch: z.string().describe("A brief analysis of skills match."),
    experienceMatch: z.string().describe("A brief analysis of experience match."),
    educationMatch: z.string().describe("A brief analysis of education match."),
  }),
  missingSkills: z.array(z.string()).describe("A list of missing skills."),
  tailoredResume: z.string().describe("The full text of the tailored resume."),
});

export type TailorResumeInput = z.infer<typeof TailorResumeInputSchema>;
export type TailorResumeOutput = z.infer<typeof TailorResumeOutputSchema>;


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

export const SendDailyDebriefInputSchema = GenerateDailySummaryOutputSchema;
export type SendDailyDebriefInput = z.infer<typeof SendDailyDebriefInputSchema>;

export const SendDailyDebriefOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});
export type SendDailyDebriefOutput = z.infer<typeof SendDailyDebriefOutputSchema>;

export const UserRewardSchema = z.object({
    id: z.string(),
    userId: z.string(),
    rewardId: z.number(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    cost: z.number(),
    status: z.enum(['unclaimed', 'claimed']),
    redeemedAt: z.string(), 
    claimedAt: z.string().optional(),
});
export type UserReward = z.infer<typeof UserRewardSchema>;

export function toSerializableUserReward(docData: any): UserReward {
    const { redeemedAt, claimedAt, ...rest } = docData;
    const serializable: any = { ...rest };

    if (redeemedAt && redeemedAt.toDate) {
        serializable.redeemedAt = (redeemedAt as Timestamp).toDate().toISOString();
    }
    if (claimedAt && claimedAt.toDate) {
        serializable.claimedAt = (claimedAt as Timestamp).toDate().toISOString();
    }

    return serializable as UserReward;
}

// AI Learning Schemas
export const TopicHistorySchema = z.object({
    emoji: z.string().describe("A single emoji that represents the fact."),
    title: z.string().describe("A short, catchy title for the fact (e.g., 'The Inventor')."),
    fact: z.string().describe("A single, interesting fact or piece of trivia about the topic."),
});
export type TopicHistory = z.infer<typeof TopicHistorySchema>;

export const TopicHistoryInputSchema = z.object({
  topic: z.string().describe('The technology topic to get history for.'),
});
export type TopicHistoryInput = z.infer<typeof TopicHistoryInputSchema>;

export const TopicHistoryOutputSchema = z.object({
  history: z.array(TopicHistorySchema).length(7).describe('An array of 7 interesting historical facts about the topic.'),
});

export type TopicHistoryOutput = z.infer<typeof TopicHistoryOutputSchema>;

export const DailyTaskItemSchema = z.object({
    day: z.string().describe("The day of the week, e.g., 'Monday'."),
    date: z.string().optional().describe("The specific date for the task in YYYY-MM-DD format."),
    topic: z.string(),
    resource_type: z.string().describe("The type of resource, e.g. 'Video', 'Article'."),
    resource_link: z.string().optional().describe("A URL to the resource."),
    challenge: z.string().optional(),
    completed: z.boolean().default(false).optional(),
});
export type DailyTaskItem = z.infer<typeof DailyTaskItemSchema>;

const WeeklyPlanSchema = z.object({
    week: z.number(),
    theme: z.string(),
    daily_tasks: z.array(DailyTaskItemSchema),
});
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;

export const RoadmapGenerationOutputSchema = z.object({
    weeks: z.array(WeeklyPlanSchema),
});
export type RoadmapGenerationOutput = z.infer<typeof RoadmapGenerationOutputSchema>;


export const LessonCardSchema = z.object({
    card_type: z.enum([
        'simple_explanation',
        'real_world_example',
        'pros_cons',
        'when_to_use',
        'interview_qa',
        'fun_fact',
        'company_use_cases',
    ]),
    title: z.string(),
    content: z.string().describe("Main text content, analogy, or question. For 'interview_qa', use 'Q: ... A: ...' format. For 'pros_cons', use 'Pros:\\n- ...\\n\\nCons:\\n- ...' format."),
    visual: z.string().describe("A single, relevant emoji."),
});
export type LessonCard = z.infer<typeof LessonCardSchema>;

export const InteractiveLessonSchema = z.object({
    title: z.string().describe("An engaging title for the lesson, matching the topic."),
    cards: z.array(LessonCardSchema).min(7).max(8).describe("A deck of exactly 7-8 micro-lesson cards in a logical sequence."),
});
export type InteractiveLesson = z.infer<typeof InteractiveLessonSchema>;


export const LearningRoadmapSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  topic: z.string(),
  timePerDay: z.number(), // in minutes
  duration: z.number(), // in days
  startDate: z.string(), // ISO String
  endDate: z.string(), // ISO String
  learnOnWeekends: z.boolean(),
  goals: z.array(z.string()),
  experienceLevel: z.string(),
  techFocus: z.array(z.string()),
  learningStyle: z.string(),
  preferredChannel: z.string().optional(),
  roadmap: RoadmapGenerationOutputSchema,
  history: z.array(TopicHistorySchema).optional(),
  lessons: z.record(z.string(), z.array(InteractiveLessonSchema)).optional(),
  createdAt: z.any(),
});
export type LearningRoadmap = z.infer<typeof LearningRoadmapSchema>;

export function toSerializableLearningRoadmap(docData: any): LearningRoadmap {
    const { createdAt, startDate, endDate, ...rest } = docData;
    const serializable: any = { ...rest };

    if (createdAt?.toDate) {
      serializable.createdAt = (createdAt as Timestamp).toDate().toISOString();
    }
     if (startDate) {
        if (typeof startDate === 'string') {
            serializable.startDate = startDate;
        } else if (startDate?.toDate) {
            serializable.startDate = (startDate as Timestamp).toDate().toISOString();
        }
    }
     if (endDate) {
        if (typeof endDate === 'string') {
            serializable.endDate = endDate;
        } else if (endDate?.toDate) {
            serializable.endDate = (endDate as Timestamp).toDate().toISOString();
        }
    }
    
    return serializable as LearningRoadmap;
}


export const RoadmapGenerationInputSchema = z.object({
    topic: z.string(),
    timePerDay: z.number(),
    duration: z.number(),
    startDate: z.string().describe("The start date for the roadmap in YYYY-MM-DD format."),
    learnOnWeekends: z.boolean(),
    goals: z.array(z.string()),
    experienceLevel: z.string(),
    techFocus: z.array(z.string()),
    learningStyle: z.string(),
    preferredChannel: z.string().optional(),
    history: z.array(TopicHistorySchema).optional(),
});
export type RoadmapGenerationInput = z.infer<typeof RoadmapGenerationInputSchema>;


// Channel Suggestions
export const ChannelSuggestionInputSchema = z.object({
  topic: z.string().describe('The main topic the user wants to learn.'),
});
export type ChannelSuggestionInput = z.infer<typeof ChannelSuggestionInputSchema>;

export const ChannelSuggestionOutputSchema = z.object({
  channels: z.array(z.string()).describe('A list of 3-5 recommended YouTube channel or creator names.'),
});
export type ChannelSuggestionOutput = z.infer<typeof ChannelSuggestionOutputSchema>;

// Chat Lessons
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'thinking']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const GenerateChatLessonInputSchema = z.object({
  topic: z.string().describe('The topic for the chat lesson.'),
  history: z.array(ChatMessageSchema).describe('The conversation history so far.'),
  intent: z.string().optional().describe("A specific user intent to guide the AI's response style, e.g., 'Explain for an interview' or 'Translate to Hindi'."),
});
export type GenerateChatLessonInput = z.infer<typeof GenerateChatLessonInputSchema>;

export const GenerateChatLessonOutputSchema = z.object({
  response: z.string().describe("The AI's response to continue the conversation."),
});
export type GenerateChatLessonOutput = z.infer<typeof GenerateChatLessonOutputSchema>;

// Interactive Card-Based Lessons

export const GenerateInteractiveLessonInputSchema = z.object({
  topic: z.string().describe("The topic for the interactive lesson."),
  experienceLevel: z.string().describe("The user's experience level (e.g., Beginner, Intermediate)."),
});
export type GenerateInteractiveLessonInput = z.infer<typeof GenerateInteractiveLessonInputSchema>;

export const GetPersonalizedSalaryEstimateInputSchema = z.object({
  jobRole: z.string().describe('The job role, e.g., "Software Engineer".'),
  yearsOfExperience: z.number().describe("The user's years of professional experience."),
  location: z.string().describe('The city or region for the job.'),
  skills: z.array(z.string()).describe('A list of key skills the user possesses.'),
});
export type GetPersonalizedSalaryEstimateInput = z.infer<typeof GetPersonalizedSalaryEstimateInputSchema>;

export const GetPersonalizedSalaryEstimateOutputSchema = z.object({
  estimatedSalaryRange: z.string().describe('The calculated salary range in LPA, e.g., "15 LPA - 20 LPA".'),
  commentary: z.string().describe("A brief explanation of how the user's profile affects this estimate."),
});
export type GetPersonalizedSalaryEstimateOutput = z.infer<typeof GetPersonalizedSalaryEstimateOutputSchema>;
