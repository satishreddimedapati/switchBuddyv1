
'use client'

import { DailyTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ScheduleTaskForm } from "./ScheduleTaskForm";
import { TaskItem } from "./TaskItem";
import { groupTasksByTimeOfDay } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FocusWallet } from "./FocusWallet";

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

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(undefined);
  };

  const sortedTasks = tasks.sort((a, b) => a.time.localeCompare(b.time));
  
  const { morning, afternoon, evening } = groupTasksByTimeOfDay(sortedTasks);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="font-headline text-2xl font-bold">Today's List</h2>
        <Button onClick={handleAddNew} className="w-full sm:w-auto"><PlusCircle /> Schedule Task</Button>
      </div>

       <div className="grid grid-cols-1">
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
       </div>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={['Morning', 'Afternoon', 'Evening']} className="w-full space-y-4">
            {Object.entries({ Morning: morning, Afternoon: afternoon, Evening: evening }).map(([period, periodTasks]) => 
                periodTasks.length > 0 && (
                    <Card key={period}>
                        <AccordionItem value={period} className="border-b-0">
                            <AccordionTrigger className="p-6 hover:no-underline">
                                <h3 className="text-lg font-semibold">{period} ({periodTasks.length})</h3>
                            </AccordionTrigger>
                            <AccordionContent className="px-6">
                                <div className="space-y-4">
                                    {periodTasks.map(task => (
                                        <TaskItem key={task.id} task={task} onEdit={handleEdit} />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                )
            )}

            {tasks.length === 0 && !loading && (
                 <div className="text-center py-10 border rounded-lg">
                    <p className="text-muted-foreground">No tasks scheduled for today.</p>
                    <Button variant="link" onClick={handleAddNew}>Schedule your first task</Button>
                </div>
            )}
        </Accordion>
      )}

      <ScheduleTaskForm
        isOpen={isFormOpen}
        onOpenChange={handleFormClose}
        task={editingTask}
      />
    </div>
  );
}
