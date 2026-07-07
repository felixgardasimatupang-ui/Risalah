"use client";

import { useDashboardStore } from "@/stores/dashboard-store";
import { DashboardEditor, WidgetStatCards, WidgetMeetingTrend, WidgetParticipantBars } from "@/components/dashboard";
import { WidgetWrapper } from "@/components/dashboard/widget-wrapper";

export default function OverviewPage() {
  const { widgets } = useDashboardStore();

  const visibleWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Overview</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Selamat datang di SEKNEG AI — platform kecerdasan rapat pemerintahan.
          </p>
        </div>
        <DashboardEditor />
      </div>

      {visibleWidgets.map((w) => (
        <WidgetWrapper key={w.id} title={w.title}>
          {w.id === "stat-cards" && <WidgetStatCards />}
          {w.id === "meeting-trend" && <WidgetMeetingTrend />}
          {w.id === "participant-bars" && <WidgetParticipantBars />}
          {w.id === "recent-meetings" && (
            <p className="text-body-sm text-on-surface-variant">Widget coming soon.</p>
          )}
          {w.id === "upcoming-meetings" && (
            <p className="text-body-sm text-on-surface-variant">Widget coming soon.</p>
          )}
          {w.id === "action-items" && (
            <p className="text-body-sm text-on-surface-variant">Widget coming soon.</p>
          )}
          {w.id === "ai-insights" && (
            <p className="text-body-sm text-on-surface-variant">Widget coming soon.</p>
          )}
        </WidgetWrapper>
      ))}
    </div>
  );
}
