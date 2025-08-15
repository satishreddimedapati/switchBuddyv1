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
