'use client'

import { useActionState, useFormStatus } from 'react';
import { handleTailorResume, type FormState } from './actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tailoring...
                </>
            ) : (
                <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Tailor Resume
                </>
            )}
        </Button>
    )
}


export function ResumeTailorForm() {
    const initialState: FormState = { message: '', error: false };
    const [state, formAction] = useActionState(handleTailorResume, initialState);

    return (
        <div className="space-y-8">
            <form action={formAction} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'><FileText size={20}/> Your Resume</CardTitle>
                             <CardDescription>Paste your current resume here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Textarea name="resume" placeholder="Your resume text..." rows={15} required className="min-h-[300px] lg:min-h-[400px]" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'><FileText size={20}/> Job Description</CardTitle>
                            <CardDescription>Paste the target job description.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea name="jobDescription" placeholder="Job description text..." rows={15} required className="min-h-[300px] lg:min-h-[400px]" />
                        </CardContent>
                    </Card>
                </div>
                <div className="flex justify-end">
                    <SubmitButton />
                </div>
            </form>

            {state.error && (
                 <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                </Alert>
            )}

            {state.tailoredResume && (
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">AI-Tailored Resume</CardTitle>
                        <CardDescription>Here are the suggested edits to align your resume with the job description.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted/50 p-4 rounded-md whitespace-pre-wrap font-body text-sm leading-relaxed">
                            {state.tailoredResume}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
