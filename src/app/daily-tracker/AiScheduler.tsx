
'use client';

import {
  generateDailyPlan,
} from '@/ai/flows/schedule-optimizer';
import {
  generateDailySummary,
} from '@/ai/flows/schedule-optimizer';
import { GenerateDailyPlanOutput, GenerateDailySummaryOutput, ScheduledTask } from '@/lib/types';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {useAuth} from '@/lib/auth';
import {db} from '@/lib/firebase';
import {DailyTask} from '@/lib/types';
import {collection, onSnapshot, query, where} from 'firebase/firestore';
import {format as formatDateFns, parse} from 'date-fns';
import {useEffect, useState, useTransition} from 'react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {BrainCircuit, CheckCircle2, Coffee, Lightbulb, Loader2, Plus, Sparkles, Target, CalendarPlus} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { addTask, updateTask } from '@/services/daily-tasks';
import { InterviewTopicScheduler } from './InterviewTopicScheduler';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AutomatedDebriefScheduler } from './AutomatedDebriefScheduler';

export function AiScheduler() {
  const {user} = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [isGeneratingPlan, startPlanTransition] = useTransition();
  const [planResult, setPlanResult] =
    useState<GenerateDailyPlanOutput | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const [isGeneratingSummary, startSummaryTransition] = useTransition();
  const [summaryResult, setSummaryResult] =
    useState<GenerateDailySummaryOutput | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  const [isAddingTask, startAddTaskTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    const today = formatDateFns(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'daily_tasks'),
      where('date', '==', today),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedTasks = querySnapshot.docs.map(
          (doc) => ({id: doc.id, ...doc.data()} as DailyTask)
        );
        setTasks(fetchedTasks);
        setLoadingTasks(false);
      },
      (error) => {
        console.error("Error fetching today's tasks: ", error);
        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleGeneratePlan = () => {
    startPlanTransition(async () => {
      setPlanError(null);
      setPlanResult(null);
      try {
        const result = await generateDailyPlan({});
        if (result) {
          setPlanResult(result);
        } else {
          setPlanError('The AI could not generate a plan. Please try again.');
        }
      } catch (error) {
        console.error(error);
        setPlanError('An error occured while generating the plan.');
      }
    });
  };
  
  const handleAddTask = (item: ScheduledTask) => {
    if (!user) return;
    startAddTaskTransition(async () => {
        try {
            const today = new Date();
            // The AI returns time like "06:00 AM". We parse it to a Date object then format to "HH:mm"
            const parsedTime = parse(item.time, 'hh:mm a', new Date());
            const formattedTime = formatDateFns(parsedTime, 'HH:mm');

            const newTask: Omit<DailyTask, 'id'> = {
                title: item.task,
                description: item.motivation,
                date: formatDateFns(today, 'yyyy-MM-dd'),
                time: formattedTime,
                type: 'schedule',
                completed: false,
            };
            
            await addTask(newTask, user.uid);

            toast({
                title: "Task Added!",
                description: `"${item.task}" was added to your schedule for today.`
            });

        } catch (error) {
            console.error("Failed to add task:", error);
            toast({
                title: "Error",
                description: "Could not add task to schedule.",
                variant: 'destructive',
            })
        }
    })
  }

  const handleGenerateSummary = () => {
    if (!tasks.length) {
      setSummaryError('There are no tasks from today to summarize.');
      return;
    }
    startSummaryTransition(async () => {
      setSummaryError(null);
      setSummaryResult(null);
      try {
        const result = await generateDailySummary({tasks});
        if (result) {
          setSummaryResult(result);
        } else {
          setSummaryError(
            'The AI could not generate a summary. Please try again.'
          );
        }
      } catch (error) {
        console.error(error);
        setSummaryError('An error occured while generating the summary.');
      }
    });
  };

  const getTaskIcon = (taskTitle: string) => {
    const lowerCaseTitle = taskTitle.toLowerCase();
    if (lowerCaseTitle.includes('break') || lowerCaseTitle.includes('coffee') || lowerCaseTitle.includes('lunch') || lowerCaseTitle.includes('dinner')) return <Coffee className="h-5 w-5 text-amber-600" />;
    if (lowerCaseTitle.includes('reflect') || lowerCaseTitle.includes('review') || lowerCaseTitle.includes('checkpoint')) return <Lightbulb className="h-5 w-5 text-purple-600" />;
    if (lowerCaseTitle.includes('practice') || lowerCaseTitle.includes('system design') || lowerCaseTitle.includes('coding') || lowerCaseTitle.includes('interview') || lowerCaseTitle.includes('application')) return <Target className="h-5 w-5 text-blue-600" />;
    return <Sparkles className="h-5 w-5 text-gray-500" />;
  }

  return (
    <div className="space-y-8">
      {/* Automated Debrief Scheduler */}
      <AutomatedDebriefScheduler />

      {/* Smart Daily Plan Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-2xl">
            <BrainCircuit /> Your AI-Generated Daily Battle Plan
          </CardTitle>
          <CardDescription>
            Tired of planning? Let your AI coach build a strict, motivational schedule to keep you on track and push you to succeed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          <Button
            onClick={handleGeneratePlan}
            disabled={isGeneratingPlan}
          >
            {isGeneratingPlan ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Sparkles className="mr-2" />
            )}
            Generate My Battle Plan
          </Button>

          {planError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{planError}</AlertDescription>
            </Alert>
          )}

          {isGeneratingPlan && (
             <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
          )}

          {planResult && (
            <div className="mt-6">
              <ul className="space-y-1">
                {planResult.optimizedSchedule.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-4 rounded-md p-3 border-b last:border-b-0"
                  >
                    <span className="font-mono text-sm text-muted-foreground w-20 pt-0.5">
                      {item.time}
                    </span>
                    <div className="flex-grow flex items-start gap-4">
                      <div className="pt-0.5">{getTaskIcon(item.task)}</div>
                      <div>
                        <p className="font-medium leading-tight">{item.task}</p>
                        <p className="text-xs text-muted-foreground italic mt-1">&quot;{item.motivation}&quot;</p>
                      </div>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => handleAddTask(item)} disabled={isAddingTask} aria-label="Add to schedule">
                        <Plus className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Interview Topic Scheduler */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base md:text-2xl">
                <CalendarPlus /> Interview Topic Scheduler
            </CardTitle>
            <CardDescription>
                Generate a day-by-day interview preparation schedule for a user-selected topic.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <InterviewTopicScheduler />
        </CardContent>
      </Card>

      {/* Daily Debrief & Next-Day Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base md:text-2xl">
            <CheckCircle2 /> Daily Debrief &amp; Accountability
          </CardTitle>
          <CardDescription>
            Review today&apos;s progress, see rescheduled tasks, and get your top priorities for tomorrow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTasks ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <Button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary || !tasks.length}
            >
              {isGeneratingSummary ? (
                <Loader2 className="mr-2 animate-spin" />
              ) : (
                <Sparkles className="mr-2" />
              )}
              Generate Daily Debrief
            </Button>
          )}
           {summaryError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{summaryError}</AlertDescription>
            </Alert>
          )}
           {isGeneratingSummary && (
             <div className="mt-4 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/2" />
            </div>
          )}
           {summaryResult && (
            <div className="mt-6 space-y-4 text-sm">
                <div className="flex flex-wrap gap-4">
                     <div className="flex-1 min-w-[120px] p-3 bg-muted/50 rounded-md">
                        <p className="font-semibold">Today&apos;s Summary</p>
                        <p className="text-2xl font-bold">{summaryResult.completedTasks}/{summaryResult.totalTasks}</p>
                        <p className="text-xs text-muted-foreground">tasks completed</p>
                     </div>
                      <div className="flex-1 min-w-[120px] p-3 bg-muted/50 rounded-md">
                        <p className="font-semibold">Streak</p>
                        <p className="text-2xl font-bold">🔥 {summaryResult.streak}</p>
                        <p className="text-xs text-muted-foreground">days in a row</p>
                     </div>
                </div>

                {summaryResult.missedTasks.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2 text-base">📌 Missed Tasks (Rescheduled)</h3>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-r-md">
                            <ul className="space-y-1 list-none">
                                {summaryResult.missedTasks.map((item, index) => (
                                <li key={index} className="flex justify-between items-center">
                                    <span>{item.title}</span>
                                    <Badge variant="outline">{item.rescheduledTime}</Badge>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                 
                 <div>
                    <h3 className="font-semibold mb-2 text-base">🎯 Top 3 Priorities for Tomorrow:</h3>
                     <ul className="space-y-2 list-decimal pl-5">
                        {summaryResult.nextDayPriorities.map((item, index) => (
                           <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
