import { AddJobApplicationForm } from "@/components/tracker/AddJobApplicationForm";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";
import { getJobApplications } from "@/services/job-applications";

export default async function TrackerPage() {
  const jobApplications = await getJobApplications();

  return (
      <div className="flex flex-col h-[calc(100vh-theme(spacing.20))]">
         <div className="flex justify-between items-start">
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight">
                Job Application Tracker
              </h1>
              <p className="text-muted-foreground">
                Manage your applications from wishlist to offer.
              </p>
            </div>
            <AddJobApplicationForm />
        </div>
        <div className="mt-6 flex-grow">
           <KanbanBoard initialData={jobApplications} />
        </div>
      </div>
  );
}
