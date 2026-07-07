"use client";

import { cn } from "@/lib/utils";

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div className={cn("bg-white/70 backdrop-blur-[12px] rounded-12 border border-white/20 shadow-sm", className)}>
      {children}
    </div>
  );
}
