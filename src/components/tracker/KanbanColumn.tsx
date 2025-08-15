'use client'

import type { JobApplication, KanbanColumnId } from "@/lib/types";
import { JobApplicationCard } from "./JobApplicationCard";
import { ScrollArea } from "../ui/scroll-area";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useMemo } from "react";

interface KanbanColumnProps {
  columnId: KanbanColumnId;
  jobs: JobApplication[];
}

const columnColors: { [key: string]: string } = {
  Wishlist: "border-t-gray-400",
  Applying: "border-t-blue-400",
  Interview: "border-t-yellow-400",
  Offer: "border-t-green-400",
  Rejected: "border-t-red-400",
};

export function KanbanColumn({ columnId, jobs }: KanbanColumnProps) {
  const jobIds = useMemo(() => jobs.map((job) => job.id), [jobs]);
  const borderColor = columnColors[columnId] || "border-t-gray-200";

  const { setNodeRef } = useSortable({
      id: columnId,
      data: {
          type: "Column",
          columnId
      }
  })

  return (
    <div ref={setNodeRef} className={`flex flex-col w-72 shrink-0 border-t-4 ${borderColor} rounded-t-lg bg-card`}>
      <div className="p-4">
        <h3 className="font-headline text-lg font-semibold flex items-center justify-between">
          {columnId}
          <span className="text-sm font-medium bg-muted-foreground/10 text-muted-foreground rounded-full px-2 py-0.5">
            {jobs.length}
          </span>
        </h3>
      </div>
      <ScrollArea className="h-full">
         <div className="px-4 pb-4">
            <SortableContext items={jobIds}>
                {jobs.map((job) => (
                    <JobApplicationCard key={job.id} job={job} />
                ))}
            </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
