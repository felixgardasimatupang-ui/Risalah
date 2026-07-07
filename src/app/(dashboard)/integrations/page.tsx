"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GlassPanel } from "@/components/shared/glass-panel";
import { mockWebhooks, mockApiKeys, mockVideoConnections } from "@/lib/mock-data";
import type { Webhook, ApiKey, VideoConferenceConnection, VideoConferenceProvider } from "@/types/meeting";
import { Webhook as WebhookIcon, KeyRound, Plus, Trash2, Copy, Eye, EyeOff, Power, PowerOff, ExternalLink, AlertCircle, Video, VideoOff, Link2, Unlink, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type IntegrationsTab = "webhooks" | "api-keys" | "video-conference";

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<IntegrationsTab>("webhooks");

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Integrations</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Hubungkan Risalah dengan layanan eksternal</p>
      </div>

      <div className="flex gap-2 border-b border-surface-container pb-0.5">
          {[
          { id: "webhooks" as const, label: "Webhooks", icon: <WebhookIcon className="h-4 w-4" /> },
          { id: "api-keys" as const, label: "API Keys", icon: <KeyRound className="h-4 w-4" /> },
          { id: "video-conference" as const, label: "Video Conference", icon: <Video className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg border-b-2 border-transparent",
              activeTab === tab.id
                ? "text-primary border-primary bg-primary-container/10"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-higher",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "webhooks" && <WebhooksSection />}
      {activeTab === "api-keys" && <ApiKeysSection />}
      {activeTab === "video-conference" && <VideoConferenceSection />}
    </div>
  );
}

const availableEvents = [
  { value: "transcript_ready", label: "Transkrip Siap" },
  { value: "summary_ready", label: "Ringkasan Siap" },
  { value: "meeting.created", label: "Meeting Dibuat" },
  { value: "minutes.approved", label: "Notulen Disetujui" },
  { value: "action_item_due", label: "Tenggat Action Item" },
];

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const addWebhook = () => {
    if (!name || !url || selectedEvents.length === 0) return;
    const newWh: Webhook = {
      id: `wh-${Date.now()}`,
      name,
      url,
      events: selectedEvents,
      active: true,
      lastTriggeredAt: null,
      createdAt: new Date().toISOString(),
    };
    setWebhooks((prev) => [newWh, ...prev]);
    setName("");
    setUrl("");
    setSelectedEvents([]);
    setShowForm(false);
  };

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w)));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-on-surface-variant">{webhooks.length} webhook terdaftar</p>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Webhook
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-headline-md">Webhook Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-label-sm text-on-surface-variant">Nama</label>
              <Input placeholder="Contoh: Notifikasi Slack" value={name} onChange={(e) => setName(e.target.value)} className="bg-surface-container-low" />
            </div>
            <div className="space-y-2">
              <label className="text-label-sm text-on-surface-variant">Endpoint URL</label>
              <Input placeholder="https://hooks.example.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} className="bg-surface-container-low" />
            </div>
            <div className="space-y-2">
              <label className="text-label-sm text-on-surface-variant">Event</label>
              <div className="flex flex-wrap gap-2">
                {availableEvents.map((ev) => (
                  <button
                    key={ev.value}
                    onClick={() => toggleEvent(ev.value)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-label-sm border transition-colors",
                      selectedEvents.includes(ev.value)
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-container-low text-on-surface-variant border-surface-container-high hover:border-primary",
                    )}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addWebhook} disabled={!name || !url || selectedEvents.length === 0}>Simpan</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
          <WebhookIcon className="mb-2 h-12 w-12 opacity-30" />
          <p className="text-body-md">Belum ada webhook</p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <GlassPanel key={wh.id} className={cn("p-4", !wh.active && "opacity-60")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                    wh.active ? "bg-primary-container" : "bg-surface-container-high",
                  )}>
                    <WebhookIcon className={cn("h-5 w-5", wh.active ? "text-primary" : "text-on-surface-variant")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-on-surface">{wh.name}</h3>
                      <Badge variant={wh.active ? "default" : "secondary"} className="text-label-xs">
                        {wh.active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-label-xs text-on-surface-variant break-all">{wh.url}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {wh.events.map((ev) => {
                        const label = availableEvents.find((e) => e.value === ev)?.label ?? ev;
                        return <span key={ev} className="rounded-md bg-surface-container-high px-2 py-0.5 text-label-xs text-on-surface-variant">{label}</span>;
                      })}
                    </div>
                    {wh.lastTriggeredAt && (
                      <p className="mt-1.5 text-label-xs text-on-surface-variant">
                        Terakhir dipicu {new Date(wh.lastTriggeredAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => toggleWebhook(wh.id)}>
                    {wh.active ? <PowerOff className="h-4 w-4 text-warning" /> : <Power className="h-4 w-4 text-success" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-error" onClick={() => deleteWebhook(wh.id)}>
                    <Trash2 className="h-4 w-4" />
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

const providerInfo: Record<VideoConferenceProvider, { name: string; color: string; icon: string }> = {
  zoom: { name: "Zoom", color: "#2D8CFF", icon: "Z" },
  google_meet: { name: "Google Meet", color: "#EA4335", icon: "G" },
  teams: { name: "Microsoft Teams", color: "#6264A7", icon: "T" },
};

function VideoConferenceSection() {
  const [connections, setConnections] = useState<VideoConferenceConnection[]>(mockVideoConnections);

  const toggleConnection = (id: string) => {
    setConnections((prev) => prev.map((c) => c.id === id ? { ...c, connected: !c.connected, connectedAt: c.connected ? c.connectedAt : new Date().toISOString() } : c));
  };

  const toggleAutoRecord = (id: string) => {
    setConnections((prev) => prev.map((c) => c.id === id ? { ...c, autoRecord: !c.autoRecord } : c));
  };

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-on-surface-variant">
        {connections.filter((c) => c.connected).length} dari {connections.length} layanan terhubung
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {connections.map((conn) => {
          const provider = providerInfo[conn.provider];
          return (
            <Card key={conn.id} className={cn(!conn.connected && "opacity-60")}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white font-bold text-sm"
                      style={{ backgroundColor: provider.color }}
                    >
                      {provider.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-on-surface">{provider.name}</h3>
                      <p className="text-label-xs text-on-surface-variant">{conn.email}</p>
                    </div>
                  </div>
                  <Badge variant={conn.connected ? "default" : "secondary"} className="text-label-xs">
                    {conn.connected ? "Terhubung" : "Putus"}
                  </Badge>
                </div>

                {conn.connected && (
                  <div className="flex items-center gap-2 text-label-xs text-on-surface-variant">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>Terhubung sejak {new Date(conn.connectedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                )}

                {conn.lastSyncAt && (
                  <div className="flex items-center gap-2 text-label-xs text-on-surface-variant">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Sinkron {new Date(conn.lastSyncAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-surface-container">
                  <label className="text-label-sm text-on-surface-variant">Rekam Otomatis</label>
                  <Switch checked={conn.autoRecord} onCheckedChange={() => toggleAutoRecord(conn.id)} disabled={!conn.connected} />
                </div>

                <Button
                  variant={conn.connected ? "outline" : "default"}
                  className="w-full"
                  onClick={() => toggleConnection(conn.id)}
                >
                  {conn.connected ? (
                    <><Unlink className="mr-2 h-4 w-4" />Putuskan</>
                  ) : (
                    <><Link2 className="mr-2 h-4 w-4" />Hubungkan</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-headline-md">Cara Kerja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-body-sm text-on-surface-variant">
          <p>Setelah menghubungkan akun video conference:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Risalah akan otomatis mendeteksi jadwal meeting dari kalender terintegrasi</li>
            <li>Saat meeting dimulai, Risalah dapat otomatis merekam (jika fitur rekam aktif)</li>
            <li>Setelah meeting selesai, transkrip dan ringkasan akan dihasilkan otomatis</li>
            <li>Notifikasi akan dikirim ke pengguna yang diundang</li>
          </ol>
          <div className="rounded-xl bg-primary-container/20 p-3 flex items-start gap-2">
            <Video className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-on-surface">Fitur Premium</p>
              <p className="text-label-xs text-on-surface-variant">Integrasi video conference membutuhkan langganan Enterprise. Hubungi tim penjualan untuk informasi lebih lanjut.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>(mockApiKeys);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRole, setNewKeyRole] = useState("viewer");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const generateKey = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "risalah_";
    for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const addKey = () => {
    if (!newKeyName) return;
    const key = generateKey();
    setNewKeyValue(key);
    const newAk: ApiKey = {
      id: `ak-${Date.now()}`,
      name: newKeyName,
      key,
      lastDigits: key.slice(-4),
      role: newKeyRole,
      active: true,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
    };
    setKeys((prev) => [newAk, ...prev]);
    setNewKeyName("");
    setNewKeyRole("viewer");
  };

  const deleteKey = (id: string) => {
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-body-sm text-on-surface-variant">{keys.length} API key terdaftar</p>
        <Button onClick={() => { setShowNewKey(true); setNewKeyValue(""); }}>
          <Plus className="mr-2 h-4 w-4" />
          Buat API Key
        </Button>
      </div>

      {showNewKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-headline-md">API Key Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {newKeyValue ? (
              <div className="rounded-xl bg-warning-container/20 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">Simpan API Key ini!</p>
                    <p className="text-label-xs text-on-surface-variant">Key tidak akan bisa ditampilkan lagi setelah halaman ini ditutup.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-surface-container-high px-3 py-2 font-mono text-xs text-on-surface break-all select-all">
                    {newKeyValue}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => copyKey(newKeyValue)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-label-sm text-on-surface-variant">Nama Key</label>
                  <Input placeholder="Contoh: Production API" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} className="bg-surface-container-low" />
                </div>
                <div className="space-y-2">
                  <label className="text-label-sm text-on-surface-variant">Role</label>
                  <Select value={newKeyRole} onValueChange={setNewKeyRole}>
                    <SelectTrigger className="bg-surface-container-low">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addKey} disabled={!newKeyName}>Generate Key</Button>
                  <Button variant="outline" onClick={() => { setShowNewKey(false); setNewKeyValue(""); }}>Batal</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {keys.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
          <KeyRound className="mb-2 h-12 w-12 opacity-30" />
          <p className="text-body-md">Belum ada API key</p>
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {keys.map((ak) => (
            <GlassPanel key={ak.id} className={cn("p-4", !ak.active && "opacity-60")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                    ak.active ? "bg-primary-container" : "bg-surface-container-high",
                  )}>
                    <KeyRound className={cn("h-5 w-5", ak.active ? "text-primary" : "text-on-surface-variant")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-on-surface">{ak.name}</h3>
                      <Badge variant={ak.active ? "default" : "secondary"} className="text-label-xs">{ak.active ? "Aktif" : "Nonaktif"}</Badge>
                      <Badge variant="outline" className="text-label-xs">{ak.role}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 font-mono text-label-xs text-on-surface-variant">
                      {visibleKeys.has(ak.id) ? (
                        <span className="select-all break-all">{ak.key}</span>
                      ) : (
                        <span>••••••••{ak.lastDigits}</span>
                      )}
                      <button onClick={() => toggleVisibility(ak.id)} className="text-primary hover:underline">
                        {visibleKeys.has(ak.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                      <button onClick={() => copyKey(ak.key)} className="text-primary hover:underline">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-1 flex gap-4 text-label-xs text-on-surface-variant">
                      <span>Dibuat {new Date(ak.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {ak.lastUsedAt && <span>Terakhir dipakai {new Date(ak.lastUsedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                    </div>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-error shrink-0" onClick={() => deleteKey(ak.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
