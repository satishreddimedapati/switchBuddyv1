'use client'

import { useFormState, useFormStatus } from 'react-dom';
import { handleGenerateQuestions, type FormState } from './actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Questions
                </>
            )}
        </Button>
    )
}

export function InterviewPrepForm() {
    const initialState: FormState = { message: '', error: false };
    const [state, formAction] = useFormState(handleGenerateQuestions, initialState);

    return (
        <div className="space-y-8">
            <Card>
                 <CardHeader>
                    <CardTitle className="font-headline">Job Description</CardTitle>
                    <CardDescription>Paste the job description below to generate likely interview questions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <Textarea name="jobDescription" placeholder="Paste the job description here..." rows={10} required />
                        <div className="flex justify-end">
                            <SubmitButton />
                        </div>
                    </form>
                </CardContent>
            </Card>

            {state.error && (
                 <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}

            {state.questions && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Generated Questions</CardTitle>
                        <CardDescription>Prepare your answers for these potential questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {state.questions.map((question, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>{question}</AccordionTrigger>
                                    <AccordionContent>
                                        <Textarea placeholder="Draft your answer using the STAR method..." />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
