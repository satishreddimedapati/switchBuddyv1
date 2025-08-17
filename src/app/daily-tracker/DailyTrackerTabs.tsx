
'use client';

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {DailySchedule} from './DailySchedule';
import {WeeklyTimetable} from './WeeklyTimetable';
import {AiScheduler} from './AiScheduler';
import { MissedAndRescheduledTasks } from './MissedAndRescheduledTasks';
import type { DailyTask } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays, format } from 'date-fns';

export function DailyTrackerTabs() {
  const { user } = useAuth();
  const [pastTasks, setPastTasks] = useState<DailyTask[]>([]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch tasks from the last 7 days that are either rescheduled or were missed
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    const q = query(
      collection(db, 'daily_tasks'),
      where('userId', '==', user.uid),
      where('date', '>=', sevenDaysAgo)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allPastWeekTasks = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as DailyTask);
        const relevantTasks = allPastWeekTasks.filter(task => task.rescheduled || (!task.completed && task.date < format(new Date(), 'yyyy-MM-dd')));
        setPastTasks(relevantTasks);
    });

    return () => unsubscribe();
  }, [user]);


  return (
    <>
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight">
              Daily Tracker
            </h1>
            <p className="text-muted-foreground">
              Track your daily activities and manage your weekly schedule.
            </p>
          </div>
        </div>
      </div>
      <Tabs defaultValue="daily" className="flex-grow flex flex-col">
        <TabsList className="w-full sm:w-auto self-start grid grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="ai-scheduler">AI Smart Scheduler</TabsTrigger>
          <TabsTrigger value="missed-rescheduled">Missed/Rescheduled</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="flex-grow mt-4">
          <DailySchedule />
        </TabsContent>
        <TabsContent value="weekly" className="flex-grow mt-4">
          <WeeklyTimetable />
        </TabsContent>
        <TabsContent value="ai-scheduler" className="flex-grow mt-4">
          <AiScheduler />
        </TabsContent>
         <TabsContent value="missed-rescheduled" className="flex-grow mt-4">
          <MissedAndRescheduledTasks tasks={pastTasks} />
        </TabsContent>
      </Tabs>
    </>
  );
}
