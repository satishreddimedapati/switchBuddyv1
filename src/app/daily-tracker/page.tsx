import { DailyTrackerTabs } from "./DailyTrackerTabs";

export default function DailyTrackerPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">
          Daily Tracker
        </h1>
        <p className="text-muted-foreground">
          Track your daily activities and manage your weekly schedule.
        </p>
      </div>
      <DailyTrackerTabs />
    </div>
  );
}
