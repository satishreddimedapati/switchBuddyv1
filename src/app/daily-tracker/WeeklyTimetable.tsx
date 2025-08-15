'use client'

import { DailyTask } from "@/lib/types";
import { useState, useMemo } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { format, startOfWeek, addDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklyTimetableProps {
  tasks: DailyTask[];
  loading: boolean;
}

const timeSlots = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

const categoryColors = {
  schedule: "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200",
  interview: "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200",
};

export function WeeklyTimetable({ tasks, loading }: WeeklyTimetableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{ date: string; time: string } | undefined>(undefined);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

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
    setPrefillData({ date: format(date, 'yyyy-MM-dd'), time });
    setIsFormOpen(true);
  };
  
  if (loading) {
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-8 min-w-[1000px] gap-2">
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
                  className="p-1 border-r border-b min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleCellClick(day, time)}
                >
                  <ul className="space-y-1">
                    {tasksInSlot.map(task => (
                        <li key={task.id} className={cn("text-xs p-1 rounded-md border", categoryColors[task.type])}>
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
        onOpenChange={setIsFormOpen}
        prefillData={prefillData}
      />
    </div>
  );
}
