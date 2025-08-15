'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailySchedule } from "./DailySchedule";
import { WeeklyTimetable } from "./WeeklyTimetable";
import { DailyTask } from "@/lib/types";
import { useEffect, useState } from "react";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from "@/lib/auth";

export function DailyTrackerTabs() {
  const { user } = useAuth();
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [weekTasks, setWeekTasks] = useState<DailyTask[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [loadingWeek, setLoadingWeek] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoadingToday(false);
        setLoadingWeek(false);
        setTodayTasks([]);
        setWeekTasks([]);
        return;
    };
    
    setLoadingToday(true);
    setLoadingWeek(true);

    // Listener for today's tasks
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayQuery = query(collection(db, "daily_tasks"), where("date", "==", today), where("userId", "==", user.uid));
    const unsubscribeToday = onSnapshot(todayQuery, (querySnapshot) => {
      const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
      setTodayTasks(tasks);
      setLoadingToday(false);
    }, (error) => {
        console.error("Error fetching today's tasks: ", error);
        setLoadingToday(false);
    });

    // Listener for this week's tasks
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    const weekQuery = query(
        collection(db, "daily_tasks"), 
        where("userId", "==", user.uid),
        where("date", ">=", format(weekStart, 'yyyy-MM-dd')), 
        where("date", "<=", format(weekEnd, 'yyyy-MM-dd'))
    );
    const unsubscribeWeek = onSnapshot(weekQuery, (querySnapshot) => {
        const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTask));
        setWeekTasks(tasks);
        setLoadingWeek(false);
    }, (error) => {
        console.error("Error fetching week's tasks: ", error);
        setLoadingWeek(false);
    });

    return () => {
      unsubscribeToday();
      unsubscribeWeek();
    };
  }, [user]);

  return (
    <Tabs defaultValue="daily" className="flex-grow flex flex-col">
      <TabsList className="w-full sm:w-auto self-start">
        <TabsTrigger value="daily">Daily Schedule</TabsTrigger>
        <TabsTrigger value="weekly">Weekly Timetable</TabsTrigger>
      </TabsList>
      <TabsContent value="daily" className="flex-grow mt-4">
        <DailySchedule tasks={todayTasks} loading={loadingToday} />
      </TabsContent>
      <TabsContent value="weekly" className="flex-grow mt-4">
        <WeeklyTimetable tasks={weekTasks} loading={loadingWeek} />
      </TabsContent>
    </Tabs>
  );
}
