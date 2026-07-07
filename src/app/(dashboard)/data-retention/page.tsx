"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Clock, Trash2, Shield, Download, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetentionPolicy {
  id: string;
  dataType: string;
  description: string;
  retentionDays: number;
  enabled: boolean;
}

interface ComplianceCheck {
  id: string;
  name: string;
  status: "passed" | "warning" | "failed";
  description: string;
}

const defaultPolicies: RetentionPolicy[] = [
  { id: "rp-1", dataType: "Audio Rekaman", description: "File audio asli hasil rekaman rapat", retentionDays: 365, enabled: true },
  { id: "rp-2", dataType: "Transkrip", description: "Hasil transkripsi teks dari rekaman", retentionDays: 730, enabled: true },
  { id: "rp-3", dataType: "Notulen", description: "Notulen rapat yang sudah disetujui", retentionDays: 1095, enabled: true },
  { id: "rp-4", dataType: "AI Chat History", description: "Riwayat percakapan dengan AI", retentionDays: 90, enabled: true },
  { id: "rp-5", dataType: "Export Logs", description: "File hasil export (PDF/DOCX/TXT)", retentionDays: 180, enabled: false },
  { id: "rp-6", dataType: "Audit Logs", description: "Catatan audit aktivitas pengguna", retentionDays: 730, enabled: true },
];

const complianceChecks: ComplianceCheck[] = [
  { id: "cc-1", name: "Enkripsi Data", status: "passed", description: "Semua data dienkripsi AES-256-GCM" },
  { id: "cc-2", name: "Audit Trail", status: "passed", description: "Semua aktivitas pengguna tercatat" },
  { id: "cc-3", name: "RBAC", status: "passed", description: "Role-based access control aktif" },
  { id: "cc-4", name: "MFA untuk Admin", status: "warning", description: "Belum semua admin mengaktifkan MFA" },
  { id: "cc-5", name: "Data Backup", status: "passed", description: "Backup otomatis setiap 24 jam" },
  { id: "cc-6", name: "Data Residency", status: "passed", description: "Semua data tersimpan di server Indonesia" },
];

export default function DataRetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>(defaultPolicies);
  const [showExportModal, setShowExportModal] = useState(false);

  const togglePolicy = (id: string) => {
    setPolicies((prev) => prev.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const updateRetention = (id: string, days: number) => {
    setPolicies((prev) => prev.map((p) => p.id === id ? { ...p, retentionDays: days } : p));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Data Retention & Compliance</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">Kelola kebijakan penyimpanan data dan kepatuhan</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Data", value: "47.3 GB", icon: HardDriveIcon },
          { label: "Kebijakan Aktif", value: `${policies.filter(p => p.enabled).length}/${policies.length}`, icon: Shield },
          { label: "Compliance", value: "83%", icon: CheckCircle2 },
          { label: "Backup Terakhir", value: "2 jam lalu", icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              <p className="text-headline-md text-on-surface font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-headline-md flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Kebijakan Retensi Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {policies.map((policy) => (
            <GlassPanel key={policy.id} className={cn("p-4", !policy.enabled && "opacity-60")}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full shrink-0",
                    policy.enabled ? "bg-primary-container" : "bg-surface-container-high",
                  )}>
                    <FileText className={cn("h-5 w-5", policy.enabled ? "text-primary" : "text-on-surface-variant")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-on-surface">{policy.dataType}</h3>
                      <Badge variant={policy.enabled ? "default" : "secondary"} className="text-label-xs">
                        {policy.enabled ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="text-label-xs text-on-surface-variant">{policy.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {policy.enabled && (
                    <Select
                      value={String(policy.retentionDays)}
                      onValueChange={(v) => updateRetention(policy.id, Number(v))}
                    >
                      <SelectTrigger className="w-32 bg-surface-container-low h-8 text-label-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 hari</SelectItem>
                        <SelectItem value="90">90 hari</SelectItem>
                        <SelectItem value="180">180 hari</SelectItem>
                        <SelectItem value="365">1 tahun</SelectItem>
                        <SelectItem value="730">2 tahun</SelectItem>
                        <SelectItem value="1095">3 tahun</SelectItem>
                        <SelectItem value="1825">5 tahun</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Switch checked={policy.enabled} onCheckedChange={() => togglePolicy(policy.id)} />
                </div>
              </div>
            </GlassPanel>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-headline-md flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Compliance Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {complianceChecks.map((check) => (
            <div key={check.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
              <div className="flex items-center gap-3">
                {check.status === "passed" ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : check.status === "warning" ? (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                ) : (
                  <Trash2 className="h-5 w-5 text-error" />
                )}
                <div>
                  <p className="text-sm font-medium text-on-surface">{check.name}</p>
                  <p className="text-label-xs text-on-surface-variant">{check.description}</p>
                </div>
              </div>
              <Badge
                variant={check.status === "passed" ? "default" : check.status === "warning" ? "secondary" : "destructive"}
                className="text-label-xs"
              >
                {check.status === "passed" ? "Lulus" : check.status === "warning" ? "Peringatan" : "Gagal"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-headline-md flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Data Export (GDPR / PP)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">
            Ekspor seluruh data pengguna sesuai dengan peraturan perlindungan data (UU PDP / GDPR).
            Proses ekspor akan mengirimkan link download ke email Anda dalam waktu 24 jam.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => setShowExportModal(true)}>
              <Download className="mr-2 h-4 w-4" />
              Minta Ekspor Data
            </Button>
            <Button variant="outline" className="text-error">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Hapus Akun
            </Button>
          </div>
          {showExportModal && (
            <div className="rounded-xl bg-success-container/20 p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-on-surface">Permintaan berhasil dikirim</p>
                <p className="text-label-xs text-on-surface-variant">Link download akan dikirim ke email Anda dalam 24 jam.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HardDriveIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="22 12 18 12 15 9 9 15 6 12 2 12" />
    </svg>
  );
}
