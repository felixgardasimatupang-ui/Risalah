"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassPanel } from "@/components/shared/glass-panel";
import { RefreshCw, Server, Database, Cpu, Activity, Clock, CheckCircle2, AlertTriangle, XCircle, Wifi, HardDrive, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceStatus = "operational" | "degraded" | "down" | "maintenance";

interface Service {
  id: string;
  name: string;
  icon: typeof Server;
  status: ServiceStatus;
  uptime: string;
  latency: string;
  version: string;
  lastChecked: string;
}

interface Metric {
  label: string;
  value: string;
  icon: typeof Activity;
  trend: "up" | "down" | "stable";
}

const initialServices: Service[] = [
  { id: "app", name: "Web App", icon: Server, status: "operational", uptime: "99.97%", latency: "120ms", version: "2.1.0", lastChecked: "now" },
  { id: "api", name: "API Server", icon: Wifi, status: "operational", uptime: "99.95%", latency: "85ms", version: "2.1.0", lastChecked: "now" },
  { id: "ai", name: "AI Service", icon: Cpu, status: "operational", uptime: "99.89%", latency: "450ms", version: "1.3.0", lastChecked: "now" },
  { id: "db", name: "PostgreSQL", icon: Database, status: "operational", uptime: "99.99%", latency: "5ms", version: "16.4", lastChecked: "now" },
  { id: "redis", name: "Redis Cache", icon: Database, status: "operational", uptime: "99.98%", latency: "2ms", version: "7.2", lastChecked: "now" },
  { id: "queue", name: "Task Queue", icon: Activity, status: "operational", uptime: "99.92%", latency: "15ms", version: "5.4", lastChecked: "now" },
  { id: "storage", name: "Object Storage", icon: HardDrive, status: "operational", uptime: "99.95%", latency: "35ms", version: "MinIO 2024", lastChecked: "now" },
  { id: "ws", name: "WebSocket", icon: Zap, status: "operational", uptime: "99.88%", latency: "10ms", version: "2.1.0", lastChecked: "now" },
];

const metrics: Metric[] = [
  { label: "Requests/min", value: "1,247", icon: Activity, trend: "up" },
  { label: "Avg Response Time", value: "112ms", icon: Clock, trend: "down" },
  { label: "Error Rate", value: "0.02%", icon: AlertTriangle, trend: "down" },
  { label: "Active Users", value: "24", icon: Cpu, trend: "up" },
];

const statusConfig: Record<ServiceStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  operational: { label: "Operasional", color: "text-success", icon: CheckCircle2 },
  degraded: { label: "Degradasi", color: "text-warning", icon: AlertTriangle },
  down: { label: "Gangguan", color: "text-error", icon: XCircle },
  maintenance: { label: "Pemeliharaan", color: "text-on-surface-variant", icon: Activity },
};

export default function SystemHealthPage() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString("id-ID"));
  const [checking, setChecking] = useState(false);
  const allOperational = services.every((s) => s.status === "operational");

  const checkAll = () => {
    setChecking(true);
    const updated = services.map((s) => ({
      ...s,
      status: Math.random() > 0.85 ? ("degraded" as ServiceStatus) : ("operational" as ServiceStatus),
      latency: s.id === "ai" ? `${300 + Math.floor(Math.random() * 300)}ms` : s.latency,
      lastChecked: "now",
    }));
    setTimeout(() => {
      setServices(updated);
      setLastUpdated(new Date().toLocaleTimeString("id-ID"));
      setChecking(false);
    }, 1500);
  };

  useEffect(() => { checkAll(); }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-headline-lg text-on-surface">System Health</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Status seluruh layanan Risalah</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", allOperational ? "bg-success" : "bg-warning")} />
            <span className={cn("text-label-sm", allOperational ? "text-success" : "text-warning")}>
              {allOperational ? "All Systems Operational" : "Some Issues Detected"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={checkAll} disabled={checking}>
            <RefreshCw className={cn("mr-2 h-4 w-4", checking && "animate-spin")} />
            {checking ? "Memeriksa..." : "Periksa Semua"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                <m.icon className="h-4 w-4" />
                {m.label}
              </div>
              <p className="text-headline-md text-on-surface font-bold">{m.value}</p>
              <Badge variant={m.trend === "up" ? "default" : "secondary"} className="text-label-xs">
                {m.trend === "up" ? "↑ Naik" : "↓ Turun"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {services.map((svc) => {
          const cfg = statusConfig[svc.status];
          const Icon = svc.icon;
          const StatusIcon = cfg.icon;
          return (
            <GlassPanel key={svc.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                    <Icon className="h-5 w-5 text-on-surface-variant" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-on-surface">{svc.name}</h3>
                      <StatusIcon className={cn("h-4 w-4", cfg.color)} />
                      <span className={cn("text-label-xs", cfg.color)}>{cfg.label}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-label-xs text-on-surface-variant">
                      <span>Uptime: {svc.uptime}</span>
                      <span>Latensi: {svc.latency}</span>
                      <span>Versi: {svc.version}</span>
                      <span>Terakhir: {svc.lastChecked}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-label-xs shrink-0">v{svc.version}</Badge>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      <p className="text-center text-label-xs text-on-surface-variant">Terakhir diperbarui: {lastUpdated}</p>
    </div>
  );
}
