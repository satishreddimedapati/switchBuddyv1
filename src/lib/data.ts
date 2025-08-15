import type { KanbanColumnData } from "./types";

export const dashboardStats = [
  {
    title: "Applications Sent",
    value: "24",
    change: "+15%",
    icon: "Briefcase",
  },
  {
    title: "Interviews Scheduled",
    value: "8",
    change: "+20%",
    icon: "Calendar",
  },
  {
    title: "Offers Received",
    value: "2",
    change: "+100%",
    icon: "Award",
  },
  {
    title: "Active Searches",
    value: "35",
    change: "-5%",
    icon: "Search",
  },
];

export const dailyTasks = [
  { id: "task1", label: "Update resume with latest project", completed: true },
  { id: "task2", label: "Apply to 3 new jobs", completed: true },
  { id: "task3", label: "Follow up with recruiter from Acme Corp", completed: false },
  { id: "task4", label: "Practice STAR method for interviews", completed: false },
  { id: "task5", label: "Connect with 1 new person on LinkedIn", completed: true },
];


export const kanbanData: KanbanColumnData[] = [
  {
    id: "Wishlist",
    title: "Wishlist",
    jobs: [
      { id: "job-1", company: "Stripe", title: "Product Manager", stage: "Wishlist", logoUrl: "https://placehold.co/40x40.png" },
      { id: "job-2", company: "Netflix", title: "Software Engineer, L5", stage: "Wishlist", logoUrl: "https://placehold.co/40x40.png" },
    ],
  },
  {
    id: "Applying",
    title: "Applying",
    jobs: [
      { id: "job-3", company: "Google", title: "UX Designer", stage: "Applying", logoUrl: "https://placehold.co/40x40.png" },
      { id: "job-4", company: "Meta", title: "Data Scientist", stage: "Applying", logoUrl: "https://placehold.co/40x40.png" },
      { id: "job-5", company: "Apple", title: "iOS Developer", stage: "Applying", logoUrl: "https://placehold.co/40x40.png" },
    ],
  },
  {
    id: "Interview",
    title: "Interview",
    jobs: [
      { id: "job-6", company: "Amazon", title: "Cloud Solutions Architect", stage: "Interview", logoUrl: "https://placehold.co/40x40.png" },
      { id: "job-7", company: "Microsoft", title: "Product Marketing Manager", stage: "Interview", logoUrl: "https://placehold.co/40x40.png" },
    ],
  },
  {
    id: "Offer",
    title: "Offer",
    jobs: [
       { id: "job-8", company: "Vercel", title: "Frontend Engineer", stage: "Offer", logoUrl: "https://placehold.co/40x40.png" },
    ],
  },
  {
    id: "Rejected",
    title: "Rejected",
    jobs: [
       { id: "job-9", company: "OpenAI", title: "AI Research Scientist", stage: "Rejected", logoUrl: "https://placehold.co/40x40.png" },
    ],
  },
];
