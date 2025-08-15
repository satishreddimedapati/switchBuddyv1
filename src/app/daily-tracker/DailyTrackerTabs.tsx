'use client';

import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {DailySchedule} from './DailySchedule';
import {WeeklyTimetable} from './WeeklyTimetable';
import {useView, ViewSwitcher} from './ViewContext';
import {AiScheduler} from './AiScheduler';

export function DailyTrackerTabs() {
  const {view} = useView();

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
          <ViewSwitcher />
        </div>
      </div>
      <Tabs defaultValue="daily" className="flex-grow flex flex-col">
        <TabsList className="w-full sm:w-auto self-start">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="ai-scheduler">AI Smart Scheduler</TabsTrigger>
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
      </Tabs>
    </>
  );
}
