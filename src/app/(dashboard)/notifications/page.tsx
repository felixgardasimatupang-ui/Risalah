"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/shared/glass-panel";
import { CheckCheck, Bell, FileText, Sparkles, CalendarClock, AtSign, CalendarDays } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "new_meeting" | "transcript_ready" | "summary_ready" | "action_item_due" | "mention";
  title: string;
  message: string;
  meetingId?: string;
  read: boolean;
  createdAt: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "transcript_ready",
    title: "Transkrip Siap",
    message: "Transkrip rapat 'Rapat Koordinasi Evaluasi Program Kerja Triwulan II' sudah selesai diproses.",
    meetingId: "M-2026-001",
    read: false,
    createdAt: "2026-06-12T14:30:00",
  },
  {
    id: "n2",
    type: "summary_ready",
    title: "Ringkasan Siap",
    message: "Ringkasan rapat 'Rapat Koordinasi Evaluasi Program Kerja Triwulan II' telah tersedia.",
    meetingId: "M-2026-001",
    read: false,
    createdAt: "2026-06-12T15:00:00",
  },
  {
    id: "n3",
    type: "action_item_due",
    title: "Tenggat Tugas",
    message: "Tugas 'Menyelesaikan proses lelang item anggaran yang tersisa' jatuh tempo dalam 3 hari.",
    read: false,
    createdAt: "2026-06-13T08:00:00",
  },
  {
    id: "n4",
    type: "new_meeting",
    title: "Rapat Baru Dijadwalkan",
    message: "Rapat 'Sosialisasi Sistem Informasi Baru' dijadwalkan pada 20 Juni 2026 pukul 08:30.",
    meetingId: "M-2026-003",
    read: true,
    createdAt: "2026-06-10T10:00:00",
  },
  {
    id: "n5",
    type: "mention",
    title: "Anda disebut dalam rapat",
    message: "Dr. Andi Pratama menyebut nama Anda dalam rapat 'Rapat Tim Anggaran dan Perencanaan'.",
    meetingId: "M-2026-004",
    read: true,
    createdAt: "2026-06-10T14:00:00",
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  transcript_ready: <FileText className="h-5 w-5" />,
  summary_ready: <Sparkles className="h-5 w-5" />,
  action_item_due: <CalendarClock className="h-5 w-5" />,
  new_meeting: <CalendarDays className="h-5 w-5" />,
  mention: <AtSign className="h-5 w-5" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return "Baru saja";
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

function groupByDate(items: NotificationItem[]): Record<string, NotificationItem[]> {
  const groups: Record<string, NotificationItem[]> = {};
  for (const item of items) {
    const d = new Date(item.createdAt);
    const key = d.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const groups = groupByDate(notifications);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Notifications</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">
            {unreadCount} notifikasi belum dibaca
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-16">
          <Bell className="mb-4 h-12 w-12 text-on-surface-variant" />
          <p className="text-body-lg text-on-surface-variant">Tidak ada notifikasi</p>
        </GlassPanel>
      ) : (
        Object.entries(groups).map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <p className="mb-3 text-label-sm text-on-surface-variant">{dateLabel}</p>
            <div className="space-y-2">
              {items.map((n) => (
                <Card
                  key={n.id}
                  className={cn(
                    "transition-colors hover:bg-surface-container-higher cursor-pointer",
                    !n.read && "border-l-4 border-l-primary bg-primary-container/10",
                  )}
                  onClick={() => markRead(n.id)}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        n.read ? "bg-surface-container text-on-surface-variant" : "bg-primary-container text-primary",
                      )}
                    >
                      {typeIcons[n.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-body-sm text-on-surface">{n.title}</p>
                        {!n.read && <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0 bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-body-sm text-on-surface-variant line-clamp-2">{n.message}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-label-xs text-on-surface-variant">{timeAgo(n.createdAt)}</span>
                        {n.meetingId && (
                          <Link
                            href={n.type === "transcript_ready" ? `/transcripts/${n.meetingId}` : `/meetings/${n.meetingId}`}
                            className="text-label-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Lihat Detail
                          </Link>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
