"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassPanel } from "@/components/shared/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Mic,
  Calendar,
  Clock,
  TrendingUp,
  MessageSquare,
  Award,
} from "lucide-react";

interface SpeakerStat {
  id: string;
  name: string;
  role: string;
  email: string;
  totalMeetings: number;
  totalSpeakingTime: number;
  speakingPercentage: number;
  topCategories: string[];
  recentTopics: string[];
}

const speakerStats: SpeakerStat[] = [
  {
    id: "p1",
    name: "Dr. Andi Pratama, M.Si.",
    role: "Pimpinan Rapat",
    email: "andi@sekneg.go.id",
    totalMeetings: 10,
    totalSpeakingTime: 45,
    speakingPercentage: 42,
    topCategories: ["Koordinasi", "Anggaran"],
    recentTopics: ["Evaluasi Program", "APBD 2026"],
  },
  {
    id: "p2",
    name: "Sari Dewi, S.Sos.",
    role: "Sekretaris",
    email: "sari@sekneg.go.id",
    totalMeetings: 8,
    totalSpeakingTime: 25,
    speakingPercentage: 23,
    topCategories: ["Laporan", "Anggaran"],
    recentTopics: ["Laporan Keuangan", "Administrasi"],
  },
  {
    id: "p3",
    name: "Bambang Susilo",
    role: "Kepala Divisi TI",
    email: "bambang@sekneg.go.id",
    totalMeetings: 6,
    totalSpeakingTime: 18,
    speakingPercentage: 17,
    topCategories: ["Infrastruktur", "TI"],
    recentTopics: ["Sistem Informasi", "Migrasi Data"],
  },
  {
    id: "p4",
    name: "Dian Kusumawardhani",
    role: "Analis Kebijakan",
    email: "dian@sekneg.go.id",
    totalMeetings: 5,
    totalSpeakingTime: 12,
    speakingPercentage: 11,
    topCategories: ["Regulasi", "Kebijakan"],
    recentTopics: ["Revisi Regulasi", "Kebijakan Baru"],
  },
  {
    id: "p5",
    name: "Fajar Nugroho",
    role: "Staf Hukum",
    email: "fajar@sekneg.go.id",
    totalMeetings: 4,
    totalSpeakingTime: 8,
    speakingPercentage: 7,
    topCategories: ["Hukum", "Regulasi"],
    recentTopics: ["Dokumen Hukum", "Pengesahan"],
  },
];

const speakerProgress = [
  { month: "Jan", speakers: 3, duration: 4.5 },
  { month: "Feb", speakers: 4, duration: 3.2 },
  { month: "Mar", speakers: 5, duration: 6.8 },
  { month: "Apr", speakers: 4, duration: 5.1 },
  { month: "May", speakers: 5, duration: 4.9 },
  { month: "Jun", speakers: 5, duration: 3.5 },
];

const maxBar = Math.max(...speakerProgress.map((m) => m.duration));

export default function SpeakerPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");

  const filtered = speakerStats.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()),
  );

  const totalParticipants = speakerStats.length;
  const avgSpeakingTime = speakerStats.reduce((a, b) => a + b.totalMeetings, 0) / totalParticipants;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-headline-lg text-on-surface">Speaker</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Analisis partisipasi dan kontribusi pembicara dalam rapat
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Total Pembicara</CardTitle>
            <Users className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-on-surface">{totalParticipants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Rata-rata Kehadiran</CardTitle>
            <Calendar className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-on-surface">
              {avgSpeakingTime.toFixed(1)}
            </div>
            <p className="text-label-sm text-on-surface-variant">rapat per orang</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Total Waktu Bicara</CardTitle>
            <Clock className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-on-surface">
              {speakerStats.reduce((a, b) => a + b.totalSpeakingTime, 0)}
            </div>
            <p className="text-label-sm text-on-surface-variant">menit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">Pembicara Teratas</CardTitle>
            <TrendingUp className="h-4 w-4 text-on-surface-variant" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-on-surface">{speakerStats[0].name}</div>
            <p className="text-label-sm text-on-surface-variant">{speakerStats[0].speakingPercentage}% partisipasi</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Users className="mr-2 h-4 w-4" />
            Semua Pembicara
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Award className="mr-2 h-4 w-4" />
            Wawasan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <Input
              placeholder="Cari pembicara..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {filtered.map((speaker) => (
              <GlassPanel key={speaker.id} className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary-container text-lg text-on-primary-container">
                      {speaker.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-headline text-headline-sm text-on-surface">
                          {speaker.name}
                        </h3>
                        <p className="text-body-sm text-on-surface-variant">{speaker.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-headline-sm font-bold text-primary">
                          {speaker.speakingPercentage}%
                        </p>
                        <p className="text-label-sm text-on-surface-variant">partisipasi</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                        <Mic className="h-3.5 w-3.5" />
                        {speaker.totalSpeakingTime} menit bicara
                      </div>
                      <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                        <Calendar className="h-3.5 w-3.5" />
                        {speaker.totalMeetings} rapat
                      </div>
                      <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {speaker.recentTopics.join(", ")}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-label-sm text-on-surface-variant">Topik:</span>
                      {speaker.topCategories.map((cat) => (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassPanel>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="mt-6 space-y-6">
          <GlassPanel className="p-6">
            <h3 className="mb-6 font-headline text-headline-sm text-on-surface">
              Tren Partisipasi Pembicara per Bulan
            </h3>
            <div className="space-y-3">
              {speakerProgress.map((m) => (
                <div key={m.month} className="flex items-center gap-4">
                  <span className="w-10 text-label-sm font-medium text-on-surface">{m.month}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 rounded-md bg-primary transition-all"
                        style={{ width: `${(m.duration / maxBar) * 100}%` }}
                      />
                      <span className="text-label-sm text-on-surface-variant">
                        {m.duration} jam
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {m.speakers} org
                  </Badge>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="mb-4 font-headline text-headline-sm text-on-surface">
              Distribusi Waktu Bicara
            </h3>
            <div className="space-y-4">
              {speakerStats
                .sort((a, b) => b.speakingPercentage - a.speakingPercentage)
                .map((speaker) => (
                  <div key={speaker.id}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-body-sm font-medium text-on-surface">
                        {speaker.name}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">
                        {speaker.speakingPercentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${speaker.speakingPercentage}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <h3 className="mb-4 font-headline text-headline-sm text-on-surface">
              Kategori Keahlian per Pembicara
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {speakerStats.map((speaker) => (
                <div key={speaker.id} className="rounded-lg bg-surface-container-low p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-container text-xs text-on-primary-container">
                        {speaker.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">{speaker.name}</p>
                      <p className="text-label-xs text-on-surface-variant">{speaker.role}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {speaker.topCategories.map((cat) => (
                      <Badge key={cat} variant="outline" className="text-xs">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
