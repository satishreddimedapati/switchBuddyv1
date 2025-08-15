'use client'

import type { JobApplication, KanbanColumnData, KanbanColumnId } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { JobApplicationCard } from "./JobApplicationCard";
import { createPortal } from "react-dom";
import { handleUpdateJobStage } from "./actions";

interface KanbanBoardProps {
  initialData: JobApplication[];
}

const COLUMN_ORDER: KanbanColumnId[] = ['Wishlist', 'Applying', 'Interview', 'Offer', 'Rejected'];

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Map<KanbanColumnId, JobApplication[]>>(new Map());
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null);

  useEffect(() => {
    const newColumns = new Map<KanbanColumnId, JobApplication[]>();
    COLUMN_ORDER.forEach(columnId => {
      newColumns.set(columnId, []);
    });

    initialData.forEach(job => {
      const columnJobs = newColumns.get(job.stage) || [];
      columnJobs.push(job);
      newColumns.set(job.stage, columnJobs);
    });

    setColumns(newColumns);
  }, [initialData]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Job") {
      setActiveJob(event.active.data.current.job);
      return;
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColumnKey = active.data.current?.job.stage as KanbanColumnId;
    const overColumnKey = (over.data.current?.job?.stage || over.id) as KanbanColumnId;
    
    if (!activeColumnKey || !overColumnKey || activeColumnKey === overColumnKey) {
        return;
    }

    setColumns(prev => {
        const newColumns = new Map(prev);
        const activeColumn = Array.from(newColumns.get(activeColumnKey) || []);
        const overColumn = Array.from(newColumns.get(overColumnKey) || []);

        const activeIndex = activeColumn.findIndex(job => job.id === activeId);
        const jobToMove = activeColumn[activeIndex];

        // Optimistically update UI
        newColumns.set(activeColumnKey, activeColumn.filter(job => job.id !== activeId));
        newColumns.set(overColumnKey, [...overColumn, {...jobToMove, stage: overColumnKey}]);

        return newColumns;
    });

    // Update database
    await handleUpdateJobStage(activeId.toString(), overColumnKey);
  }

  const columnIds = Array.from(columns.keys());

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-6 p-1 pb-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <SortableContext items={columnIds}>
            {columnIds.map((columnId) => (
              <KanbanColumn
                key={columnId}
                columnId={columnId}
                jobs={columns.get(columnId) || []}
              />
            ))}
            </SortableContext>
            {createPortal(
            <DragOverlay>
              {activeJob && (
                <JobApplicationCard
                  job={activeJob}
                />
              )}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>
    </div>
  );
}
