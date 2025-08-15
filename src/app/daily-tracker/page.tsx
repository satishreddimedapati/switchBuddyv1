import { DailyTrackerTabs } from "./DailyTrackerTabs";
import { ViewProvider } from "./ViewContext";

export default function DailyTrackerPage() {
  return (
    <ViewProvider>
      <div className="flex flex-col gap-8 h-full">
        <DailyTrackerTabs />
      </div>
    </ViewProvider>
  );
}
