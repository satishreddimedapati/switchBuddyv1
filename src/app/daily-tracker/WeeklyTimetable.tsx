'use client'

import { DailyTask } from "@/lib/types";
import { useState } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { format, startOfWeek, addDays, getDay } from 'date-fns';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface WeeklyTimetableProps {
  tasks: DailyTask[];
  loading: boolean;
}

const timeSlots = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

const categoryColors = {
  schedule: "bg-blue-100 border-blue-200 text-blue-800",
  interview: "bg-green-100 border-green-200 text-green-800",
};

export function WeeklyTimetable({ tasks, loading }: WeeklyTimetableProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{ date: string; time: string } | undefined>(undefined);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleCellClick = (date: Date, time: string) => {
    setPrefillData({ date: format(date, 'yyyy-MM-dd'), time });
    setIsFormOpen(true);
  };
  
  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <h2 className="font-headline text-2xl font-bold mb-4">This Week</h2>
      <div className="grid grid-cols-8 min-w-[1000px]">
        {/* Header */}
        <div className="p-2 border-b font-semibold">Time</div>
        {days.map(day => (
          <div key={day.toISOString()} className="p-2 border-b font-semibold text-center">
            {format(day, 'EEE')} <br/>
            <span className="text-sm font-normal text-muted-foreground">{format(day, 'dd')}</span>
          </div>
        ))}

        {/* Body */}
        {timeSlots.map(time => (
          <div key={time} className="contents">
            <div className="p-2 border-r border-b font-mono text-sm">{format(new Date(`1970-01-01T${time}`), "h a")}</div>
            {days.map(day => {
              const tasksInSlot = tasks.filter(task => task.date === format(day, 'yyyy-MM-dd') && task.time.startsWith(time.split(':')[0]));
              return (
                <div 
                  key={day.toISOString()} 
                  className="p-2 border-r border-b min-h-[60px] cursor-pointer hover:bg-muted/50"
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
          </div>
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
