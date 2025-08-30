
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

// Mock data fetching functions - replace with actual service calls
async function getDailyTrackerData() { return { summary: "Completed 5/8 tasks", tasks: [{ id: '1', title: 'Task 1'}] }; }
async function getJobTrackerData() { return [{ id: '1', title: 'SE at Google' }]; }
async function getInterviewPrepData() { return [{ id: '1', title: 'React Interview Plan' }]; }
async function getAILearningData() { return [{ id: '1', title: 'Learning .NET' }]; }

export default function ReportsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    // State for all checkbox options
    const [reportOptions, setReportOptions] = useState({
        dailyTracker: {
            include: true,
            summary: true,
            fullList: true,
            aiDebriefs: false,
        },
        jobTracker: {
            include: true,
            summaryView: true,
            detailedView: false,
        },
        interviewPrep: {
            include: true,
            planOverview: true,
            sessionHistory: true,
        },
        aiLearning: {
            include: true,
            fullPlan: true,
            includeChallenges: true,
        },
    });

    const handleCheckboxChange = (section: string, option: string) => {
        setReportOptions(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [option]: !prev[section as keyof typeof prev][option as keyof typeof prev[keyof typeof prev]],
            }
        }));
    };
    
    const handleGenerateReport = async (format: 'pdf' | 'excel') => {
        setIsLoading(true);
        toast({ title: "Generating Report...", description: `Your ${format.toUpperCase()} file is being prepared.` });
        
        try {
            // In a real app, you would fetch data based on the selected options
            const dailyData = reportOptions.dailyTracker.include ? await getDailyTrackerData() : null;
            const jobData = reportOptions.jobTracker.include ? await getJobTrackerData() : null;
            const prepData = reportOptions.interviewPrep.include ? await getInterviewPrepData() : null;
            const learningData = reportOptions.aiLearning.include ? await getAILearningData() : null;

            if (format === 'excel') {
                const wb = XLSX.utils.book_new();
                if (dailyData) {
                    const ws = XLSX.utils.json_to_sheet([{ summary: dailyData.summary, tasks: dailyData.tasks.length }]);
                    XLSX.utils.book_append_sheet(wb, ws, "Daily Tracker");
                }
                if (jobData) {
                    const ws = XLSX.utils.json_to_sheet(jobData);
                    XLSX.utils.book_append_sheet(wb, ws, "Job Tracker");
                }
                XLSX.writeFile(wb, "SwitchBuddy_Report.xlsx");
            } else {
                const doc = new jsPDF();
                doc.text("SwitchBuddy Report", 10, 10);
                if (dailyData) {
                     doc.text("Daily Tracker Summary", 10, 20);
                     doc.text(dailyData.summary, 10, 30);
                }
                 if (jobData) {
                     doc.text("Job Applications", 10, 40);
                     jobData.forEach((job, i) => doc.text(job.title, 10, 50 + (i*10)));
                }
                doc.save("SwitchBuddy_Report.pdf");
            }
            
            toast({ title: "Success!", description: "Your report has been downloaded." });

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to generate the report.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">
                    Download Reports
                </h1>
                <p className="text-muted-foreground">
                    Export your progress and data to PDF or Excel for offline analysis.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Tracker Card */}
                <ReportCard
                    title="Daily Tracker"
                    description="Export your tasks and productivity stats."
                    onToggleSection={() => handleCheckboxChange('dailyTracker', 'include')}
                    isIncluded={reportOptions.dailyTracker.include}
                >
                    <CheckboxOption id="dt-summary" label="Include Summary" checked={reportOptions.dailyTracker.summary} onCheckedChange={() => handleCheckboxChange('dailyTracker', 'summary')} />
                    <CheckboxOption id="dt-full-list" label="Full Task List" checked={reportOptions.dailyTracker.fullList} onCheckedChange={() => handleCheckboxChange('dailyTracker', 'fullList')} />
                    <CheckboxOption id="dt-ai-debriefs" label="AI Debriefs" checked={reportOptions.dailyTracker.aiDebriefs} onCheckedChange={() => handleCheckboxChange('dailyTracker', 'aiDebriefs')} disabled />
                </ReportCard>
                
                {/* Job Tracker Card */}
                <ReportCard
                    title="Job Tracker"
                    description="Export your job application pipeline."
                    onToggleSection={() => handleCheckboxChange('jobTracker', 'include')}
                    isIncluded={reportOptions.jobTracker.include}
                >
                    <CheckboxOption id="jt-summary" label="Summary View" checked={reportOptions.jobTracker.summaryView} onCheckedChange={() => handleCheckboxChange('jobTracker', 'summaryView')} />
                    <CheckboxOption id="jt-detailed" label="Detailed View (with notes)" checked={reportOptions.jobTracker.detailedView} onCheckedChange={() => handleCheckboxChange('jobTracker', 'detailedView')} disabled />
                </ReportCard>

                {/* Interview Prep Card */}
                <ReportCard
                    title="Interview Prep"
                    description="Export your practice plans and session results."
                    onToggleSection={() => handleCheckboxChange('interviewPrep', 'include')}
                    isIncluded={reportOptions.interviewPrep.include}
                >
                    <CheckboxOption id="ip-overview" label="Plan Overviews" checked={reportOptions.interviewPrep.planOverview} onCheckedChange={() => handleCheckboxChange('interviewPrep', 'planOverview')} />
                    <CheckboxOption id="ip-history" label="Full Session History" checked={reportOptions.interviewPrep.sessionHistory} onCheckedChange={() => handleCheckboxChange('interviewPrep', 'sessionHistory')} />
                </ReportCard>
                
                {/* AI Learning Card */}
                <ReportCard
                    title="AI Learning Roadmaps"
                    description="Export your personalized learning plans."
                    onToggleSection={() => handleCheckboxChange('aiLearning', 'include')}
                    isIncluded={reportOptions.aiLearning.include}
                >
                    <CheckboxOption id="al-full-plan" label="Full Day-by-Day Plan" checked={reportOptions.aiLearning.fullPlan} onCheckedChange={() => handleCheckboxChange('aiLearning', 'fullPlan')} />
                    <CheckboxOption id="al-challenges" label="Include Challenges" checked={reportOptions.aiLearning.includeChallenges} onCheckedChange={() => handleCheckboxChange('aiLearning', 'includeChallenges')} />
                </ReportCard>
            </div>
            
            <Separator />

            <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
                 <p className="text-sm text-muted-foreground mr-auto">Select the sections and options you want to include in your report.</p>
                <Button size="lg" variant="secondary" onClick={() => handleGenerateReport('excel')} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <FileDown className="mr-2" />}
                    Download Excel
                </Button>
                <Button size="lg" onClick={() => handleGenerateReport('pdf')} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <FileDown className="mr-2" />}
                    Download PDF
                </Button>
            </div>
        </div>
    );
}

// Helper Components
interface ReportCardProps {
    title: string;
    description: string;
    children: React.ReactNode;
    isIncluded: boolean;
    onToggleSection: () => void;
}

function ReportCard({ title, description, children, isIncluded, onToggleSection }: ReportCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <Checkbox checked={isIncluded} onCheckedChange={onToggleSection} id={`include-${title.replace(/\s+/g, '-')}`} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                <Separator />
                <div className="space-y-2">
                    {children}
                </div>
            </CardContent>
        </Card>
    );
}

interface CheckboxOptionProps {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: () => void;
    disabled?: boolean;
}

function CheckboxOption({ id, label, checked, onCheckedChange, disabled = false }: CheckboxOptionProps) {
    return (
        <div className="flex items-center space-x-2">
            <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
            <Label htmlFor={id} className={disabled ? "text-muted-foreground" : ""}>{label}</Label>
        </div>
    );
}