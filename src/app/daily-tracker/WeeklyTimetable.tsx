
'use client'

import * as React from "react"
import { DailyTask } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { format, startOfWeek, addDays, endOfWeek } from 'date-fns';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useView } from "./ViewContext";
import { TaskItem } from "./TaskItem";

const timeSlots = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

const categoryColors = {
  schedule: "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200",
  interview: "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200",
};

function groupTasksByDate(tasks: DailyTask[]): Map<string, DailyTask[]> {
    const grouped = new Map<string, DailyTask[]>();
    tasks.forEach(task => {
        const dateKey = task.date;
        const tasksForDate = grouped.get(dateKey) || [];
        tasksForDate.push(task);
        grouped.set(dateKey, tasksForDate);
    });
    // Sort tasks within each day by time
    grouped.forEach((dayTasks, dateKey) => {
        grouped.set(dateKey, dayTasks.sort((a, b) => a.time.localeCompare(b.time)));
    });
    return grouped;
}

function WeeklyListView({ tasks, loading, onEdit }: { tasks: DailyTask[], loading: boolean, onEdit: (task: DailyTask) => void }) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    const hasTasks = tasks.length > 0;

    return (
        <div className="space-y-8">
            {hasTasks ? (
                days.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate.get(dateKey) || [];

                    if (dayTasks.length === 0) return null;

                    return (
                        <div key={day.toISOString()}>
                            <h3 className="text-xl font-bold mb-4 border-b pb-2">
                                {format(day, 'EEEE, MMMM d')}
                            </h3>
                            <div className="space-y-4">
                                {dayTasks.map(task => (
                                    <TaskItem key={task.id} task={task} onEdit={onEdit} />
                                ))}
                            </div>
                        </div>
                    )
                })
            ) : (
                 <div className="text-center py-10 border rounded-lg">
                    <p className="text-muted-foreground">No tasks scheduled for this week.</p>
                </div>
            )}
        </div>
    )
}

export function WeeklyTimetable() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | undefined>(undefined);
  const [prefillData, setPrefillData] = useState<{ date: string; time: string } | undefined>(undefined);
  const { view } = useView();
  
  useEffect(() => {
    if (!user) {
        setTasks([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    const q = query(
        collection(db, "daily_tasks"), 
        where("userId", "==", user.uid),
        where("date", ">=", format(weekStart, 'yyyy-MM-dd')),
        where("date", "<=", format(weekEnd, 'yyyy-MM-dd'))
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
        setTasks(fetchedTasks);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching week's tasks: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const tasksByDateTime = useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    tasks.forEach(task => {
      const key = `${task.date}_${task.time}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  const handleCellClick = (date: Date, time: string) => {
    setEditingTask(undefined);
    setPrefillData({ date: format(date, 'yyyy-MM-dd'), time });
    setIsFormOpen(true);
  };

  const handleEdit = (task: DailyTask) => {
    setEditingTask(task);
    setPrefillData(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
    setPrefillData(undefined);
  }
  
  if (view === 'list') {
      return (
        <>
            <WeeklyListView tasks={tasks} loading={loading} onEdit={handleEdit} />
            <ScheduleTaskForm 
                isOpen={isFormOpen} 
                onOpenChange={handleFormClose}
                task={editingTask}
                prefillData={prefillData}
            />
        </>
      )
  }

  if (loading) {
    return (
        <div className="space-y-2 overflow-x-auto">
             <h2 className="font-headline text-2xl font-bold mb-4">This Week</h2>
            <div className="grid grid-cols-8 min-w-[1000px] gap-px">
                 <Skeleton className="h-12 w-full col-span-8" />
                 {Array.from({length: 17 * 8}).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                 ))}
            </div>
        </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <h2 className="font-headline text-2xl font-bold mb-4">This Week</h2>
      <div className="grid grid-cols-8 min-w-[1000px] border rounded-lg">
        {/* Header */}
        <div className="p-2 border-b font-semibold sticky top-0 bg-card z-10">Time</div>
        {days.map(day => (
          <div key={day.toISOString()} className="p-2 border-b font-semibold text-center sticky top-0 bg-card z-10">
            {format(day, 'EEE')} <br/>
            <span className="text-sm font-normal text-muted-foreground">{format(day, 'dd')}</span>
          </div>
        ))}

        {/* Body */}
        {timeSlots.map(time => (
          <React.Fragment key={time}>
            <div className="p-2 border-r border-b font-mono text-sm flex items-center justify-center">{format(new Date(`1970-01-01T${time}`), "h a")}</div>
            {days.map(day => {
              const cellDate = format(day, 'yyyy-MM-dd');
              const cellKey = `${cellDate}_${time}`;
              const tasksInSlot = tasksByDateTime.get(cellKey) || [];
              
              return (
                <div 
                  key={day.toISOString()} 
                  className="p-1 border-r border-b min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors group/cell"
                  onClick={() => handleCellClick(day, time)}
                >
                  <ul className="space-y-1">
                    {tasksInSlot.map(task => (
                        <li key={task.id} className={cn("text-xs p-1 rounded-md border", categoryColors[task.type])} onClick={(e) => { e.stopPropagation(); handleEdit(task)}}>
                            {task.title}
                        </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      <ScheduleTaskForm 
        isOpen={isFormOpen} 
        onOpenChange={handleFormClose}
        task={editingTask}
        prefillData={prefillData}
      />
    </div>
  );
}
