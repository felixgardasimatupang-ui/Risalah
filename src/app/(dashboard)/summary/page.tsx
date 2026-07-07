"use client";

import { useMeetings } from "@/hooks/use-meetings";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SummaryPage() {
  const { meetings, isLoading } = useMeetings();
  const completedMeetings = meetings.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Summary</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Ringkasan rapat berbasis AI</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : completedMeetings.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <div className="flex flex-col items-center gap-3 py-12">
            <Sparkles className="h-12 w-12 text-on-surface-variant/40" />
            <h3 className="font-headline text-headline-md text-on-surface">Belum Ada Ringkasan</h3>
            <p className="max-w-md text-body-sm text-on-surface-variant">
              Ringkasan rapat akan dibuat secara otomatis oleh AI setelah rapat selesai ditranskrip.
            </p>
          </div>
        </GlassPanel>
      ) : (
        <div className="space-y-2">
          {completedMeetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/summary/${meeting.id}`}
              className="flex items-center justify-between rounded-xl bg-surface-container-low/50 p-4 transition-colors hover:bg-surface-container-low"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-body-md font-medium text-on-surface">{meeting.title}</h3>
                <p className="text-body-sm text-on-surface-variant">
                  {new Date(meeting.date).toLocaleDateString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Selesai
                </Badge>
                <ChevronRight className="h-4 w-4 text-on-surface-variant" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
