'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailySchedule } from "./DailySchedule";
import { WeeklyTimetable } from "./WeeklyTimetable";

export function DailyTrackerTabs() {
  return (
    <Tabs defaultValue="daily" className="flex-grow flex flex-col">
      <TabsList className="w-full sm:w-auto self-start">
        <TabsTrigger value="daily">Daily Schedule</TabsTrigger>
        <TabsTrigger value="weekly">Weekly Timetable</TabsTrigger>
      </TabsList>
      <TabsContent value="daily" className="flex-grow mt-4">
        <DailySchedule />
      </TabsContent>
      <TabsContent value="weekly" className="flex-grow mt-4">
        <WeeklyTimetable />
      </TabsContent>
    </Tabs>
  );
}
