
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
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";


interface DailyTrackerTabsProps {
    tasks: DailyTask[];
    loading: boolean;
}

const sections = [
    { value: 'daily', label: 'Daily Schedule' },
    { value: 'weekly', label: 'Weekly Timetable' },
    { value: 'ai-scheduler', label: 'AI Smart Scheduler' },
    { value: 'missed-rescheduled', label: 'Missed/Rescheduled' },
]


export function DailyTrackerTabs({ tasks, loading }: DailyTrackerTabsProps) {
    const { user } = useAuth();
    const [pastTasks, setPastTasks] = useState<DailyTask[]>([]);
    const isMobile = useIsMobile();
    const [activeView, setActiveView] = useState('daily');

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

  const renderContent = (view: string) => {
    switch (view) {
        case 'daily':
            return <DailySchedule tasks={tasks} loading={loading}/>;
        case 'weekly':
            return <WeeklyTimetable />;
        case 'ai-scheduler':
            return <AiScheduler />;
        case 'missed-rescheduled':
            return <MissedAndRescheduledTasks tasks={pastTasks} />;
        default:
            return <DailySchedule tasks={tasks} loading={loading}/>;
    }
  }

  if (isMobile) {
      return (
          <div className="space-y-4">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                          {sections.find(s => s.value === activeView)?.label}
                          <ChevronDown />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                      {sections.map(section => (
                          <DropdownMenuItem key={section.value} onSelect={() => setActiveView(section.value)}>
                              {section.label}
                          </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
              </DropdownMenu>
              <div className="mt-6">
                {renderContent(activeView)}
              </div>
          </div>
      )
  }

  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        {sections.map(section => (
          <TabsTrigger key={section.value} value={section.value}>{section.label}</TabsTrigger>
        ))}
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
