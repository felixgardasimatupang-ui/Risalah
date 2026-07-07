"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, RotateCcw, Calendar, Clock, MapPin, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

const deletedMeetings = [
  { id: "d1", title: "Rapat Koordinasi APBD 2024", date: "2024-11-20", location: "Ruangan Rapat Utama", duration: 90, deletedAt: "2025-03-01", status: "completed" },
  { id: "d2", title: "Evaluasi Program Kerja Tahunan", date: "2024-12-05", location: "Aula Lt. 3", duration: 120, deletedAt: "2025-02-28", status: "completed" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function TrashPage() {
  const [items, setItems] = useState(deletedMeetings);

  const handleRestore = (id: string) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  const handlePermanentDelete = (id: string) => {
    setItems((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-headline text-headline-lg text-on-surface">
          <Trash2 className="h-6 w-6 text-on-surface-variant" />
          Trash
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Deleted meetings are moved here. Items are permanently deleted after 30 days.
        </p>
      </div>

      {items.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
          <Trash2 className="mb-3 h-12 w-12 text-on-surface-variant/40" />
          <p className="text-headline-sm text-on-surface-variant">Trash is empty</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Deleted meetings will appear here for 30 days before being permanently removed.
          </p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-body-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Items in trash for more than 30 days will be permanently deleted.
          </div>
          {items.map((meeting) => (
            <GlassPanel key={meeting.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-headline text-headline-md text-on-surface">{meeting.title}</h3>
                    <Badge variant="outline" className="capitalize">{meeting.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(meeting.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{meeting.duration} menit</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{meeting.location}</span>
                  </div>
                  <p className="text-label-sm text-on-surface-variant">
                    Deleted {formatDate(meeting.deletedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleRestore(meeting.id)} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handlePermanentDelete(meeting.id)} className="gap-1.5 text-error hover:text-error">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
