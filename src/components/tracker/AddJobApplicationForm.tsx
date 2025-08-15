'use client'

import { useFormStatus } from "react-dom";
import { handleAddJobApplication, type FormState } from "./actions";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanColumnId } from "@/lib/types";
import { useEffect, useState, useActionState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                </>
            ) : (
                "Add Application"
            )}
        </Button>
    )
}

const columnOptions: KanbanColumnId[] = ['Wishlist', 'Applying', 'Interview', 'Offer', 'Rejected'];

interface AddJobApplicationFormProps {
    onApplicationAdded: () => void;
}

export function AddJobApplicationForm({ onApplicationAdded }: AddJobApplicationFormProps) {
  const { user } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const initialState: FormState = { message: "", error: false };
  
  const handleAddJobWithUserId = handleAddJobApplication.bind(null, user?.uid || '');
  const [state, formAction] = useActionState(handleAddJobWithUserId, initialState);

  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message) {
      if (state.error) {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: state.message,
        });
        setIsOpen(false);
        onApplicationAdded();
        formRef.current?.reset();
      }
    }
  }, [state, toast, onApplicationAdded]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><PlusCircle /> Add Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Job Application</DialogTitle>
          <DialogDescription>
            Enter the details of the new job you're tracking.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="company" className="text-right">
                Company
                </Label>
                <Input id="company" name="company" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                Job Title
                </Label>
                <Input id="title" name="title" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stage" className="text-right">
                Stage
                </Label>
                <Select name="stage" defaultValue="Wishlist" required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                    <SelectContent>
                        {columnOptions.map(option => (
                            <SelectItem key={option} value={option}>
                                {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                </DialogClose>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
