import {z} from 'zod';

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
