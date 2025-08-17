
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
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FocusWallet } from "./FocusWallet";

export function DailySchedule() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const q = query(collection(db, "daily_tasks"), where("date", "==", today), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching today's tasks: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FocusWallet tasks={tasks} />
            <Card className="lg:col-span-2">
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
        <Accordion type="multiple" className="w-full space-y-4">
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
