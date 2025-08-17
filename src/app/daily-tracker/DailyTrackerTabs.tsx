
'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiScheduler } from "./AiScheduler";
import { DailySchedule } from "./DailySchedule";
import { MissedAndRescheduledTasks } from "./MissedAndRescheduledTasks";
import { WeeklyTimetable } from "./WeeklyTimetable";
import { useEffect, useState } from "react";
import { DailyTask } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { subDays, format } from 'date-fns';


interface DailyTrackerTabsProps {
    tasks: DailyTask[];
    loading: boolean;
}

export function DailyTrackerTabs({ tasks, loading }: DailyTrackerTabsProps) {
    const { user } = useAuth();
    const [pastTasks, setPastTasks] = useState<DailyTask[]>([]);

     useEffect(() => {
        if (!user) return;
        
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
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="daily">Daily</TabsTrigger>
        <TabsTrigger value="weekly">Weekly</TabsTrigger>
        <TabsTrigger value="ai-scheduler">AI Smart Scheduler</TabsTrigger>
        <TabsTrigger value="missed-rescheduled">Missed/Rescheduled</TabsTrigger>
      </TabsList>
      <TabsContent value="daily" className="mt-6">
        <DailySchedule tasks={tasks} loading={loading}/>
      </TabsContent>
      <TabsContent value="weekly" className="mt-6">
        <WeeklyTimetable />
      </TabsContent>
       <TabsContent value="ai-scheduler" className="mt-6">
        <AiScheduler />
      </TabsContent>
       <TabsContent value="missed-rescheduled" className="mt-6">
        <MissedAndRescheduledTasks tasks={pastTasks} />
      </TabsContent>
    </Tabs>
  );
}
