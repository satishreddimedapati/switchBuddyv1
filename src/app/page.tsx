
"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { getJobApplications } from "@/services/job-applications";
import { Award, Briefcase, CalendarCheck, CheckCircle, ListTodo, PlusCircle, Video, CalendarPlus, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, useMemo } from "react";
import type { JobApplication, InterviewPlan, DailyTask } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getInterviewPlans } from "@/services/interview-plans";
import { getTasksForDate } from "@/services/daily-tasks";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { updateTask } from "@/services/daily-tasks";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4">
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-48 w-full" />
                 <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [interviewPlans, setInterviewPlans] = useState<InterviewPlan[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) {
        setLoading(false);
        return;
      };
      setLoading(true);

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      const [jobs, plans, tasks] = await Promise.all([
        getJobApplications(user.uid),
        getInterviewPlans(user.uid),
        getTasksForDate(todayStr, user.uid),
      ]);
      
      setJobApplications(jobs);
      setInterviewPlans(plans);
      setTodaysTasks(tasks.sort((a,b) => a.time.localeCompare(b.time)));

      setLoading(false);
    }
    fetchDashboardData();
  }, [user]);

  const stats = useMemo(() => {
    const applicationsSent = jobApplications.filter(job => job.stage !== 'Wishlist').length;
    const interviewsScheduled = jobApplications.filter(job => job.stage === 'Interview').length;
    const offersReceived = jobApplications.filter(job => job.stage === 'Offer').length;
    return [
        { title: "Applications Sent", value: applicationsSent, icon: Briefcase },
        { title: "Interviews Scheduled", value: interviewsScheduled, icon: CalendarCheck },
        { title: "Offers Received", value: offersReceived, icon: Award },
    ]
  }, [jobApplications]);
  
  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (!user) return;
    setTodaysTasks(prevTasks => prevTasks.map(t => t.id === taskId ? {...t, completed} : t));
    await updateTask(taskId, { completed }, user.uid);
  }

  const tasksCompleted = useMemo(() => todaysTasks.filter(t => t.completed).length, [todaysTasks]);
  const tasksProgress = todaysTasks.length > 0 ? (tasksCompleted / todaysTasks.length) * 100 : 0;
  
  const activeInterviewPlans = useMemo(() => interviewPlans.filter(p => (p.completedInterviews || 0) < p.totalInterviews), [interviewPlans]);

  if (loading) {
      return <LoadingSkeleton />;
  }

  return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Today is {format(new Date(), 'EEEE, MMMM d')}. Let's make some progress.
          </p>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button asChild variant="outline">
                    <Link href="/job-switch-helper?tab=tracker">
                        <PlusCircle />
                        Add Job
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/daily-tracker">
                        <CalendarPlus />
                        Schedule Task
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/job-switch-helper?tab=interview-prep">
                        <Video />
                        New Prep Plan
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/job-switch-helper?tab=intelligence">
                        <Search />
                        Analyze Role
                    </Link>
                </Button>
            </CardContent>
        </Card>

        <Accordion type="multiple" defaultValue={['agenda']} className="w-full space-y-4">
           {/* Today's Agenda */}
           <AccordionItem value="agenda">
                <Card>
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <CardHeader className="p-0 text-left">
                            <CardTitle>Today&apos;s Agenda</CardTitle>
                            <CardDescription>{tasksCompleted} of {todaysTasks.length} tasks completed today.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <div className="space-y-4">
                            <Progress value={tasksProgress} />
                            <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                                {todaysTasks.length > 0 ? (
                                    todaysTasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <Checkbox 
                                                id={`task-${task.id}`}
                                                checked={task.completed} 
                                                onCheckedChange={(checked) => handleTaskToggle(task.id, Boolean(checked))}
                                            />
                                            <label 
                                                htmlFor={`task-${task.id}`}
                                                className={cn("flex-grow text-sm", task.completed && "line-through text-muted-foreground")}
                                            >
                                                <span className="font-medium">{task.title}</span>
                                                <span className="text-muted-foreground ml-2">{format(parse(task.time, 'HH:mm', new Date()), 'h:mm a')}</span>
                                            </label>
                                            <Badge variant={task.type === 'interview' ? 'default' : 'secondary'} className="capitalize">{task.type}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">No tasks scheduled for today.</p>
                                        <Button variant="link" asChild><Link href="/daily-tracker"><PlusCircle className="mr-2"/>Schedule Your Day</Link></Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AccordionContent>
                </Card>
           </AccordionItem>
           
           {/* Job Application Overview */}
           <AccordionItem value="applications">
                <Card>
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <CardHeader className="p-0 text-left">
                           <CardTitle>Job Application Overview</CardTitle>
                            <CardDescription>A summary of your application stats and recent activity.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                         <div className="space-y-6">
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                              {stats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <Card key={stat.title}>
                                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                          {stat.title}
                                        </CardTitle>
                                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-2xl font-bold">{stat.value}</div>
                                      </CardContent>
                                    </Card>
                                );
                              })}
                            </div>
                            <Separator />
                            <div>
                                <h3 className="text-md font-semibold mb-2">Recent Applications</h3>
                                <div className="space-y-2">
                                    {jobApplications.length > 0 ? (
                                        jobApplications.slice(0, 3).map(job => (
                                            <div key={job.id} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                                                <div>
                                                    <p className="font-medium">{job.title}</p>
                                                    <p className="text-muted-foreground">{job.company}</p>
                                                </div>
                                                <Badge variant="outline">{job.stage}</Badge>
                                            </div>
                                        ))
                                    ) : (
                                         <div className="text-center py-8">
                                            <p className="text-muted-foreground">No jobs tracked yet.</p>
                                            <Button variant="link" asChild><Link href="/job-switch-helper?tab=tracker"><PlusCircle className="mr-2"/>Add a Job</Link></Button>
                                        </div>
                                    )}
                                </div>
                                {jobApplications.length > 0 && (
                                    <div className="mt-4">
                                        <Button variant="secondary" className="w-full" asChild><Link href="/job-switch-helper?tab=tracker">View All Applications</Link></Button>
                                    </div>
                                )}
                            </div>
                         </div>
                    </AccordionContent>
                </Card>
           </AccordionItem>
           
           {/* Interview Prep Zone */}
           <AccordionItem value="prep">
                <Card>
                    <AccordionTrigger className="p-6 hover:no-underline">
                        <CardHeader className="p-0 text-left">
                            <CardTitle>Interview Prep Zone</CardTitle>
                            <CardDescription>Your active practice plans.</CardDescription>
                        </CardHeader>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <div className="space-y-4">
                            {activeInterviewPlans.length > 0 ? (
                               activeInterviewPlans.slice(0, 3).map(plan => (
                                   <div key={plan.id} className="p-4 rounded-md border bg-muted/30">
                                       <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{plan.topic}</p>
                                                <Badge variant="secondary" className="mt-1">{plan.difficulty}</Badge>
                                            </div>
                                            <Button size="sm" asChild>
                                               <Link href={`/job-switch-helper?tab=interview-prep`}><Video className="mr-2"/>Start</Link>
                                           </Button>
                                       </div>
                                       <div className="mt-3 space-y-2">
                                           <Progress value={(plan.completedInterviews / plan.totalInterviews) * 100} />
                                           <p className="text-xs text-muted-foreground">Progress: {plan.completedInterviews} / {plan.totalInterviews} completed</p>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="text-center py-10">
                                    <p className="text-muted-foreground">No active interview plans.</p>
                                    <Button variant="link" asChild><Link href="/job-switch-helper?tab=interview-prep"><PlusCircle className="mr-2"/>Create a New Plan</Link></Button>
                                </div>
                           )}
                        </div>
                        {activeInterviewPlans.length > 0 && (
                            <div className="mt-4">
                                <Button className="w-full" asChild>
                                    <Link href="/job-switch-helper?tab=interview-prep">Go to Prep Dashboard</Link>
                                </Button>
                            </div>
                        )}
                    </AccordionContent>
                </Card>
           </AccordionItem>
        </Accordion>
      </div>
  );
}
