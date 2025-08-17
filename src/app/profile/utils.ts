
import type { DailyTask } from '@/lib/types';
import { format, isToday, isYesterday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isBefore, parseISO } from 'date-fns';

export const STARTING_BALANCE = 0;

export interface DayActivity {
    date: string;
    label: string;
    credits: number;
    debits: number;
    netChange: number;
    completedTasksList: DailyTask[];
    missedTasksList: DailyTask[];
    bonus: number;
    penalty: number;
}

export const calculateDayActivity = (tasksForDay: DailyTask[], allTasks: DailyTask[]): Omit<DayActivity, 'date' | 'label'> => {
    const day = tasksForDay.length > 0 ? tasksForDay[0].date : '';
    
    // Find tasks originally scheduled for this day but were rescheduled
    const rescheduledAwayFromThisDay = allTasks.filter(t => t.rescheduled?.originalDate === day);
    
    // Tasks currently on this day
    const tasksOnThisDay = tasksForDay;

    // Filter out tasks that were rescheduled away from this day but might still appear if the date filter is wide
    const completedOnThisDay = tasksOnThisDay.filter(t => t.completed);

    const taskDate = startOfDay(parseISO(day));
    const isPastOrToday = isBefore(taskDate, new Date()) || isToday(taskDate);
    
    // Missed tasks are tasks ON this day that are not complete, OR tasks that were moved AWAY from this day
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
