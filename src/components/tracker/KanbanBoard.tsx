import type { KanbanColumnData } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  data: KanbanColumnData[];
}

export function KanbanBoard({ data }: KanbanBoardProps) {
  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-6 p-1 pb-4">
        {data.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </div>
  );
}
