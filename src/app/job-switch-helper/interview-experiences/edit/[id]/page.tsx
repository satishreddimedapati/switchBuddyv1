
'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { getInterviewExperience, updateInterviewExperience } from '@/services/interview-experiences';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, Save, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const questionSchema = z.object({
  id: z.string(),
  questionText: z.string().min(1, 'Question is required.'),
  topic: z.string().min(1, 'Topic is required.'),
  userAnswer: z.string().min(1, 'Your answer is required.'),
  userRating: z.coerce.number().min(1).max(10),
  analysis: z.object({
      aiRating: z.number(),
      idealAnswer: z.string(),
      shortcut: z.string(),
  }).optional(),
});

const experienceSchema = z.object({
  companyName: z.string().min(1, 'Company name is required.'),
  role: z.string().min(1, 'Role is required.'),
  interviewDate: z.date({ required_error: 'Interview date is required.'}),
  roundType: z.enum(['HR', 'Technical', 'Managerial']),
  overallRating: z.coerce.number().min(1).max(10),
  questions: z.array(questionSchema).min(1, 'At least one question is required.'),
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;
const interviewTopics = ["C#", ".NET", "SQL", "Angular", "Other"];

export default function EditInterviewExperiencePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const experienceId = params.id as string;
    
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ExperienceFormValues>({
        resolver: zodResolver(experienceSchema),
    });

     useEffect(() => {
        if (!user || !experienceId) return;
        setLoading(true);
        getInterviewExperience(experienceId).then(exp => {
            if (exp && exp.userId === user.uid) {
                form.reset({
                    ...exp,
                    interviewDate: parseISO(exp.interviewDate),
                });
            } else {
                toast({ title: "Error", description: "Experience not found or permission denied.", variant: "destructive" });
                router.push('/job-switch-helper?tab=interview-experiences');
            }
            setLoading(false);
        });
    }, [experienceId, user, form, router, toast]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "questions"
    });

    const watchedQuestions = form.watch('questions');

    const onSubmit = async (data: ExperienceFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await updateInterviewExperience(experienceId, {
                ...data,
                userId: user.uid,
                interviewDate: data.interviewDate.toISOString(),
            }, user.uid);
            toast({ title: "Success!", description: "Interview experience updated." });
            router.push(`/job-switch-helper/interview-experiences/${experienceId}`);
        } catch (error) {
            console.error("Failed to update experience", error);
            toast({ title: "Error", description: "Could not update experience.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Edit Interview Experience
                </h1>
                <p className="text-muted-foreground">
                    Update the details of your interview.
                </p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Interview Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                             <div>
                                <Label htmlFor="companyName">Company Name</Label>
                                <Input id="companyName" {...form.register('companyName')} />
                            </div>
                            <div>
                                <Label htmlFor="role">Role</Label>
                                <Input id="role" {...form.register('role')} />
                            </div>
                            <div>
                                <Label>Interview Date</Label>
                                <Controller
                                    control={form.control} name="interviewDate"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                                        </Popover>
                                    )}
                                />
                            </div>
                            <div>
                                <Label htmlFor="roundType">Round Type</Label>
                                <Controller control={form.control} name="roundType"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="HR">HR</SelectItem><SelectItem value="Technical">Technical</SelectItem><SelectItem value="Managerial">Managerial</SelectItem></SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <Label>Overall Self-Rating: {form.watch('overallRating')}/10</Label>
                                <Controller control={form.control} name="overallRating"
                                    render={({ field }) => <input type="range" min="1" max="10" value={field.value} onChange={field.onChange} className="w-full" />}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Questions & Answers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                                <h4 className="font-semibold">Question {index + 1}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><Label>Question</Label><Textarea {...form.register(`questions.${index}.questionText`)} /></div>
                                    <div className="space-y-2">
                                        <Label>Topic</Label>
                                        <Controller control={form.control} name={`questions.${index}.topic`}
                                            render={({ field: topicField }) => (
                                                 <Select 
                                                    onValueChange={topicField.onChange} 
                                                    value={interviewTopics.includes(topicField.value) ? topicField.value : 'Other'}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>{interviewTopics.map(topic => <SelectItem key={topic} value={topic}>{topic}</SelectItem>)}</SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {watchedQuestions[index]?.topic && !interviewTopics.includes(watchedQuestions[index]?.topic) && (
                                            <Input
                                                placeholder="Enter custom topic"
                                                defaultValue={watchedQuestions[index]?.topic}
                                                onBlur={(e) => form.setValue(`questions.${index}.topic`, e.target.value)}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div><Label>My Answer</Label><Textarea {...form.register(`questions.${index}.userAnswer`)} rows={5}/></div>
                                
                                {field.analysis?.idealAnswer && (
                                     <div><Label>Ideal Answer (from AI)</Label><Textarea value={field.analysis.idealAnswer} rows={5} readOnly className="bg-muted/50" /></div>
                                )}
                               
                                <div>
                                    <Label>My Rating: {form.watch(`questions.${index}.userRating`)}/10</Label>
                                     <Controller control={form.control} name={`questions.${index}.userRating`}
                                        render={({ field }) => <input type="range" min="1" max="10" value={field.value} onChange={field.onChange} className="w-full" />}
                                    />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 text-destructive"><Trash2 /></Button>
                            </div>
                        ))}
                         <Button type="button" variant="outline" onClick={() => append({ id: crypto.randomUUID(), questionText: '', topic: 'C#', userAnswer: '', userRating: 5 })}>
                            <PlusCircle className="mr-2"/> Add Question
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
