"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOverviewStats } from "@/hooks/use-analytics";
import { Calendar, Clock, FileText, ListChecks } from "lucide-react";

const statCards = [
  { label: "Total Meetings", key: "totalMeetings", icon: Calendar, color: "text-blue-500" },
  { label: "Hours Transcribed", key: "totalHours", icon: Clock, color: "text-emerald-500", suffix: " jam" },
  { label: "Pending Summaries", key: "pendingSummaries", icon: FileText, color: "text-amber-500" },
  { label: "Open Action Items", key: "actionItemsOpen", icon: ListChecks, color: "text-purple-500" },
];

export function WidgetStatCards() {
  const { data: stats, isLoading } = useOverviewStats();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">{stat.label}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-surface-container-high" />
            ) : (
              <div className="text-2xl font-bold text-on-surface">
                {stats?.[stat.key as keyof typeof stats] ?? "—"}
                {stat.suffix ?? ""}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
