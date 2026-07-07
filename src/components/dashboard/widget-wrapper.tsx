"use client";

import { useRef } from "react";
import { GripVertical } from "lucide-react";
import { GlassPanel } from "@/components/shared/glass-panel";

interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  isDragging?: boolean;
  dragHandleRef?: React.RefObject<HTMLDivElement | null>;
}

export function WidgetWrapper({
  title,
  children,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragHandleRef,
}: WidgetWrapperProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`${isDragging ? "opacity-50" : ""}`}
    >
      <GlassPanel className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div
            ref={dragHandleRef}
            className="cursor-grab rounded p-1 text-on-surface-variant hover:bg-surface-container-high active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <h3 className="font-headline text-headline-md text-on-surface">{title}</h3>
        </div>
        {children}
      </GlassPanel>
    </div>
  );
}
