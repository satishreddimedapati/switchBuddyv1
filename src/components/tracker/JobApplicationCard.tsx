'use client'
import type { JobApplication } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface JobApplicationCardProps {
  job: JobApplication;
}

export function JobApplicationCard({ job }: JobApplicationCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: job.id,
    data: {
      type: "Job",
      job,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="mb-4 opacity-50"
      >
        <Card className="border-2 border-primary">
          <CardContent className="p-3">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card className="mb-4 cursor-grab active:cursor-grabbing">
        <CardContent className="p-3">
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
        </CardContent>
        </Card>
    </div>
  );
}
