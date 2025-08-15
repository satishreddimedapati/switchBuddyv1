'use client'

import type { JobApplication, KanbanColumnData, KanbanColumnId } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { useEffect, useState } from "react";

interface KanbanBoardProps {
  initialData: JobApplication[];
}

const COLUMN_ORDER: KanbanColumnId[] = ['Wishlist', 'Applying', 'Interview', 'Offer', 'Rejected'];

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [columns, setColumns] = useState<KanbanColumnData[]>([]);

  useEffect(() => {
    const newColumns: KanbanColumnData[] = COLUMN_ORDER.map(columnId => ({
      id: columnId,
      title: columnId,
      jobs: [],
    }));

    initialData.forEach(job => {
      const column = newColumns.find(c => c.id === job.stage);
      if (column) {
        column.jobs.push(job);
      }
    });

    setColumns(newColumns);
  }, [initialData]);

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-6 p-1 pb-4">
        {columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </div>
  );
}
