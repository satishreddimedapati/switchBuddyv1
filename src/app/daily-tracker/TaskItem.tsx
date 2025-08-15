'use client'

import { DailyTask } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask, deleteTask } from "@/services/daily-tasks";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth";

interface TaskItemProps {
  task: DailyTask;
  onEdit: (task: DailyTask) => void;
}

const categoryColors = {
  schedule: "border-l-blue-400",
  interview: "border-l-green-400",
};


export function TaskItem({ task, onEdit }: TaskItemProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleToggleComplete = async (checked: boolean) => {
    if (!user) return;
    try {
      await updateTask(task.id, { completed: checked }, user.uid);
      toast({
        title: "Task Updated",
        description: `Task marked as ${checked ? 'complete' : 'incomplete'}.`,
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: "Failed to update task.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
        await deleteTask(task.id, user.uid);
        toast({ title: "Task Deleted", description: "The task has been removed." });
    } catch (error) {
        console.error("Failed to delete task:", error);
        toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    }
  };

  return (
    <Card className={cn("transition-all", task.completed && "bg-muted/50", categoryColors[task.type], "border-l-4")}>
      <CardContent className="p-4 flex items-start gap-4">
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => handleToggleComplete(Boolean(checked))}
            aria-label="Mark task as complete"
          />
        </div>
        <div className="flex-grow">
          <p className={cn("font-semibold", task.completed && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          <p className="text-sm text-muted-foreground">
             {format(new Date(`1970-01-01T${task.time}`), "h:mm a")}
          </p>
          {task.description && (
            <p className={cn("text-sm text-muted-foreground mt-1", task.completed && "line-through")}>
              {task.description}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(task)}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit Task</span>
          </Button>
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Task</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this task.
                  </Aler  tDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
