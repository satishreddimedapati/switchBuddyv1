import type { KanbanColumnData } from "@/lib/types";
import { JobApplicationCard } from "./JobApplicationCard";
import { ScrollArea } from "../ui/scroll-area";

interface KanbanColumnProps {
  column: KanbanColumnData;
}

const columnColors: { [key: string]: string } = {
  Wishlist: "border-t-gray-400",
  Applying: "border-t-blue-400",
  Interview: "border-t-yellow-400",
  Offer: "border-t-green-400",
  Rejected: "border-t-red-400",
};

export function KanbanColumn({ column }: KanbanColumnProps) {
  const borderColor = columnColors[column.id] || "border-t-gray-200";

  return (
    <div className={`flex flex-col w-72 shrink-0 border-t-4 ${borderColor} rounded-t-lg bg-card`}>
      <div className="p-4">
        <h3 className="font-headline text-lg font-semibold flex items-center justify-between">
          {column.title}
          <span className="text-sm font-medium bg-muted-foreground/10 text-muted-foreground rounded-full px-2 py-0.5">
            {column.jobs.length}
          </span>
        </h3>
      </div>
      <ScrollArea className="h-full">
         <div className="px-4 pb-4">
            {column.jobs.map((job) => (
                <JobApplicationCard key={job.id} job={job} />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
