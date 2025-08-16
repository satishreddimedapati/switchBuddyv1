'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { addHrContact } from '@/services/hr-contacts';
import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { HrContact } from '@/lib/types';

const formSchema = z.object({
  jobRole: z.string().min(1, 'Job Role is required.'),
  hrName: z.string().min(1, 'HR Name is required.'),
  company: z.string().min(1, 'Company is required.'),
  linkedinUrl: z.string().url('Must be a valid LinkedIn URL.'),
  email: z.string().email('Must be a valid email.').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

interface HrContactFormProps {
    onContactAdded: (contact: HrContact) => void;
    initialJobRole?: string;
}

export function HrContactForm({ onContactAdded, initialJobRole = '' }: HrContactFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            jobRole: initialJobRole,
            hrName: '',
            company: '',
            linkedinUrl: '',
            email: '',
        }
    });

    useEffect(() => {
        form.setValue('jobRole', initialJobRole);
    }, [initialJobRole, form]);

    const onSubmit = async (data: FormValues) => {
        if (!user) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const newContactId = await addHrContact({ ...data, userId: user.uid });
            toast({ title: 'Success', description: 'HR Contact added!' });
            onContactAdded({ ...data, id: newContactId, userId: user.uid });
            form.reset({ jobRole: initialJobRole, hrName: '', company: '', linkedinUrl: '', email: '' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to add contact.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="jobRole">Job Role</Label>
                    <Input id="jobRole" {...form.register('jobRole')} placeholder="e.g., Frontend Developer"/>
                     {form.formState.errors.jobRole && <p className="text-destructive text-sm mt-1">{form.formState.errors.jobRole.message}</p>}
                </div>
                <div>
                    <Label htmlFor="hrName">HR Name</Label>
                    <Input id="hrName" {...form.register('hrName')} />
                     {form.formState.errors.hrName && <p className="text-destructive text-sm mt-1">{form.formState.errors.hrName.message}</p>}
                </div>
                <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" {...form.register('company')} />
                     {form.formState.errors.company && <p className="text-destructive text-sm mt-1">{form.formState.errors.company.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input id="email" type="email" {...form.register('email')} />
                     {form.formState.errors.email && <p className="text-destructive text-sm mt-1">{form.formState.errors.email.message}</p>}
                </div>
                 <div className="sm:col-span-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input id="linkedinUrl" {...form.register('linkedinUrl')} placeholder="https://linkedin.com/in/username" />
                     {form.formState.errors.linkedinUrl && <p className="text-destructive text-sm mt-1">{form.formState.errors.linkedinUrl.message}</p>}
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                    Save Contact
                </Button>
            </div>
        </form>
    );
}
