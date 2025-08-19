
'use client'

import * as React from "react"
import { DailyTask } from "@/lib/types";
import { useState, useMemo, useEffect } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { format, startOfWeek, addDays, endOfWeek, subWeeks, addWeeks, parse, isWithinInterval, isToday } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6;
    return `${hour.toString().padStart(2, '0')}:00`;
});

const categoryColors: { [key in DailyTask['type']]: string } = {
  schedule: "bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-300",
  interview: "bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-300",
};

function WeekNavigator({ currentDate, setCurrentDate }: { currentDate: Date, setCurrentDate: (date: Date) => void }) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-center sm:text-left">
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

function MobileWeeklyView({ weekDays, tasks, onEdit, onCellClick }: { weekDays: Date[], tasks: DailyTask[], onEdit: (task: DailyTask) => void, onCellClick: (date: Date, time: string) => void }) {
    return (
        <div className="space-y-4">
            {weekDays.map(day => {
                const dayTasks = tasks.filter(t => t.date === format(day, 'yyyy-MM-dd')).sort((a,b) => a.time.localeCompare(b.time));
                return (
                    <Card key={day.toISOString()} className={cn(isToday(day) && "border-primary")}>
                        <CardHeader className="p-4">
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span>{format(day, 'EEEE')}</span>
                                <span className="text-sm font-normal text-muted-foreground">{format(day, 'MMM d')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                           {dayTasks.length > 0 ? (
                               <div className="space-y-2">
                                   {dayTasks.map(task => (
                                       <div 
                                           key={task.id}
                                           onClick={() => onEdit(task)}
                                           className={cn("text-xs p-2 rounded-md border-l-4 cursor-pointer", categoryColors[task.type], task.completed && "opacity-60")}
                                       >
                                           <p className="font-bold">{task.title}</p>
                                           <p className="text-muted-foreground">{format(parse(task.time, 'HH:mm', new Date()), 'h:mm a')}</p>
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <p className="text-sm text-muted-foreground">No tasks scheduled.</p>
                           )}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}


export function WeeklyTimetable() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [allTasks, setAllTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | undefined>(undefined);
  const [prefillData, setPrefillData] = useState<{ date: string; time: string } | undefined>(undefined);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { weekStart, weekEnd, weekDays } = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return { weekStart: start, weekEnd: end, weekDays: days };
  }, [currentDate]);
  
  useEffect(() => {
    if (!user) {
        setAllTasks([]);
        setLoading(false);
        return;
    };
    
    setLoading(true);
    
    const q = query(
        collection(db, "daily_tasks"), 
        where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
        setAllTasks(fetchedTasks);
        setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const tasksForCurrentWeek = useMemo(() => {
      return allTasks.filter(task => {
          const taskDate = new Date(task.date);
          return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
      });
  }, [allTasks, weekStart, weekEnd]);
  
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
    tasksForCurrentWeek.forEach(task => {
        const key = `${task.date}_${task.time.substring(0, 2)}:00`;
        const existing = map.get(key) || [];
        existing.push(task);
        map.set(key, existing);
    });
    return map;
  }, [tasksForCurrentWeek]);

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
           {isMobile ? (
                <MobileWeeklyView 
                    weekDays={weekDays} 
                    tasks={tasksForCurrentWeek} 
                    onEdit={handleEdit} 
                    onCellClick={handleCellClick} 
                />
           ) : (
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

                <div className="grid grid-cols-7 overflow-x-auto">
                    {/* Header */}
                    {weekDays.map(day => (
                        <div key={day.toISOString()} className={cn("h-12 text-center p-2 border-b border-r border-border", isToday(day) && "bg-primary/10")}>
                            <div className="font-bold text-sm">{format(day, 'EEE')}</div>
                            <div className={cn("text-muted-foreground", isToday(day) && "text-primary font-bold")}>{format(day, 'd')}</div>
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
           )}
           
          <ScheduleTaskForm 
              isOpen={isFormOpen} 
              onOpenChange={handleFormClose}
              task={editingTask}
              prefillData={prefillData}
          />
      </>
    )
}
