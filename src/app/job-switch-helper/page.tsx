
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobTracker } from "./JobTracker";
import { JobIntelligence } from "./JobIntelligence";
import { InterviewPrep } from "./InterviewPrep";
import { useSearchParams } from 'next/navigation';

export default function JobSwitchHelperPage() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');

    return (
        <div className="flex flex-col gap-8">
             <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    JobSwitch Helper
                </h1>
                <p className="text-muted-foreground">
                    All your job switching tools in one place.
                </p>
            </div>
            <Tabs defaultValue={tab || "tracker"} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="tracker">Job Tracker</TabsTrigger>
                    <TabsTrigger value="intelligence">Job Intelligence</TabsTrigger>
                    <TabsTrigger value="interview-prep">Interview Prep</TabsTrigger>
                </TabsList>
                <TabsContent value="tracker">
                    <JobTracker />
                </TabsContent>
                <TabsContent value="intelligence">
                   <JobIntelligence />
                </TabsContent>
                <TabsContent value="interview-prep">
                    <InterviewPrep />
                </TabsContent>
            </Tabs>
        </div>
    )
}
