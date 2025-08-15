'use client'

import * as React from "react"
import { DailyTask } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { format, startOfWeek, addDays, endOfWeek, subWeeks, addWeeks, parse } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    return `${hour.toString().padStart(2, '0')}:00`;
});

const categoryColors: { [key in DailyTask['type']]: string } = {
  schedule: "bg-blue-100 border-blue-400 text-blue-800",
  interview: "bg-green-100 border-green-400 text-green-800",
};

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

  const { weekStart, weekEnd, weekDays } = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return { weekStart, weekEnd, weekDays };
  }, [currentDate]);
  
  useEffect(() => {
    if (!user) {
        setTasks([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    
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
  }, [user, weekStart, weekEnd]);
  
  const handleEdit = (task: DailyTask) => {
    setEditingTask(task);
    setPrefillData(undefined);
    setIsFormOpen(true);
  };

  const handleCellClick = (date: Date, time: string) => {
    setEditingTask(undefined);
    setPrefillData({ date: format(date, 'yyyy-MM-dd'), time });
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
    setPrefillData(undefined);
  }
  
  const tasksByDateTime = useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    tasks.forEach(task => {
        const key = `${task.date}_${task.time.substring(0, 2)}:00`;
        const existing = map.get(key) || [];
        existing.push(task);
        map.set(key, existing);
    });
    return map;
  }, [tasks]);

    if (loading) {
        return (
            <div className="space-y-4">
                <WeekNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
                <Skeleton className="h-[70vh] w-full" />
            </div>
        )
    }

    return (
      <>
          <WeekNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
            <div className="relative grid grid-cols-[auto_1fr] border-t border-l border-border rounded-lg overflow-hidden">
                {/* Time Gutter */}
                <div className="bg-card">
                    <div className="h-12 border-b border-border"></div>
                    {timeSlots.map(time => (
                        <div key={time} className="h-20 flex items-center justify-center p-2 border-b border-r border-border">
                            <span className="text-xs text-muted-foreground">{format(parse(time, 'HH:mm', new Date()), 'h a')}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {/* Header */}
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="h-12 text-center p-2 border-b border-r border-border">
                            <div className="font-bold text-sm">{format(day, 'EEE')}</div>
                            <div className="text-muted-foreground">{format(day, 'd')}</div>
                        </div>
                    ))}

                    {/* Grid */}
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className="relative border-r border-border">
                            {timeSlots.map(time => {
                                const key = `${format(day, 'yyyy-MM-dd')}_${time}`;
                                const dayTasks = tasksByDateTime.get(key) || [];
                                
                                return (
                                <div 
                                    key={time} 
                                    className="h-20 border-b border-border p-1 relative hover:bg-muted/50 cursor-pointer"
                                    onClick={() => handleCellClick(day, time)}
                                >
                                    {dayTasks.map(task => (
                                        <div 
                                            key={task.id}
                                            onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                                            className={cn("text-[11px] leading-tight p-1 rounded-md border-l-4 cursor-pointer hover:opacity-80", categoryColors[task.type], task.completed && "opacity-50")}
                                        >
                                            <p className="font-bold truncate">{task.title}</p>
                                            <p className="truncate">{task.description}</p>
                                        </div>
                                    ))}
                                </div>
                            )})}
                        </div>
                    ))}
                </div>
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
