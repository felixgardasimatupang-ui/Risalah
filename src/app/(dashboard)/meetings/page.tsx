"use client";

import { useMeetings } from "@/hooks/use-meetings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Calendar, Plus, Clock, MapPin } from "lucide-react";
import Link from "next/link";

const statusBadge: Record<string, { label: string; class: string }> = {
  scheduled: { label: "Terjadwal", class: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "Berlangsung", class: "bg-amber-100 text-amber-800 border-amber-200" },
  completed: { label: "Selesai", class: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Dibatalkan", class: "bg-red-100 text-red-800 border-red-200" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MeetingsPage() {
  const { meetings, isLoading } = useMeetings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Meetings</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Lihat dan kelola semua rapat</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Rapat Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <div className="flex flex-col items-center gap-3 py-12">
            <Calendar className="h-12 w-12 text-on-surface-variant/40" />
            <h3 className="font-headline text-headline-md text-on-surface">Belum Ada Rapat</h3>
            <p className="max-w-md text-body-sm text-on-surface-variant">
              Daftar rapat akan muncul di sini setelah Anda membuat atau mengunggah rekaman rapat pertama.
            </p>
          </div>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const badge = statusBadge[meeting.status] ?? statusBadge.scheduled;
            return (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                <GlassPanel className="group cursor-pointer p-5 transition-all hover:bg-white/80">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-headline text-headline-md text-on-surface">
                          {meeting.title}
                        </h3>
                        <Badge className={badge.class}>{badge.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(meeting.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {meeting.duration} menit
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {meeting.location}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        {meeting.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-surface-container-low px-2 py-0.5 text-label-sm text-on-surface-variant"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
