'use client';

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {DailySchedule} from './DailySchedule';
import {WeeklyTimetable} from './WeeklyTimetable';
import {AiScheduler} from './AiScheduler';
import { RescheduledTasks } from './RescheduledTasks';
import type { DailyTask } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function DailyTrackerTabs() {
  const { user } = useAuth();
  const [rescheduledTasks, setRescheduledTasks] = useState<DailyTask[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'daily_tasks'),
      where('userId', '==', user.uid),
      where('rescheduled', '!=', null)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as DailyTask);
        setRescheduledTasks(tasks);
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
          <TabsTrigger value="rescheduled">Rescheduled</TabsTrigger>
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
         <TabsContent value="rescheduled" className="flex-grow mt-4">
          <RescheduledTasks tasks={rescheduledTasks} />
        </TabsContent>
      </Tabs>
    </>
  );
}
