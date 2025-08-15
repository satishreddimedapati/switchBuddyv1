'use client'

import type { JobApplication, KanbanColumnId } from "@/lib/types";
import { KanbanColumn } from "./KanbanColumn";
import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { JobApplicationCard } from "./JobApplicationCard";
import { createPortal } from "react-dom";
import { handleUpdateJobStage } from "./actions";
import { useAuth } from "@/lib/auth";

interface KanbanBoardProps {
  initialData: JobApplication[];
  onBoardChange: (data: JobApplication[]) => void;
}

const COLUMN_ORDER: KanbanColumnId[] = ['Wishlist', 'Applying', 'Interview', 'Offer', 'Rejected'];

export function KanbanBoard({ initialData, onBoardChange }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Map<KanbanColumnId, JobApplication>>(new Map());
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null);
  const { user } = useAuth();

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

    // Sort jobs within each column if needed (e.g., by date)
    newColumns.forEach((jobs, columnId) => {
        newColumns.set(columnId, jobs.sort((a, b) => initialData.indexOf(a) - initialData.indexOf(b)));
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
    if (!user) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeColumnKey = active.data.current?.job.stage as KanbanColumnId;
    let overColumnKey = over.data.current?.job?.stage as KanbanColumnId;
    if (over.data.current?.type === 'Column') {
        overColumnKey = over.id as KanbanColumnId;
    }
    
    if (!activeColumnKey || !overColumnKey || activeColumnKey === overColumnKey) {
        return;
    }

    const jobToMove = initialData.find(j => j.id === activeId);
    if (!jobToMove) return;

    // Optimistically update UI
    const updatedJobs = initialData.map(job => 
        job.id === activeId ? { ...job, stage: overColumnKey } : job
    );
    onBoardChange(updatedJobs);
    

    // Update database
    await handleUpdateJobStage(activeId.toString(), overColumnKey);
  }

  const columnIds = Array.from(columns.keys());

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-6 p-1 pb-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            {columnIds.map((columnId) => (
              <KanbanColumn
                key={columnId}
                columnId={columnId}
                jobs={columns.get(columnId) || []}
              />
            ))}
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
