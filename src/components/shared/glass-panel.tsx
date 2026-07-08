"use client";

import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div className={cn("bg-white/70 dark:bg-surface-container/80 backdrop-blur-[12px] rounded-xl border border-white/20 dark:border-surface-container-high shadow-sm", className)}>
      {children}
    </div>
  );
}
