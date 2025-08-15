import { AppLayout } from "@/components/AppLayout";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";
import { kanbanData } from "@/lib/data";

export default function TrackerPage() {
  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-theme(spacing.20))]">
         <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Job Application Tracker
          </h1>
          <p className="text-muted-foreground">
            Manage your applications from wishlist to offer.
          </p>
        </div>
        <div className="mt-6 flex-grow">
           <KanbanBoard data={kanbanData} />
        </div>
      </div>
    </AppLayout>
  );
}
