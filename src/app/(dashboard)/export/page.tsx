"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  FileDown,
  Download,
  FileSpreadsheet,
  FileAudio,
  History,
  CheckCircle2,
  Loader2,
  Clock,
} from "lucide-react";

const exportFormats = [
  {
    id: "pdf",
    label: "PDF",
    icon: FileText,
    desc: "Dokumen siap cetak dengan format resmi pemerintah",
    color: "text-red-500 bg-red-50",
  },
  {
    id: "docx",
    label: "DOCX",
    icon: FileText,
    desc: "Dokumen Word yang dapat diedit lebih lanjut",
    color: "text-blue-500 bg-blue-50",
  },
  {
    id: "txt",
    label: "TXT",
    icon: FileSpreadsheet,
    desc: "Teks biasa untuk salin ke aplikasi lain",
    color: "text-gray-500 bg-gray-50",
  },
  {
    id: "audio",
    label: "Audio",
    icon: FileAudio,
    desc: "Rekaman rapat dalam format audio terkompresi",
    color: "text-amber-500 bg-amber-50",
  },
];

const recentExports = [
  { id: "e1", title: "Notula Rapat — Koordinasi APBD 2025", format: "PDF", date: "12 Jun 2026, 14:30", status: "completed", size: "2.4 MB" },
  { id: "e2", title: "Transkrip — Evaluasi Program Kerja", format: "DOCX", date: "12 Jun 2026, 14:25", status: "completed", size: "156 KB" },
  { id: "e3", title: "Ringkasan — Rapat Persiapan Tahunan", format: "PDF", date: "10 Jun 2026, 09:15", status: "completed", size: "890 KB" },
  { id: "e4", title: "Transkrip Lengkap — Sosialisasi Sistem", format: "TXT", date: "08 Jun 2026, 16:00", status: "completed", size: "45 KB" },
];

const meetingItems = [
  { id: "M-2026-001", title: "Rapat Koordinasi Evaluasi Program Kerja Triwulan II", date: "12 Jun 2026" },
  { id: "M-2026-002", title: "Rapat Persiapan Laporan Akhir Tahun", date: "15 Jun 2026" },
  { id: "M-2026-004", title: "Rapat Tim Anggaran dan Perencanaan", date: "10 Jun 2026" },
];

export default function ExportPage() {
  const [activeTab, setActiveTab] = useState("export");
  const [selectedMeeting, setSelectedMeeting] = useState("M-2026-001");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const toggleFormat = (id: string) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const handleExport = () => {
    if (selectedFormats.length === 0) return;
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setSelectedFormats([]);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Export</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Export transkrip, ringkasan, dan notula rapat dalam berbagai format
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="export">
            <FileDown className="mr-2 h-4 w-4" />
            Export Baru
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Riwayat Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <GlassPanel className="p-5">
                <h3 className="mb-4 font-headline text-headline-sm text-on-surface">
                  Pilih Rapat
                </h3>
                <div className="space-y-2">
                  {meetingItems.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMeeting(m.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        selectedMeeting === m.id
                          ? "border-primary bg-primary/5"
                          : "border-surface-container bg-surface-container-low hover:border-primary/50"
                      }`}
                    >
                      <p className="text-body-sm font-medium text-on-surface">{m.title}</p>
                      <p className="text-label-sm text-on-surface-variant">{m.date}</p>
                    </button>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel className="p-5">
                <h3 className="mb-4 font-headline text-headline-sm text-on-surface">
                  Format Export
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {exportFormats.map((fmt) => {
                    const isSelected = selectedFormats.includes(fmt.id);
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => toggleFormat(fmt.id)}
                        className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-surface-container bg-surface-container-low hover:border-primary/50"
                        }`}
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${fmt.color}`}>
                          <fmt.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-body-sm font-medium text-on-surface">{fmt.label}</p>
                          <p className="text-label-sm text-on-surface-variant">{fmt.desc}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </GlassPanel>
            </div>

            <div className="space-y-4">
              <GlassPanel className="p-5">
                <h3 className="mb-4 font-headline text-headline-sm text-on-surface">
                  Ringkasan Export
                </h3>
                <div className="space-y-3 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Rapat</span>
                    <span className="font-medium text-on-surface">
                      {meetingItems.find((m) => m.id === selectedMeeting)?.title ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Format</span>
                    <span className="font-medium text-on-surface">
                      {selectedFormats.length > 0
                        ? selectedFormats.map((f) => f.toUpperCase()).join(", ")
                        : "Belum dipilih"}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <Button
                    className="w-full"
                    onClick={handleExport}
                    disabled={selectedFormats.length === 0 || isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengexport...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export ({selectedFormats.length})
                      </>
                    )}
                  </Button>
                </div>
              </GlassPanel>

              <GlassPanel className="p-5">
                <h3 className="mb-3 font-headline text-headline-sm text-on-surface">
                  Export Otomatis
                </h3>
                <p className="mb-4 text-body-sm text-on-surface-variant">
                  Aktifkan export otomatis setiap kali transkrip atau notula selesai diproses.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Atur Otomatisasi (Segera)
                </Button>
              </GlassPanel>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-3">
            {recentExports.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-on-surface">{item.title}</p>
                    <p className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                      <span>{item.format}</span>
                      <span>•</span>
                      <span>{item.size}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.date}
                      </span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
