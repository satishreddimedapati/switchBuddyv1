'use client'

import * as React from "react"
import { DailyTask } from "@/lib/types";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const timeSlots = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

const categoryColors = {
  schedule: "bg-blue-100 border-blue-200 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200",
  interview: "bg-green-100 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200",
};

interface DailyCalendarViewProps {
    tasks: DailyTask[];
    loading: boolean;
    onEdit: (task: DailyTask) => void;
    onAddNew: () => void;
}

export function DailyCalendarView({ tasks, loading, onEdit, onAddNew }: DailyCalendarViewProps) {
  
  const tasksByTime = React.useMemo(() => {
    const map = new Map<string, DailyTask[]>();
    tasks.forEach(task => {
      if (!map.has(task.time)) {
        map.set(task.time, []);
      }
      map.get(task.time)!.push(task);
    });
    return map;
  }, [tasks]);

  if (loading) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-32" />
            </div>
             <div className="border rounded-lg p-2 space-y-1">
                 {Array.from({length: 17}).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                 ))}
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="font-headline text-2xl font-bold">Today's Calendar</h2>
        <Button onClick={onAddNew}><PlusCircle /> Schedule Task</Button>
      </div>
      <div className="border rounded-lg">
        {timeSlots.map(time => {
          const tasksInSlot = tasksByTime.get(time) || [];
          return (
            <div key={time} className="grid grid-cols-[auto_1fr] border-b last:border-b-0">
              <div className="p-4 border-r">
                <span className="font-mono text-sm text-muted-foreground">{format(new Date(`1970-01-01T${time}`), "h a")}</span>
              </div>
              <div className="p-2">
                {tasksInSlot.length > 0 ? (
                  <ul className="space-y-2">
                    {tasksInSlot.map(task => (
                      <li key={task.id} className={cn("p-2 rounded-md border", categoryColors[task.type])} onClick={() => onEdit(task)}>
                        <p className="font-semibold text-sm">{task.title}</p>
                        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="h-12 flex items-center justify-center text-xs text-muted-foreground/50">
                    -
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
