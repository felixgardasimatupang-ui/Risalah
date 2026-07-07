"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/shared/glass-panel";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, CheckCircle2, Clock, Users, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { CalendarEvent } from "@/types/meeting";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState("Juli 2026");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", duration: "60", attendees: "" });

  useEffect(() => {
    api.getCalendarEvents().then(setEvents);
  }, []);

  const handleRefreshCw = async (id: string) => {
    await api.syncCalendarEvent(id);
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, synced: true } : e)));
  };

  const handleCreate = async () => {
    if (!form.title || !form.date) return;
    await api.createCalendarEvent({
      title: form.title,
      date: new Date(form.date).toISOString(),
      duration: parseInt(form.duration),
      attendees: form.attendees.split(",").map((a) => a.trim()).filter(Boolean),
    });
    const updated = await api.getCalendarEvents();
    setEvents(updated);
    setShowCreate(false);
    setForm({ title: "", date: "", duration: "60", attendees: "" });
  };

  const today = events.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const upcoming = events.filter((e) => new Date(e.date) > new Date()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Calendar</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Integrasi Google Calendar dan jadwal rapat</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Jadwal
        </Button>
      </div>

      {showCreate && (
        <GlassPanel className="p-5 space-y-4">
          <h3 className="font-headline text-headline-sm">Buat Jadwal Baru</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-label-sm text-on-surface-variant">Judul Rapat</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Masukkan judul rapat" className="bg-surface-container-low" />
            </div>
            <div className="space-y-2">
              <label className="text-label-sm text-on-surface-variant">Tanggal & Waktu</label>
              <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-surface-container-low" />
            </div>
            <div className="space-y-2">
              <label className="text-label-sm text-on-surface-variant">Durasi (menit)</label>
              <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="bg-surface-container-low" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-label-sm text-on-surface-variant">Peserta (pisahkan dengan koma)</label>
              <Input value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} placeholder="email1@sekneg.go.id, email2@sekneg.go.id" className="bg-surface-container-low" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Buat Jadwal</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Batal</Button>
          </div>
        </GlassPanel>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-headline-md">{currentMonth}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-label-sm text-on-surface-variant mb-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }, (_, i) => {
                  const dateStr = `2026-07-${String(i + 1).padStart(2, "0")}`;
                  const dayEvents = events.filter((e) => e.date.startsWith(dateStr));
                  const isToday = new Date().toISOString().startsWith(dateStr);
                  return (
                    <button
                      key={i}
                      className={cn(
                        "flex flex-col items-center rounded-lg p-1.5 text-sm transition-colors hover:bg-surface-container-high",
                        isToday && "bg-primary-container text-on-primary-container",
                      )}
                    >
                      <span className={cn("font-medium", isToday && "text-primary")}>{i + 1}</span>
                      {dayEvents.length > 0 && (
                        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Semua Jadwal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.length === 0 && (
                  <p className="text-body-md text-on-surface-variant text-center py-8">Belum ada jadwal</p>
                )}
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        event.synced ? "bg-primary-container text-primary" : "bg-surface-container-high text-on-surface-variant",
                      )}>
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">{event.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(event.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span>{event.duration} menit</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendees.length} peserta
                          </span>
                        </div>
                        {event.meetingId && (
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-container/30 px-2 py-0.5 text-label-xs text-primary">
                            <Link2 className="h-3 w-3" />
                            Terkait rapat
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.synced ? (
                        <span className="flex items-center gap-1 text-label-xs text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Tersinkron
                        </span>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleRefreshCw(event.id)} className="text-on-surface-variant">
                          <RefreshCw className="mr-1 h-3.5 w-3.5" />
                          RefreshCw
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              {today.length === 0 ? (
                <p className="text-body-md text-on-surface-variant text-center py-6">Tidak ada rapat hari ini</p>
              ) : (
                <div className="space-y-3">
                  {today.map((event) => (
                    <div key={event.id} className="rounded-lg bg-surface-container-low p-3">
                      <p className="text-sm font-medium text-on-surface">{event.title}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {new Date(event.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        {" — "}
                        {event.duration} menit
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Akan Datang</CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-body-md text-on-surface-variant text-center py-6">Tidak ada jadwal mendatang</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((event) => (
                    <div key={event.id} className="flex items-center gap-3">
                      <div className="flex w-10 flex-col items-center rounded-lg bg-primary-container py-1.5 text-primary">
                        <span className="text-label-xs leading-none">{new Date(event.date).toLocaleDateString("id-ID", { month: "short" })}</span>
                        <span className="text-sm font-bold leading-none mt-0.5">{new Date(event.date).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{event.title}</p>
                        <p className="text-xs text-on-surface-variant">{event.duration} menit</p>
                      </div>
                      {!event.synced && (
                        <Button variant="ghost" size="icon" onClick={() => handleRefreshCw(event.id)} className="h-7 w-7 shrink-0">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-headline-md">Integrasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-surface-container p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">Google Calendar</p>
                    <p className="text-xs text-on-surface-variant">admin@sekneg.go.id</p>
                  </div>
                </div>
                <span className="rounded-full bg-success-container px-2 py-0.5 text-label-xs text-success">Terhubung</span>
              </div>
              <Button variant="outline" className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sinkronkan Semua
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
