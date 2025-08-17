
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import type { JobApplication, KanbanColumnId } from '@/lib/types';
import { MoreHorizontal, MoveRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { handleUpdateJobStage } from './actions';
import { useToast } from '@/hooks/use-toast';

const COLUMN_ORDER: KanbanColumnId[] = [
  'Wishlist',
  'Applying',
  'Interview',
  'Offer',
  'Rejected',
];

interface JobCardProps {
  job: JobApplication;
  onStageChange: (jobId: string, newStage: KanbanColumnId) => void;
}

function JobCard({ job, onStageChange }: JobCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 rounded-md">
            <AvatarImage src={job.logoUrl} alt={`${job.company} logo`} />
            <AvatarFallback className="rounded-md">
              {job.company.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{job.title}</p>
            <p className="text-xs text-muted-foreground">{job.company}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 text-muted-foreground hover:text-foreground">
              <MoreHorizontal size={20} />
              <span className="sr-only">Job Options</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to...</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMN_ORDER.filter((stage) => stage !== job.stage).map(
              (stage) => (
                <DropdownMenuItem
                  key={stage}
                  onClick={() => onStageChange(job.id, stage)}
                >
                  <MoveRight className="mr-2 h-4 w-4" />
                  {stage}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

interface MobileJobTrackerProps {
  initialData: JobApplication[];
  onJobUpdated: () => void;
}

export function MobileJobTracker({
  initialData,
  onJobUpdated,
}: MobileJobTrackerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const groupedJobs = useMemo(() => {
    const map = new Map<KanbanColumnId, JobApplication[]>();
    COLUMN_ORDER.forEach((stage) => {
      map.set(
        stage,
        initialData.filter((j) => j.stage === stage)
      );
    });
    return map;
  }, [initialData]);

  const handleStageChange = async (jobId: string, newStage: KanbanColumnId) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in.',
        variant: 'destructive',
      });
      return;
    }
    const result = await handleUpdateJobStage(jobId, newStage, user.uid);
    if (result.error) {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Job stage updated.' });
      onJobUpdated();
    }
  };

  const defaultAccordionValues = useMemo(
    () => COLUMN_ORDER.filter((stage) => (groupedJobs.get(stage)?.length ?? 0) > 0),
    [groupedJobs]
  );

  return (
    <div className="space-y-4 pb-4">
      <Accordion
        type="multiple"
        defaultValue={defaultAccordionValues}
        className="w-full space-y-4"
      >
        {COLUMN_ORDER.map((stage) => {
          const jobs = groupedJobs.get(stage) || [];
          if (jobs.length === 0) return null;
          return (
            <AccordionItem value={stage} key={stage} className="border-none">
              <Card>
                <AccordionTrigger className="p-4 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{stage}</h3>
                    <Badge variant="secondary">{jobs.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onStageChange={handleStageChange}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
