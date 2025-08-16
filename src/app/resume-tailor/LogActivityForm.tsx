'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { addNetworkingActivity } from '@/services/networking-activities';
import { Loader2 } from 'lucide-react';

const activitySchema = z.object({
  note: z.string().min(1, 'Note is required.'),
  status: z.enum(['Pending', 'Replied', 'No Response']),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface LogActivityFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onActivityLogged: () => void;
}

export function LogActivityForm({ isOpen, onOpenChange, onActivityLogged }: LogActivityFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
        note: '',
        status: 'Pending',
    }
  });

  const onSubmit = async (data: ActivityFormValues) => {
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
      await addNetworkingActivity({
        ...data,
        userId: user.uid,
        date: new Date().toISOString(),
      });
      toast({ title: 'Success', description: 'Activity logged.' });
      onActivityLogged();
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Networking Activity</DialogTitle>
           <DialogDescription>Record a new touchpoint in your networking journey.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="note">Note</Label>
            <Textarea id="note" {...register('note')} placeholder="e.g., Sent connection request on LinkedIn..."/>
            {errors.note && <p className="text-destructive text-sm mt-1">{errors.note.message}</p>}
          </div>

           <div>
                <Label htmlFor="status">Status</Label>
                 <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="Pending">Pending</SelectItem>
                               <SelectItem value="Replied">Replied</SelectItem>
                               <SelectItem value="No Response">No Response</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.status && <p className="text-destructive text-sm mt-1">{errors.status.message}</p>}
             </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button variant="ghost" type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Log Activity'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
