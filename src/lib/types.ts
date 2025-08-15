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
  id: z.string().describe('The original ID of the task.'),
  title: z.string(),
  time: z
    .string()
    .describe('The newly scheduled time for the task, in HH:mm format.'),
  type: z.enum(['task', 'break']),
  description: z.string().optional(),
});

// Input for generating a daily plan
export const GenerateDailyPlanInputSchema = z.object({
  tasks: z.array(DailyTaskSchema).describe('The list of tasks to be scheduled.'),
  startTime: z
    .string()
    .describe('The start of the available time window (e.g., "09:00").'),
  endTime: z
    .string()
    .describe('The end of the available time window (e.g., "21:00").'),
});
export type GenerateDailyPlanInput = z.infer<
  typeof GenerateDailyPlanInputSchema
>;

// Output for a generated daily plan
export const GenerateDailyPlanOutputSchema = z.object({
  optimizedSchedule: z
    .array(ScheduledTaskSchema)
    .describe(
      'An optimized schedule, including the original tasks and short breaks. Breaks should be about 10-15 minutes long.'
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
