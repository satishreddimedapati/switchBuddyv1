import { DailyTask } from "@/lib/types";

export const groupTasksByTimeOfDay = (tasks: DailyTask[]) => {
  const morning: DailyTask[] = [];
  const afternoon: DailyTask[] = [];
  const evening: DailyTask[] = [];

  tasks.forEach(task => {
    const hour = parseInt(task.time.split(':')[0], 10);
    if (hour < 12) {
      morning.push(task);
    } else if (hour < 18) {
      afternoon.push(task);
    } else {
      evening.push(task);
    }
  });

  return { morning, afternoon, evening };
};
