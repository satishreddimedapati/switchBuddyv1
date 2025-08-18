
"use client"

import { AddJobApplicationForm } from "@/components/tracker/AddJobApplicationForm";
import { KanbanBoard } from "@/components/tracker/KanbanBoard";
import { getJobApplications } from "@/services/job-applications";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, useCallback } from "react";
import type { JobApplication } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileJobTracker } from "@/components/tracker/MobileJobTracker";

export function JobTracker() {
  const { user } = useAuth();
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

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

  const handleJobUpdate = () => {
    fetchJobs();
  }

  return (
      <div className="flex flex-col h-full pt-6">
         <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
            <AddJobApplicationForm onApplicationAdded={fetchJobs} />
        </div>
        <div className="mt-6 flex-grow overflow-hidden">
          {loading ? (
             <div className="flex gap-6 p-1 pb-4">
                <Skeleton className="h-[500px] w-full sm:w-72" />
                <Skeleton className="h-[500px] w-full sm:w-72 hidden sm:block" />
                <Skeleton className="h-[500px] w-full sm:w-72 hidden lg:block" />
                <Skeleton className="h-[500px] w-full sm:w-72 hidden lg:block" />
             </div>
          ) : (
            isMobile ? (
              <MobileJobTracker initialData={jobApplications} onJobUpdated={handleJobUpdate} />
            ) : (
              <KanbanBoard initialData={jobApplications} onBoardChange={setJobApplications} />
            )
          )}
        </div>
      </div>
  );
}

