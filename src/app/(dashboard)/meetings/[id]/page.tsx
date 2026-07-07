"use client";

import { use } from "react";
import { useMeeting } from "@/hooks/use-meetings";
import { useMeetingStore } from "@/stores/meeting-store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Calendar, ArrowLeft } from "lucide-react";
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

function msToTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { meeting, isLoading } = useMeeting(id);
  const transcript = useMeetingStore((s) => s.selectedTranscript);
  const summary = useMeetingStore((s) => s.selectedSummary);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-container-high" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container-high" />
          ))}
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/meetings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <GlassPanel className="p-8 text-center">
          <p className="text-body-md text-on-surface-variant">Rapat tidak ditemukan.</p>
        </GlassPanel>
      </div>
    );
  }

  const badge = statusBadge[meeting.status] ?? statusBadge.scheduled;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/meetings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-headline-lg text-on-surface">{meeting.title}</h1>
            <Badge className={badge.class}>{badge.label}</Badge>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">{formatDate(meeting.date)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Durasi</CardTitle>
            <Clock className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-on-surface">
              {Math.floor(meeting.duration / 60)} jam {meeting.duration % 60} menit
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Lokasi</CardTitle>
            <MapPin className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-on-surface">{meeting.location}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Kategori</CardTitle>
            <Calendar className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {meeting.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-surface-container-low px-2 py-0.5 text-label-sm text-on-surface-variant"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transcript">
        <TabsList>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transcript">
          {transcript?.lines?.length ? (
            <GlassPanel className="divide-y divide-white/10">
              {transcript.lines.map((line) => (
                <div key={line.id} className="flex gap-4 p-4">
                  <div className="w-16 shrink-0 pt-0.5">
                    <span className="text-label-sm text-on-surface-variant/60">
                      {msToTime(line.timestampMs)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <Badge variant="secondary" className="text-xs">
                      {line.speakerName}
                    </Badge>
                    <p className="text-body-sm text-on-surface leading-relaxed">{line.text}</p>
                  </div>
                </div>
              ))}
            </GlassPanel>
          ) : (
            <GlassPanel className="p-6">
              <p className="text-body-sm text-on-surface-variant">
                Transkrip rapat akan ditampilkan di sini setelah selesai diproses.
              </p>
            </GlassPanel>
          )}
        </TabsContent>

        <TabsContent value="summary">
          {summary?.keyPoints?.length ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-headline-md">
                    Key Points
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.keyPoints.map((kp) => (
                    <div key={kp.id} className="flex gap-3 rounded-lg bg-surface-container-low p-3">
                      <Badge variant="outline" className="shrink-0 self-start text-xs">
                        {kp.category}
                      </Badge>
                      <p className="text-body-sm text-on-surface">{kp.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-headline-md">
                    Action Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.actionItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-4 rounded-lg bg-surface-container-low p-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-body-sm text-on-surface">{item.description}</p>
                        <p className="text-label-sm text-on-surface-variant">Due {item.dueDate}</p>
                      </div>
                      <Badge
                        className={
                          item.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : item.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                        }
                      >
                        {item.status === "completed" ? "Selesai" : item.status === "in_progress" ? "Proses" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-headline-md">
                    Decisions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.decisions.map((d) => (
                    <div key={d.id} className="flex gap-3 rounded-lg bg-surface-container-low p-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-label-sm text-white">
                        {d.id}
                      </span>
                      <p className="text-body-sm text-on-surface">{d.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <GlassPanel className="p-6">
              <p className="text-body-sm text-on-surface-variant">
                Ringkasan AI akan tersedia setelah rapat selesai ditranskrip.
              </p>
            </GlassPanel>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <GlassPanel className="p-6">
            <p className="text-body-sm text-on-surface-variant">
              Analitik rapat akan muncul setelah data tersedia.
            </p>
          </GlassPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
