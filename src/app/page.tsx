
"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getJobApplications } from "@/services/job-applications";
import { Award, Briefcase, CalendarCheck, CheckCircle, ListTodo, PlusCircle, Video } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, useMemo } from "react";
import type { JobApplication, InterviewPlan, DailyTask } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getInterviewPlans } from "@/services/interview-plans";
import { getTasksForDate } from "@/services/daily-tasks";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { updateTask } from "@/services/daily-tasks";
import { cn } from "@/lib/utils";

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-8">
            <div className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
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
      setInterviewPlans(plans.filter(p => (p.completedInterviews || 0) < p.totalInterviews));
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
            Today is {format(new Date(), 'EEEE, MMMM d')}. Let&apos;s make some progress.
          </p>
        </div>

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

        <div className="grid gap-6 lg:grid-cols-2 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Focus for Today</CardTitle>
                    <CardDescription>{tasksCompleted} of {todaysTasks.length} tasks completed.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Progress value={tasksProgress} />
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                        {todaysTasks.length > 0 ? (
                            todaysTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3">
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
                                        <span className="text-muted-foreground ml-2">{format(new Date(`1970-01-01T${task.time}`), 'h:mm a')}</span>
                                    </label>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground">No tasks scheduled for today.</p>
                                <Button variant="link" asChild><Link href="/daily-tracker"><PlusCircle className="mr-2"/>Schedule Tasks</Link></Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Active Interview Plans</CardTitle>
                         <CardDescription>Your ongoing mock interview practice plans.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                       {interviewPlans.length > 0 ? (
                           interviewPlans.slice(0, 2).map(plan => (
                               <div key={plan.id} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                                   <div>
                                       <p className="font-semibold">{plan.topic}</p>
                                       <p className="text-sm text-muted-foreground">Completed: {plan.completedInterviews} / {plan.totalInterviews}</p>
                                   </div>
                                   <Button size="sm" asChild>
                                       <Link href={`/interview-prep`}><Video className="mr-2"/>Start Next</Link>
                                   </Button>
                               </div>
                           ))
                       ) : (
                           <div className="text-center py-4">
                                <p className="text-muted-foreground">No active interview plans.</p>
                                <Button variant="link" asChild><Link href="/interview-prep/new"><PlusCircle className="mr-2"/>Create a Plan</Link></Button>
                            </div>
                       )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Recent Applications</CardTitle>
                        <CardDescription>Your latest tracked job applications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {jobApplications.length > 0 ? (
                            jobApplications.slice(0, 3).map(job => (
                                <div key={job.id} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{job.title}</p>
                                        <p className="text-muted-foreground">{job.company}</p>
                                    </div>
                                    <p className="font-semibold text-muted-foreground">{job.stage}</p>
                                </div>
                            ))
                        ) : (
                             <div className="text-center py-4">
                                <p className="text-muted-foreground">No jobs tracked yet.</p>
                                <Button variant="link" asChild><Link href="/tracker"><PlusCircle className="mr-2"/>Add a Job</Link></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
  );
}
