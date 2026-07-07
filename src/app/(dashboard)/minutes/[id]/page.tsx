"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Edit3,
  SendHorizonal,
  Printer,
  FileDown,
  ArrowLeft,
  AlertCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

const sampleMinutes = {
  id: "m1",
  title: "Rapat Koordinasi APBD 2025",
  date: "15 Januari 2025",
  location: "Ruang Rapat Utama, Gedung Sekretariat Daerah",
  status: "draft" as "draft" | "review" | "approved" | "archived",
  templateType: "Pemerintah Daerah",
  participants: [
    { name: "Dr. Ahmad Syahputra, M.Si", role: "Kepala Bappeda" },
    { name: "Ir. Dewi Sartika, M.M.", role: "Sekretaris Daerah" },
    { name: "H. Bambang Susilo, S.E.", role: "Ketua DPRD Komisi IV" },
    { name: "Dr. Ratna Dewi, S.H., M.H.", role: "Kepala Biro Hukum" },
  ],
  content: {
    pembukaan: "Rapat Koordinasi APBD 2025 dibuka pada pukul 09.00 WIB oleh Kepala Bappeda selaku pimpinan rapat. Rapat diawali dengan doa bersama.",
    agenda: [
      "Pembahasan pagu anggaran APBD 2025",
      "Evaluasi program prioritas daerah",
      "Penetapan alokasi anggaran OPD",
    ],
    pembahasan: [
      {
        poin: "Pagu Anggaran",
        isi: "Pagu anggaran APBD 2025 ditetapkan sebesar Rp 5,2 Triliun, meningkat 12% dari APBD 2024. Peningkatan ini dialokasikan untuk program infrastruktur dan pendidikan.",
      },
      {
        poin: "Program Prioritas",
        isi: "Terdapat 12 program prioritas yang akan didanai, termasuk pembangunan jalan daerah, peningkatan kualitas pendidikan, dan layanan kesehatan.",
      },
      {
        poin: "Alokasi OPD",
        isi: "Setiap OPD diminta untuk menyampaikan RKA (Rencana Kegiatan dan Anggaran) paling lambat 31 Januari 2025.",
      },
    ],
    kesimpulan: "Rapat menyepakati pagu anggaran sementara dan jadwal penyampaian RKA oleh masing-masing OPD.",
    penutup: "Rapat ditutup pada pukul 12.30 WIB dengan harapan semua pihak dapat bekerja sama dalam penyusunan APBD 2025.",
  },
  actionItems: [
    { id: "a1", description: "Menyusun RKA masing-masing OPD", assignee: "Seluruh OPD", dueDate: "31 Jan 2025", status: "pending" },
    { id: "a2", description: "Finalisasi pagu anggaran", assignee: "Bappeda", dueDate: "15 Feb 2025", status: "pending" },
    { id: "a3", description: "Review dokumen pendukung", assignee: "Biro Hukum", dueDate: "10 Feb 2025", status: "completed" },
  ],
};

