export type JobApplication = {
  id: string;
  company: string;
  title: string;
  stage: 'Wishlist' | 'Applying' | 'Interview' | 'Offer' | 'Rejected';
  logoUrl?: string;
};

export type KanbanColumnId = 'Wishlist' | 'Applying' | 'Interview' | 'Offer' | 'Rejected';

export type KanbanColumnData = {
  id: KanbanColumnId;
  title: string;
  jobs: JobApplication[];
};
