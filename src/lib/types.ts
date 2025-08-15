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
