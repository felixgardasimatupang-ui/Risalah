"use client";

import { useMeetings } from "@/hooks/use-meetings";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/shared/glass-panel";
import { FileText, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TranscriptsPage() {
  const { meetings, isLoading } = useMeetings();
  const [search, setSearch] = useState("");

  const completedMeetings = meetings.filter((m) => m.status === "completed");
  const filtered = search
    ? completedMeetings.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase()),
      )
    : completedMeetings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Transcripts</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Telusuri transkrip rapat</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <Input
          placeholder="Cari transkrip..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassPanel className="p-8 text-center">
          <div className="flex flex-col items-center gap-3 py-12">
            <FileText className="h-12 w-12 text-on-surface-variant/40" />
            <h3 className="font-headline text-headline-md text-on-surface">
              {search ? "Transkrip Tidak Ditemukan" : "Belum Ada Transkrip"}
            </h3>
            <p className="max-w-md text-body-sm text-on-surface-variant">
              {search
                ? "Coba gunakan kata kunci lain untuk mencari transkrip."
                : "Transkrip rapat akan muncul di sini setelah rapat selesai diproses."}
            </p>
          </div>
        </GlassPanel>
      ) : (
        <div className="space-y-2">
          {filtered.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/transcripts/${meeting.id}`}
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
                <Badge variant="secondary">{meeting.duration} menit</Badge>
                <ChevronRight className="h-4 w-4 text-on-surface-variant" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
