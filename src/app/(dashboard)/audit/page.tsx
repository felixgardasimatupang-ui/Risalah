"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassPanel } from "@/components/shared/glass-panel";
import { mockAuditLogs } from "@/lib/mock-data";
import type { AuditLogEntry } from "@/types/meeting";
import { Shield, Search, Download, Filter, LogIn, FilePlus, FileEdit, DownloadCloud, UserPlus, CheckCircle, Settings, X, Eye, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const actionMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "auth.login": { label: "Login", icon: <LogIn className="h-3.5 w-3.5" />, color: "text-blue-500 bg-blue-500/10" },
  "auth.logout": { label: "Logout", icon: <LogOut className="h-3.5 w-3.5" />, color: "text-gray-500 bg-gray-500/10" },
  "meeting.create": { label: "Meeting Dibuat", icon: <FilePlus className="h-3.5 w-3.5" />, color: "text-emerald-500 bg-emerald-500/10" },
  "meeting.view": { label: "Meeting Dilihat", icon: <Eye className="h-3.5 w-3.5" />, color: "text-sky-500 bg-sky-500/10" },
  "transcript.edit": { label: "Transkrip Diedit", icon: <FileEdit className="h-3.5 w-3.5" />, color: "text-amber-500 bg-amber-500/10" },
  "export.create": { label: "Ekspor Dibuat", icon: <DownloadCloud className="h-3.5 w-3.5" />, color: "text-purple-500 bg-purple-500/10" },
  "member.invite": { label: "Anggota Diundang", icon: <UserPlus className="h-3.5 w-3.5" />, color: "text-indigo-500 bg-indigo-500/10" },
  "minutes.approve": { label: "Notulen Disetujui", icon: <CheckCircle className="h-3.5 w-3.5" />, color: "text-green-500 bg-green-500/10" },
  "settings.update": { label: "Pengaturan Diubah", icon: <Settings className="h-3.5 w-3.5" />, color: "text-orange-500 bg-orange-500/10" },
  "search.perform": { label: "Pencarian", icon: <Search className="h-3.5 w-3.5" />, color: "text-cyan-500 bg-cyan-500/10" },
};

const uniqueActions = Object.keys(actionMeta);

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterActor, setFilterActor] = useState("all");

  const actors = useMemo(() => [...new Set(mockAuditLogs.map((l) => l.actorEmail))], []);

  const filtered = useMemo(() => {
    return mockAuditLogs.filter((entry) => {
      if (filterAction !== "all" && entry.action !== filterAction) return false;
      if (filterActor !== "all" && entry.actorEmail !== filterActor) return false;
      if (search) {
        const q = search.toLowerCase();
        return entry.action.toLowerCase().includes(q) || entry.actorEmail.toLowerCase().includes(q) || entry.actorName.toLowerCase().includes(q) || (entry.resourceId?.toLowerCase().includes(q));
      }
      return true;
    });
  }, [search, filterAction, filterActor]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">Audit Log</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Riwayat aktivitas dan perubahan sistem</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Ekspor CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <Input
                placeholder="Cari aktivitas, email, atau resource..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-container-low pl-9"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-44 bg-surface-container-low">
                <Filter className="mr-2 h-4 w-4 text-on-surface-variant" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aksi</SelectItem>
                {uniqueActions.map((a) => (
                  <SelectItem key={a} value={a}>{actionMeta[a].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterActor} onValueChange={setFilterActor}>
              <SelectTrigger className="w-48 bg-surface-container-low">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Aktor</SelectItem>
                {actors.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <GlassPanel>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
            <Shield className="mb-2 h-12 w-12 opacity-30" />
            <p className="text-body-md">Tidak ada aktivitas yang cocok</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-low">
            {filtered.map((entry) => (
              <AuditRow key={entry.id} entry={entry} formatDate={formatDate} />
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function AuditRow({ entry, formatDate }: { entry: AuditLogEntry; formatDate: (iso: string) => string }) {
  const meta = actionMeta[entry.action] || { label: entry.action, icon: <Shield className="h-3.5 w-3.5" />, color: "text-gray-500 bg-gray-500/10" };

  return (
    <div className="flex items-start gap-4 px-4 py-3.5 transition-colors hover:bg-surface-container-low/50">
      <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-full shrink-0", meta.color)}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface">{entry.actorName}</span>
          <span className="text-label-xs text-on-surface-variant">({entry.actorEmail})</span>
        </div>
        <p className="text-sm text-on-surface-variant">
          {meta.label}
          {entry.resourceId && (
            <span className="ml-1.5 rounded-md bg-surface-container-high px-1.5 py-0.5 font-mono text-label-xs text-on-surface-variant">{entry.resourceId}</span>
          )}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-label-xs text-on-surface-variant">{formatDate(entry.createdAt)}</p>
        {entry.ip && <p className="mt-0.5 font-mono text-label-xs text-on-surface-variant/60">{entry.ip}</p>}
      </div>
    </div>
  );
}