export default function MinutesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [activeTab, setActiveTab] = useState("preview");
  const [minutes] = useState(sampleMinutes);

  const statusConfig = {
    draft: { label: "Draft", color: "text-amber-600 bg-amber-500/10" },
    review: { label: "Review", color: "text-blue-600 bg-blue-500/10" },
    approved: { label: "Disetujui", color: "text-emerald-600 bg-emerald-500/10" },
    archived: { label: "Arsip", color: "text-gray-600 bg-gray-500/10" },
  };

  const config = statusConfig[minutes.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/meetings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline text-headline-lg text-on-surface">
                Notula Rapat
              </h1>
              <Badge className={config.color}>{config.label}</Badge>
              <Badge variant="outline">{minutes.templateType}</Badge>
            </div>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {minutes.title} — {minutes.date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={minutes.status === "approved"}>
            <SendHorizonal className="mr-2 h-4 w-4" />
            Kirim Review
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" disabled={minutes.status === "approved"}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Setujui
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="preview">
            <FileText className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="edit">
            <Edit3 className="mr-2 h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-6 space-y-6">
          <GlassPanel className="p-8">
            <div className="mx-auto max-w-3xl space-y-8">
              <div className="text-center">
                <h2 className="font-headline text-headline-xl text-on-surface">
                  NOTULA RAPAT
                </h2>
                <h3 className="mt-2 font-headline text-headline-md text-on-surface">
                  {minutes.title}
                </h3>
                <div className="mt-4 flex items-center justify-center gap-6 text-body-sm text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {minutes.date}
                  </span>
                  <span>{minutes.location}</span>
                </div>
              </div>

              <section>
                <h4 className="mb-3 font-headline text-headline-sm text-on-surface">Peserta Rapat</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {minutes.participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-container-low p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-label-sm text-on-primary-container">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-body-sm font-medium text-on-surface">{p.name}</p>
                        <p className="text-label-sm text-on-surface-variant">{p.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="font-headline text-headline-sm text-on-surface">Pembukaan</h4>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {minutes.content.pembukaan}
                </p>
              </section>

              <section className="space-y-4">
                <h4 className="font-headline text-headline-sm text-on-surface">Agenda</h4>
                <ol className="list-inside list-decimal space-y-2 text-body-md text-on-surface-variant">
                  {minutes.content.agenda.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </section>

              <section className="space-y-4">
                <h4 className="font-headline text-headline-sm text-on-surface">Pembahasan</h4>
                {minutes.content.pembahasan.map((item, i) => (
                  <div key={i} className="rounded-lg bg-surface-container-low p-4">
                    <h5 className="font-medium text-on-surface">{item.poin}</h5>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{item.isi}</p>
                  </div>
                ))}
              </section>

              <section className="space-y-4">
                <h4 className="font-headline text-headline-sm text-on-surface">Kesimpulan</h4>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {minutes.content.kesimpulan}
                </p>
              </section>

              <section className="space-y-4">
                <h4 className="font-headline text-headline-sm text-on-surface">Penutup</h4>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {minutes.content.penutup}
                </p>
              </section>

              <section className="space-y-3">
                <h4 className="font-headline text-headline-sm text-on-surface">Tindak Lanjut</h4>
                {minutes.actionItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-3">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    )}
                    <div className="flex-1">
                      <p className={`text-body-sm ${item.status === "completed" ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                        {item.description}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        PIC: {item.assignee} — Deadline: {item.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </section>

              <div className="pt-4 text-center text-label-sm text-on-surface-variant">
                <p>Dokumen ini digenerate secara otomatis oleh SEKNEG AI</p>
              </div>
            </div>
          </GlassPanel>
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <GlassPanel className="flex flex-col items-center justify-center p-12 text-center">
            <Edit3 className="mb-4 h-12 w-12 text-on-surface-variant/50" />
            <h3 className="font-headline text-headline-sm text-on-surface-variant">
              Editor Notula
            </h3>
            <p className="mt-2 max-w-md text-body-sm text-on-surface-variant">
              Fitur editor notula akan segera tersedia. Anda akan dapat mengedit notula
              langsung di browser dengan format yang sesuai dengan template pemerintah.
            </p>
          </GlassPanel>
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { format: "PDF", icon: FileText, desc: "Dokumen PDF siap cetak dengan format resmi" },
              { format: "DOCX", icon: FileText, desc: "Dokumen Word yang dapat diedit lebih lanjut" },
              { format: "TXT", icon: FileText, desc: "Teks biasa untuk salin ke aplikasi lain" },
            ].map((item) => (
              <Card key={item.format} className="cursor-pointer transition-colors hover:bg-surface-container-low">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <item.icon className="mb-3 h-10 w-10 text-primary" />
                  <CardTitle className="text-headline-sm text-on-surface">{item.format}</CardTitle>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{item.desc}</p>
                  <Button variant="outline" className="mt-4">
                    <Download className="mr-2 h-4 w-4" />
                    Download {item.format}
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
