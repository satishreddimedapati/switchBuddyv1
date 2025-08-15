'use client'

import * as React from "react"
import { DailyTask } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { format, startOfWeek, addDays, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TaskItem } from "./TaskItem";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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


function WeekNavigator({ currentDate, setCurrentDate }: { currentDate: Date, setCurrentDate: (date: Date) => void }) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    return (
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline text-2xl font-bold">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h2>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
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
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);
  
  useEffect(() => {
    if (!user) {
        setTasks([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const formattedWeekStart = format(weekStart, 'yyyy-MM-dd');
    const formattedWeekEnd = format(weekEnd, 'yyyy-MM-dd');

    const q = query(
        collection(db, "daily_tasks"), 
        where("userId", "==", user.uid),
        where("date", ">=", formattedWeekStart),
        where("date", "<=", formattedWeekEnd)
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
  }, [user, currentDate]);
  
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
  
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);

    if (loading) {
        return (
            <div className="space-y-4">
                <WeekNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        )
    }

    const hasTasksThisWeek = tasks.length > 0;

    return (
      <>
          <WeekNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
           <div className="space-y-8">
            {days.map(day => {
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
                                <TaskItem key={task.id} task={task} onEdit={handleEdit} />
                            ))}
                        </div>
                    </div>
                )
            })}
             {!hasTasksThisWeek && !loading && (
                <div className="text-center py-10 border rounded-lg">
                    <p className="text-muted-foreground">No tasks scheduled for this week.</p>
                </div>
            )}
        </div>
          <ScheduleTaskForm 
              isOpen={isFormOpen} 
              onOpenChange={handleFormClose}
              task={editingTask}
              prefillData={prefillData}
          />
      </>
    )
}
