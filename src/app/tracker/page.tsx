"use client"

import { AddJobApplicationForm } from "@/components/tracker/AddJobApplicationForm";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";
import { getJobApplications } from "@/services/job-applications";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import type { JobApplication } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackerPage() {
  const { user } = useAuth();
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      if (user) {
        setLoading(true);
        const jobs = await getJobApplications();
        setJobApplications(jobs);
        setLoading(false);
      }
    }
    fetchJobs();
  }, [user]);

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
            <AddJobApplicationForm onApplicationAdded={async () => {
              const jobs = await getJobApplications();
              setJobApplications(jobs);
            }} />
        </div>
        <div className="mt-6 flex-grow">
          {loading ? (
             <div className="flex gap-6 p-1 pb-4">
                <Skeleton className="h-[500px] w-72" />
                <Skeleton className="h-[500px] w-72" />
                <Skeleton className="h-[500px] w-72" />
                <Skeleton className="h-[500px] w-72" />
             </div>
          ) : (
            <KanbanBoard initialData={jobApplications} />
          )}
        </div>
      </div>
  );
}
