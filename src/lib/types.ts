export type JobApplication = {
  id: string;
  company: string;
  title: string;
  stage: KanbanColumnId;
  logoUrl?: string;
};

export type KanbanColumnId = 'Wishlist' | 'Applying' | 'Interview' | 'Offer' | 'Rejected';

export type KanbanColumnData = {
  id: KanbanColumnId;
  title: string;
  jobs: JobApplication[];
};

export type DailyTask = {
    id: string;
    time: string; // e.g., "08:00"
    title: string;
    description?: string;
    type: 'schedule' | 'interview';
    date: string; // e.g., "YYYY-MM-DD"
    completed: boolean;
};
