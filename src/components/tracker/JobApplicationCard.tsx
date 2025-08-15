import type { JobApplication } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface JobApplicationCardProps {
  job: JobApplication;
}

export function JobApplicationCard({ job }: JobApplicationCardProps) {
  return (
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
  );
}
