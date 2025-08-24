'use client'

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DailyTask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addTask, updateTask, deleteTask } from '@/services/daily-tasks';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/lib/auth';
import { generateTaskDescription } from '@/ai/flows/generate-task-description';

const timeSlots = Array.from({ length: 17 }, (_, i) => `${(i + 6).toString().padStart(2, '0')}:00`);

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  description: z.string().optional(),
  date: z.date({ required_error: 'Date is required.' }),
  time: z.string().min(1, 'Time is required.'),
  type: z.enum(['schedule', 'interview']),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface ScheduleTaskFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task?: DailyTask;
  prefillData?: { date: string; time: string };
}

export function ScheduleTaskForm({ isOpen, onOpenChange, task, prefillData }: ScheduleTaskFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDesc, startGeneratingDescTransition] = useTransition();


  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
        title: '',
        description: '',
        date: new Date(),
        time: '09:00',
        type: 'schedule',
    }
  });

  useEffect(() => {
    if (isOpen) {
        if (task) {
          reset({
            title: task.title,
            description: task.description || '',
            date: new Date(task.date),
            time: task.time,
            type: task.type,
          });
        } else if (prefillData) {
            reset({
                title: '',
                description: '',
                date: new Date(prefillData.date),
                time: prefillData.time,
                type: 'schedule',
            })
        } else {
          reset({
            title: '',
            description: '',
            date: new Date(),
            time: '09:00',
            type: 'schedule',
          });
        }
    }
  }, [task, prefillData, reset, isOpen]);

  const handleGenerateDescription = () => {
    const title = getValues('title');
    if (!title) {
        toast({ title: 'Title is required', description: 'Please enter a title before generating a description.', variant: 'destructive'});
        return;
    };

    startGeneratingDescTransition(async () => {
        try {
            const result = await generateTaskDescription({ title });
            if (result.description) {
                setValue('description', result.description);
            }
        } catch (error) {
            console.error("Failed to generate description", error);
            toast({ title: 'Error', description: 'Could not generate a description.', variant: 'destructive'});
        }
    })
  }

  const onSubmit = async (data: TaskFormValues) => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to manage tasks.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
      const taskData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
        completed: task?.completed || false,
      };

      if (task) {
        await updateTask(task.id, taskData, user.uid);
        toast({ title: 'Success', description: 'Task updated successfully.' });
      } else {
        await addTask(taskData, user.uid);
        toast({ title: 'Success', description: 'Task added successfully.' });
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!task || !user) {
        toast({ title: 'Error', description: 'You must be logged in to delete a task.', variant: 'destructive' });
        return;
    };
    setIsSubmitting(true);
    try {
        await deleteTask(task.id, user.uid);
        toast({ title: "Task Deleted", description: "The task has been removed." });
        onOpenChange(false);
    } catch (error) {
        console.error("Failed to delete task:", error);
        toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Schedule New Task'}</DialogTitle>
          <DialogDescription>
            Organize your day by adding a new task to your schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDesc}>
                {isGeneratingDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                 <span className="ml-2">Generate</span>
              </Button>
            </div>
            <Textarea id="description" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <Label>Date</Label>
                <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                 {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
            </div>
             <div>
                <Label htmlFor="time">Time</Label>
                 <Controller
                    control={control}
                    name="time"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a time" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeSlots.map(slot => (
                                    <SelectItem key={slot} value={slot}>
                                        {format(new Date(`1970-01-01T${slot}`), "h:mm a")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.time && <p className="text-destructive text-sm mt-1">{errors.time.message}</p>}
             </div>
          </div>
          
           <div>
                <Label htmlFor="type">Category</Label>
                 <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="schedule">Schedule</SelectItem>
                               <SelectItem value="interview">Interview</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.type && <p className="text-destructive text-sm mt-1">{errors.type.message}</p>}
             </div>

          <DialogFooter className="pt-4">
            {task && (
                <Button variant="destructive" type="button" onClick={handleDelete} disabled={isSubmitting} className="mr-auto">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                     <span className="sr-only">Delete</span>
                </Button>
            )}
            <DialogClose asChild>
                <Button variant="ghost" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : (task ? 'Save Changes' : 'Add Task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
