"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { TrendingUp } from "lucide-react";

export function WidgetMeetingTrend() {
  const { data: analytics, isLoading } = useAnalytics();

  return (
    <>
      <h3 className="mb-4 flex items-center gap-2 font-headline text-headline-md text-on-surface">
        <TrendingUp className="h-5 w-5 text-primary" />
        Tren Rapat per Bulan
      </h3>
      {isLoading ? (
        <div className="h-40 animate-pulse rounded bg-surface-container-high" />
      ) : (
        <div className="flex items-end gap-3" style={{ height: 160 }}>
          {analytics?.monthlyTrend?.map((item: { month: string; meetings: number }) => (
            <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-label-sm text-on-surface-variant">{item.meetings}</span>
              <div
                className="w-full rounded-t-md bg-primary transition-all"
                style={{ height: `${(item.meetings / 3) * 120}px` }}
              />
              <span className="text-label-sm text-on-surface-variant">{item.month}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
