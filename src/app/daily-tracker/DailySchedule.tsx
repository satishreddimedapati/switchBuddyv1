'use client'

import { DailyTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { TaskItem } from "./TaskItem";
import { groupTasksByTimeOfDay } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyScheduleProps {
  tasks: DailyTask[];
  loading: boolean;
}

export function DailySchedule({ tasks, loading }: DailyScheduleProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | undefined>(undefined);

  const handleEdit = (task: DailyTask) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingTask(undefined);
    setIsFormOpen(true);
  }

  const sortedTasks = tasks.sort((a, b) => a.time.localeCompare(b.time));
  const { morning, afternoon, evening } = groupTasksByTimeOfDay(sortedTasks);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-2xl font-bold">Today's Schedule</h2>
        <Button onClick={handleAddNew}><PlusCircle /> Schedule Task</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
             <p className="text-sm text-muted-foreground">{`You completed ${completedTasks} out of ${totalTasks} tasks today.`}</p>
             <Progress value={progress} />
          </div>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
            {Object.entries({ Morning: morning, Afternoon: afternoon, Evening: evening }).map(([period, periodTasks]) => 
                periodTasks.length > 0 && (
                    <div key={period}>
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">{period}</h3>
                        <div className="space-y-4">
                            {periodTasks.map(task => (
                                <TaskItem key={task.id} task={task} onEdit={handleEdit} />
                            ))}
                        </div>
                    </div>
                )
            )}

            {tasks.length === 0 && !loading && (
                 <div className="text-center py-10 border rounded-lg">
                    <p className="text-muted-foreground">No tasks scheduled for today.</p>
                    <Button variant="link" onClick={handleAddNew}>Schedule your first task</Button>
                </div>
            )}
        </div>
      )}


      <ScheduleTaskForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={editingTask}
      />
    </div>
  );
}
