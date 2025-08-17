
import { DailyTask } from "@/lib/types";
import { format, isToday, isYesterday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, parseISO } from 'date-fns';

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


export const calculateDayActivity = (tasksForDay: DailyTask[], allTasks: DailyTask[]) => {
    const day = tasksForDay.length > 0 ? tasksForDay[0].date : '';
    
    const rescheduledAwayFromThisDay = allTasks.filter(t => t.rescheduled?.originalDate === day);
    
    const tasksOnThisDay = tasksForDay;

    const completedOnThisDay = tasksOnThisDay.filter(t => t.completed);

    const taskDate = day ? startOfDay(parseISO(day)) : new Date();
    const isPastOrToday = isBefore(taskDate, new Date()) || isToday(taskDate);
    
    const missedOnThisDay = isPastOrToday ? tasksOnThisDay.filter(t => !t.completed) : [];
    
    const allMissedAndRescheduled = [...missedOnThisDay, ...rescheduledAwayFromThisDay];
    const totalTasksForDay = completedOnThisDay.length + allMissedAndRescheduled.length;

    const credits = completedOnThisDay.length;
    const debits = allMissedAndRescheduled.length;

    const completionBonus = totalTasksForDay > 0 && (credits / totalTasksForDay) >= 0.8 ? 5 : 0;
    const missPenalty = isPastOrToday && totalTasksForDay > 0 && (debits / totalTasksForDay) >= 0.5 ? 5 : 0;

    const calculatedCredits = credits + completionBonus;
    const calculatedDebits = debits + missPenalty;

    const net = calculatedCredits - calculatedDebits;

    return {
        credits: calculatedCredits,
        debits: calculatedDebits,
        netChange: net,
        completedTasksList: completedOnThisDay,
        missedTasksList: allMissedAndRescheduled,
        bonus: completionBonus,
        penalty: missPenalty,
    };
};
