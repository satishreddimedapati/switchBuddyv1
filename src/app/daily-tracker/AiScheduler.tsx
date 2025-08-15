'use client';

import {
  generateDailyPlan,
} from '@/ai/flows/schedule-optimizer';
import {
  generateDailySummary,
} from '@/ai/flows/schedule-optimizer';
import { GenerateDailyPlanOutput, GenerateDailySummaryOutput } from '@/lib/types';
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
import {format} from 'date-fns';
import {useEffect, useState, useTransition} from 'react';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {BrainCircuit, CheckCircle2, Loader2, Sparkles} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { addTask, updateTask } from '@/services/daily-tasks';

export function AiScheduler() {
  const {user} = useAuth();
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

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoadingTasks(false);
      return;
    }

    setLoadingTasks(true);
    const today = format(new Date(), 'yyyy-MM-dd');
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
    if (!tasks.length) {
      setPlanError('There are no tasks to schedule for today.');
      return;
    }
    startPlanTransition(async () => {
      setPlanError(null);
      setPlanResult(null);
      try {
        const result = await generateDailyPlan({
          tasks,
          startTime: '09:00',
          endTime: '18:00',
        });
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

  const handleApplyPlan = () => {
    if (!planResult || !user) return;
    
    planResult.optimizedSchedule.forEach(async (scheduledTask) => {
        if (scheduledTask.type === 'task') {
            await updateTask(scheduledTask.id, { time: scheduledTask.time }, user.uid);
        } else if (scheduledTask.type === 'break') {
            await addTask({
                title: scheduledTask.title,
                time: scheduledTask.time,
                date: format(new Date(), 'yyyy-MM-dd'),
                type: 'schedule',
                completed: false,
                description: 'A short break to recharge.'
            }, user.uid)
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

  return (
    <div className="space-y-8">
      {/* Smart Daily Plan Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit /> Smart Daily Plan Generator
          </CardTitle>
          <CardDescription>
            Let AI create an optimized, time-based plan for your day based on
            your existing tasks. It will even add breaks for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTasks ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <>
              <Button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || !tasks.length}
              >
                {isGeneratingPlan ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <Sparkles className="mr-2" />
                )}
                Generate Today's Plan
              </Button>
              {!tasks.length && !loadingTasks && (
                <p className="text-sm text-muted-foreground mt-2">
                  No tasks scheduled for today. Add some tasks in the 'Daily' tab first.
                </p>
              )}
            </>
          )}

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
            </div>
          )}

          {planResult && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Your Optimized Schedule:</h3>
              <ul className="space-y-2">
                {planResult.optimizedSchedule.map((item, index) => (
                  <li
                    key={index}
                    className={cn("flex items-center gap-4 rounded-md p-2",
                        item.type === 'break' ? 'bg-amber-100/50' : 'bg-muted/50'
                    )}
                  >
                    <span className="font-mono text-sm text-muted-foreground w-16">
                      {item.time}
                    </span>
                    <span className="font-medium">{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        {planResult && (
            <CardFooter className='border-t pt-6'>
                <Button onClick={handleApplyPlan}>Apply This Schedule</Button>
            </CardFooter>
        )}
      </Card>

      {/* Daily Summary & Next-Day Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 /> Daily Summary &amp; Next-Day Plan
          </CardTitle>
          <CardDescription>
            Get a motivational summary of your achievements and see the top 3
            priorities for tomorrow.
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
              Generate Daily Summary
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
            <div className="mt-6 space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Today's Summary:</h3>
                    <p className='text-sm leading-relaxed bg-muted/50 p-3 rounded-md'>{summaryResult.motivationalSummary}</p>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Top 3 Priorities for Tomorrow:</h3>
                     <ul className="space-y-2 list-disc pl-5">
                        {summaryResult.nextDayPriorities.map((item, index) => (
                           <li key={index} className="text-sm">{item}</li>
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
