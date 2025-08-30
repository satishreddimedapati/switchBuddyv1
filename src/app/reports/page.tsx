
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
import { useAuth } from '@/lib/auth';
import { getTasksForDateRange } from '@/services/daily-tasks';
import { getJobApplications } from "@/services/job-applications";
import { getInterviewPlans } from "@/services/interview-plans";
import { getLearningRoadmapsForUser } from '@/services/learning-roadmaps';
import { getUserRewards } from '@/services/user-rewards';
import { format, subDays } from 'date-fns';
import { calculateDayActivity } from '@/app/profile/utils';

export default function ReportsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const [reportOptions, setReportOptions] = useState({
        dailyTracker: {
            include: true,
            summary: true,
            fullList: true,
            focusWalletSummary: true,
            activityLog: false,
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
            includeChallenges: false,
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
    
    const handleGenerateReport = async (formatType: 'pdf' | 'excel') => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        toast({ title: "Generating Report...", description: `Your ${formatType.toUpperCase()} file is being prepared.` });
        
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, 30); // Default to last 30 days for now

            // Fetch all data concurrently
            const [dailyTasks, rewards, jobApps, interviewPlans, learningRoadmaps] = await Promise.all([
                reportOptions.dailyTracker.include ? getTasksForDateRange(startDate, endDate, user.uid) : Promise.resolve([]),
                reportOptions.dailyTracker.include ? getUserRewards(user.uid) : Promise.resolve([]),
                reportOptions.jobTracker.include ? getJobApplications(user.uid) : Promise.resolve([]),
                reportOptions.interviewPrep.include ? getInterviewPlans(user.uid) : Promise.resolve([]),
                reportOptions.aiLearning.include ? getLearningRoadmapsForUser(user.uid) : Promise.resolve([]),
            ]);

            // --- Excel Generation ---
            if (formatType === 'excel') {
                const wb = XLSX.utils.book_new();

                if (reportOptions.dailyTracker.include) {
                    const dailyData = [];
                    if (reportOptions.dailyTracker.summary) {
                         const completed = dailyTasks.filter(t => t.completed).length;
                         dailyData.push({ Section: "Summary", Item: "Tasks Completed", Value: `${completed} / ${dailyTasks.length}` });
                    }
                    if (reportOptions.dailyTracker.fullList) {
                        dailyTasks.forEach(t => dailyData.push({ Section: "Task List", Date: t.date, Time: t.time, Title: t.title, Status: t.completed ? 'Completed' : 'Incomplete' }));
                    }

                    if (reportOptions.dailyTracker.focusWalletSummary || reportOptions.dailyTracker.activityLog) {
                        const activity = processDailyActivity(dailyTasks, rewards);
                        if (reportOptions.dailyTracker.focusWalletSummary) {
                            dailyData.push({ Section: "Focus Wallet", Item: "Total Coins Earned", Value: activity.totalCredits });
                            dailyData.push({ Section: "Focus Wallet", Item: "Total Coins Spent", Value: activity.totalDebits });
                            dailyData.push({ Section: "Focus Wallet", Item: "Net Coin Change", Value: activity.netChange });
                        }
                        if (reportOptions.dailyTracker.activityLog) {
                            activity.log.forEach(day => {
                                dailyData.push({ Section: "Activity Log", Date: day.date, Earned: day.credits, Spent: day.debits, Net: day.netChange });
                            })
                        }
                    }
                    const ws = XLSX.utils.json_to_sheet(dailyData);
                    XLSX.utils.book_append_sheet(wb, ws, "Daily Tracker");
                }

                 if (reportOptions.jobTracker.include && jobApps.length > 0) {
                    const ws = XLSX.utils.json_to_sheet(jobApps.map(j => ({ Company: j.company, Title: j.title, Stage: j.stage })));
                    XLSX.utils.book_append_sheet(wb, ws, "Job Tracker");
                }

                XLSX.writeFile(wb, `SwitchBuddy_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
            } 
            
            // --- PDF Generation ---
            else {
                const doc = new jsPDF();
                let yPos = 20;
                doc.setFontSize(18);
                doc.text("SwitchBuddy Report", 10, yPos);
                yPos += 10;

                if (reportOptions.dailyTracker.include) {
                    doc.setFontSize(14);
                    doc.text("Daily Tracker", 10, yPos);
                    yPos += 8;
                    doc.setFontSize(10);
                    
                    const activity = processDailyActivity(dailyTasks, rewards);
                    if (reportOptions.dailyTracker.summary) {
                         const completed = dailyTasks.filter(t => t.completed).length;
                         doc.text(`- Summary: ${completed} of ${dailyTasks.length} tasks completed.`, 14, yPos);
                         yPos += 6;
                    }
                    if (reportOptions.dailyTracker.focusWalletSummary) {
                        doc.text(`- Focus Wallet: ${activity.netChange} net coins (${activity.totalCredits} earned, ${activity.totalDebits} spent).`, 14, yPos);
                        yPos += 6;
                    }
                    if (reportOptions.dailyTracker.fullList) {
                        doc.text(`- Full Task List: (${dailyTasks.length} tasks)`, 14, yPos);
                        yPos += 6;
                    }
                     if (reportOptions.dailyTracker.activityLog) {
                        doc.text(`- Activity Log: (${activity.log.length} active days)`, 14, yPos);
                        yPos += 6;
                    }
                    yPos += 10;
                }

                if (reportOptions.jobTracker.include && jobApps.length > 0) {
                    doc.setFontSize(14);
                    doc.text("Job Applications", 10, yPos);
                    yPos += 8;
                    doc.setFontSize(10);
                    jobApps.slice(0, 5).forEach(job => {
                        doc.text(`- ${job.title} at ${job.company} (${job.stage})`, 14, yPos);
                        yPos += 6;
                    });
                     if (jobApps.length > 5) {
                        doc.text(`...and ${jobApps.length - 5} more.`, 14, yPos);
                        yPos+= 6;
                    }
                    yPos += 10;
                }

                doc.save(`SwitchBuddy_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
            }
            
            toast({ title: "Success!", description: "Your report has been downloaded." });

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to generate the report.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    // Helper to process daily activity for reports
    const processDailyActivity = (tasks, rewards) => {
        const groupedByDate = tasks.reduce((acc, task) => {
            if (!acc[task.date]) acc[task.date] = [];
            acc[task.date].push(task);
            return acc;
        }, {});
        
        const rewardsGroupedByDate = rewards.reduce((acc, reward) => {
            const date = format(new Date(reward.redeemedAt), 'yyyy-MM-dd');
            if (!acc[date]) acc[date] = [];
            acc[date].push(reward);
            return acc;
        }, {});

        const allDates = [...new Set([...Object.keys(groupedByDate), ...Object.keys(rewardsGroupedByDate)])];
        
        const log = allDates.map(date => {
            const dayActivity = calculateDayActivity(groupedByDate[date] || [], tasks, rewardsGroupedByDate[date] || []);
            return { date, ...dayActivity };
        });

        const totalCredits = log.reduce((sum, day) => sum + day.credits, 0);
        const totalDebits = log.reduce((sum, day) => sum + day.debits, 0);

        return {
            log,
            totalCredits,
            totalDebits,
            netChange: totalCredits - totalDebits
        };
    }


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
                <ReportCard
                    title="Daily Tracker"
                    description="Export your tasks and productivity stats."
                    onToggleSection={() => handleCheckboxChange('dailyTracker', 'include')}
                    isIncluded={reportOptions.dailyTracker.include}
                >
                    <CheckboxOption id="dt-summary" label="Include Task Summary" checked={reportOptions.dailyTracker.summary} onCheckedChange={() => handleCheckboxChange('dailyTracker', 'summary')} />
                    <CheckboxOption id="dt-full-list" label="Include Full Task List" checked={reportOptions.dailyTracker.fullList} onCheckedChange={() => handleCheckboxChange('dailyTracker', 'fullList')} />
                    <CheckboxOption id="dt-wallet-summary" label="Include Focus Wallet Summary" checked={reportOptions.dailyTracker.focusWalletSummary} onCheckedChange={() => handleCheckboxChange('dailyTracker', 'focusWalletSummary')} />
                    <CheckboxOption id="dt-activity-log" label="Include Full Activity Log" checked={reportOptions.dailyTracker.activityLog} onCheckedChange={() => handleCheckboxChange('dailyTracker', 'activityLog')} />
                </ReportCard>
                
                <ReportCard
                    title="Job Tracker"
                    description="Export your job application pipeline."
                    onToggleSection={() => handleCheckboxChange('jobTracker', 'include')}
                    isIncluded={reportOptions.jobTracker.include}
                >
                    <CheckboxOption id="jt-summary" label="Summary View" checked={reportOptions.jobTracker.summaryView} onCheckedChange={() => handleCheckboxChange('jobTracker', 'summaryView')} />
                    <CheckboxOption id="jt-detailed" label="Detailed View (with notes)" checked={reportOptions.jobTracker.detailedView} onCheckedChange={() => handleCheckboxChange('jobTracker', 'detailedView')} disabled />
                </ReportCard>

                <ReportCard
                    title="Interview Prep"
                    description="Export your practice plans and session results."
                    onToggleSection={() => handleCheckboxChange('interviewPrep', 'include')}
                    isIncluded={reportOptions.interviewPrep.include}
                >
                    <CheckboxOption id="ip-overview" label="Plan Overviews" checked={reportOptions.interviewPrep.planOverview} onCheckedChange={() => handleCheckboxChange('interviewPrep', 'planOverview')} />
                    <CheckboxOption id="ip-history" label="Full Session History" checked={reportOptions.interviewPrep.sessionHistory} onCheckedChange={() => handleCheckboxChange('interviewPrep', 'sessionHistory')} disabled/>
                </ReportCard>
                
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

const getTasksForDateRange = async (startDate: Date, endDate: Date, userId: string) => {
    // This is a simplified fetch, a real implementation might paginate or be more complex
    const allTasks = await getTasksForDateRange(startDate, endDate, userId);
    return allTasks;
};
