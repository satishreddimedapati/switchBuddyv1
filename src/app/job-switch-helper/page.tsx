
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobTracker } from "./JobTracker";
import { JobIntelligence } from "./JobIntelligence";
import { InterviewPrep } from "./InterviewPrep";
import { useSearchParams } from 'next/navigation';
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { ChevronDown, Briefcase, Cpu, Video, MoreHorizontal } from "lucide-react";


const sections = [
    { value: 'tracker', label: 'Job Tracker', icon: Briefcase },
    { value: 'intelligence', label: 'Job Intelligence', icon: Cpu },
    { value: 'interview-prep', label: 'Interview Prep', icon: Video },
]

export default function JobSwitchHelperPage() {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    
    const initialTab = searchParams.get('tab') || "tracker";
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && sections.some(s => s.value === tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const renderContent = () => {
        switch (activeTab) {
            case 'tracker':
                return <JobTracker />;
            case 'intelligence':
                return <JobIntelligence />;
            case 'interview-prep':
                return <InterviewPrep />;
            default:
                return <JobTracker />;
        }
    }
    
    return (
        <div className="flex flex-col gap-8">
             <div>
                <div className="flex justify-between items-center">
                    <h1 className="font-headline text-3xl font-bold tracking-tight">
                        JobSwitch Helper
                    </h1>
                     {isMobile && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {sections.map(section => (
                                    <DropdownMenuItem key={section.value} onSelect={() => setActiveTab(section.value)}>
                                        <section.icon className="mr-2" />
                                        {section.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
                <p className="text-muted-foreground">
                    All your job switching tools in one place.
                </p>
            </div>

            {isMobile ? (
                 <div className="mt-6">
                    {renderContent()}
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        {sections.map(section => (
                            <TabsTrigger key={section.value} value={section.value}>{section.label}</TabsTrigger>
                        ))}
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
            )}
        </div>
    )
}
