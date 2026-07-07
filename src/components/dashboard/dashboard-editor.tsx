"use client";

import { useDashboardStore } from "@/stores/dashboard-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";

export function DashboardEditor() {
  const { widgets, toggleWidget, reorderWidgets, resetWidgets } = useDashboardStore();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Customize
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>Customize Dashboard</SheetTitle>
          <SheetDescription>Show, hide, and reorder dashboard widgets.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {widgets
            .sort((a, b) => a.order - b.order)
            .map((widget, index) => (
              <div
                key={widget.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <div
                  draggable
                  onDragStart={() => {}}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const targetIndex = widgets.findIndex((w) => w.id === widget.id);
                    if (targetIndex !== index) reorderWidgets(index, targetIndex);
                  }}
                  className="cursor-grab text-muted-foreground hover:text-foreground"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{widget.title}</p>
                  <p className="text-xs text-muted-foreground">{widget.description}</p>
                </div>
                <button
                  onClick={() => toggleWidget(widget.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                >
                  {widget.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            ))}
        </div>
        <div className="mt-6">
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={resetWidgets}>
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
