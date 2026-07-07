"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { Users } from "lucide-react";

export function WidgetParticipantBars() {
  const { data: analytics, isLoading } = useAnalytics();

  return (
    <>
      <h3 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
        <Users className="h-5 w-5 text-primary" />
        Partisipasi Rapat
      </h3>
      {isLoading ? (
        <div className="h-40 animate-pulse rounded bg-surface-container-high" />
      ) : (
        <div className="space-y-4">
          {analytics?.participantStats?.map((p: { name: string; meetings: number; speakingTime: number }) => (
            <div key={p.name} className="space-y-1">
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-on-surface">{p.name}</span>
                <span className="text-on-surface-variant">{p.meetings} rapat</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(p.speakingTime / 50) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
