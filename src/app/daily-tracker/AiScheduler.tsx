
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
import {BrainCircuit, CheckCircle2, Coffee, Lightbulb, Loader2, Plus, Sparkles, Target, CalendarPlus, Send} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { addTask, updateTask } from '@/services/daily-tasks';
import { InterviewTopicScheduler } from './InterviewTopicScheduler';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { sendDailyDebrief } from '@/ai/flows/send-daily-debrief';
import { sendWhatsAppDebrief } from '@/ai/flows/send-whatsapp-debrief';

function TelegramIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send h-4 w-4"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
    )
}

function WhatsAppIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M16.75 13.96c.25.13.43.2.5.28.07.08.15.18.22.33.07.15.03.31-.12.48-.15.17-.34.35-.57.52-.23.17-.5.35-.82.53-.32.18-.66.33-1.02.46-.36.13-.75.23-1.16.29-.41.06-.84.06-1.28-.02-.44-.08-.88-.2-1.3-.39-.42-.19-.82-.43-1.2-.72-.38-.29-.73-.63-1.05-1.01-.32-.38-.6-.79-.83-1.22-.23-.43-.4-.88-.52-1.34-.12-.46-.18-.94-.18-1.42 0-.48.06-1 .18-1.48.12-.48.3-1 .53-1.44.23-.44.5-1 .82-1.42.32-.42.68-.78 1.08-1.08.4-.3.83-.53 1.28-.7.45-.17.92-.28 1.4-.33.48-.05.97-.05 1.45.02.48.07.95.18 1.4.35.45.17.88.39 1.28.66.4.27.78.58 1.1.95.32.37.6.78.84 1.21.24.43.4.9.52 1.38.12.48.18.98.18 1.48 0 .44-.05.88-.16 1.32-.11.44-.28.88-.5 1.3-.15.28-.3.53-.48.75-.18.22-.38.43-.59.61-.21.18-.42.35-.62.51l-.01.01zM12.01 2.01c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
    )
}

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
  const [isSending, startSendTransition] = useTransition();
  const [deliveryOptions, setDeliveryOptions] = useState({ telegram: true, whatsApp: true });


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

  const handleSendNow = () => {
    if (!summaryResult) {
      toast({ title: 'No summary to send', description: 'Please generate a daily debrief first.', variant: 'destructive'});
      return;
    }

    startSendTransition(async () => {
      let sentTo = [];
      if (deliveryOptions.telegram) {
        toast({ title: 'Sending to Telegram...', description: 'This may take a moment.' });
        try {
            const result = await sendDailyDebrief(summaryResult);
            if (result.success) {
              toast({ title: 'Success!', description: 'Your daily debrief was sent to Telegram.'});
              sentTo.push('Telegram');
            } else {
              toast({ title: 'Telegram Error', description: result.message, variant: 'destructive'});
            }
        } catch (error) {
            toast({ title: 'Telegram Error', description: 'Failed to send message.', variant: 'destructive'});
        }
      }
      if (deliveryOptions.whatsApp) {
        toast({ title: 'Sending to WhatsApp...', description: 'This is a simulation.' });
        try {
            const result = await sendWhatsAppDebrief(summaryResult);
             if (result.success) {
              toast({ title: 'Success!', description: 'Your daily debrief was sent to WhatsApp (Simulated).'});
              sentTo.push('WhatsApp');
            } else {
              toast({ title: 'WhatsApp Error', description: result.message, variant: 'destructive'});
            }
        } catch(error) {
            toast({ title: 'WhatsApp Error', description: 'Failed to send message.', variant: 'destructive'});
        }
      }

      if (sentTo.length === 0 && !deliveryOptions.whatsApp && !deliveryOptions.telegram) {
        toast({ title: "No channels selected", description: "Please select Telegram or WhatsApp to send the schedule.", variant: 'destructive'});
      }
    });
  }

  const getTaskIcon = (taskTitle: string) => {
    const lowerCaseTitle = taskTitle.toLowerCase();
    if (lowerCaseTitle.includes('break') || lowerCaseTitle.includes('coffee') || lowerCaseTitle.includes('lunch') || lowerCaseTitle.includes('dinner')) return <Coffee className="h-5 w-5 text-amber-600" />;
    if (lowerCaseTitle.includes('reflect') || lowerCaseTitle.includes('review') || lowerCaseTitle.includes('checkpoint')) return <Lightbulb className="h-5 w-5 text-purple-600" />;
    if (lowerCaseTitle.includes('practice') || lowerCaseTitle.includes('system design') || lowerCaseTitle.includes('coding') || lowerCaseTitle.includes('interview') || lowerCaseTitle.includes('application')) return <Target className="h-5 w-5 text-blue-600" />;
    return <Sparkles className="h-5 w-5 text-gray-500" />;
  }

  return (
    <div className="space-y-8">
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

                <div className="p-4 border-t mt-4 space-y-3">
                    <h3 className="font-semibold text-base">🛎️ Send me this schedule</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant={deliveryOptions.telegram ? 'default' : 'outline'} onClick={() => setDeliveryOptions(p => ({...p, telegram: !p.telegram}))}>
                                <TelegramIcon /> Telegram {deliveryOptions.telegram && "✅"}
                            </Button>
                            <Button size="sm" variant={deliveryOptions.whatsApp ? 'default' : 'outline'} onClick={() => setDeliveryOptions(p => ({...p, whatsApp: !p.whatsApp}))}>
                               <WhatsAppIcon /> WhatsApp {deliveryOptions.whatsApp && "✅"}
                            </Button>
                        </div>
                        <Button size="sm" onClick={handleSendNow} className="w-full sm:w-auto sm:ml-auto" disabled={isSending}>
                            {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                            Send Now
                        </Button>
                    </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
