"use client"

import { AddJobApplicationForm } from "@/components/tracker/AddJobApplicationForm";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";
import { getJobApplications } from "@/services/job-applications";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import type { JobApplication } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackerPage() {
  const { user } = useAuth();
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const jobs = await getJobApplications(user.uid);
        setJobApplications(jobs);
      } catch (error) {
        console.error("Failed to fetch job applications", error);
      } finally {
        setLoading(false);
      }
    } else {
      // If there's no user, don't attempt to fetch and clear existing data.
      setJobApplications([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
            <AddJobApplicationForm onApplicationAdded={fetchJobs} />
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
            <KanbanBoard initialData={jobApplications} onBoardChange={setJobApplications} />
          )}
        </div>
      </div>
  );
}
