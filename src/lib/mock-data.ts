import type { Meeting, Transcript, Summary, Participant, Organization, Invite, CalendarEvent, AuditLogEntry, Webhook, ApiKey, VideoConferenceConnection } from "@/types/meeting";

export const mockOrganizations: Organization[] = [
  { id: "org-1", name: "Sekretariat Negara RI", slug: "sekneg", logoUrl: "", memberCount: 5 },
  { id: "org-2", name: "Kementerian Dalam Negeri", slug: "kemendagri", logoUrl: "", memberCount: 12 },
  { id: "org-3", name: "DPR RI", slug: "dpr", logoUrl: "", memberCount: 8 },
];

export const mockInvites: Invite[] = [
  { id: "inv-1", email: "asep@kemendagri.go.id", role: "member", status: "pending", invitedBy: "admin@sekneg.go.id", createdAt: "2026-07-01T10:00:00" },
  { id: "inv-2", email: "rudi@dpr.go.id", role: "viewer", status: "pending", invitedBy: "admin@sekneg.go.id", createdAt: "2026-07-02T14:30:00" },
  { id: "inv-3", email: "dewi@kemendagri.go.id", role: "admin", status: "accepted", invitedBy: "admin@sekneg.go.id", createdAt: "2026-06-28T09:00:00" },
];

export const mockWebhooks: Webhook[] = [
  { id: "wh-1", name: "Notifikasi Slack", url: "https://hooks.slack.com/services/T00/B00/xxx", events: ["transcript_ready", "summary_ready"], active: true, lastTriggeredAt: "2026-07-06T14:30:00", createdAt: "2026-06-01T10:00:00" },
  { id: "wh-2", name: "Integrasi Aplikasi Internal", url: "https://api.internal.go.id/webhook/risalah", events: ["meeting.created", "minutes.approved"], active: true, lastTriggeredAt: "2026-07-05T09:15:00", createdAt: "2026-06-15T08:00:00" },
  { id: "wh-3", name: "Notifikasi Telegram", url: "https://api.telegram.org/botxxx/sendMessage", events: ["action_item_due"], active: false, lastTriggeredAt: null, createdAt: "2026-06-20T11:00:00" },
];

export const mockApiKeys: ApiKey[] = [
  { id: "ak-1", name: "Production API Key", key: "risalah_prod_xxx", lastDigits: "a3f8", role: "admin", active: true, lastUsedAt: "2026-07-06T16:45:00", createdAt: "2026-05-01T09:00:00" },
  { id: "ak-2", name: "Development Key", key: "risalah_dev_xxx", lastDigits: "b2d4", role: "editor", active: true, lastUsedAt: "2026-07-04T11:20:00", createdAt: "2026-05-15T10:00:00" },
  { id: "ak-3", name: "Integrasi Bappenas", key: "risalah_int_xxx", lastDigits: "c7e1", role: "viewer", active: false, lastUsedAt: "2026-06-28T08:00:00", createdAt: "2026-06-01T12:00:00" },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: "cal-1", title: "Rapat Koordinasi Evaluasi Program Kerja", date: "2026-07-15T09:00:00", duration: 105, meetingId: "M-2026-001", attendees: ["andi@sekneg.go.id", "sari@sekneg.go.id"], synced: true },
  { id: "cal-2", title: "Rapat Persiapan Laporan Akhir Tahun", date: "2026-07-18T10:00:00", duration: 90, meetingId: "M-2026-002", attendees: ["andi@sekneg.go.id", "bambang@sekneg.go.id"], synced: false },
  { id: "cal-3", title: "Review Anggaran Triwulan III", date: "2026-07-22T08:30:00", duration: 120, attendees: ["sari@sekneg.go.id", "dian@sekneg.go.id"], synced: false },
];

export const mockParticipants: Participant[] = [
  { id: "p1", name: "Dr. Andi Pratama", role: "Pimpinan Rapat", email: "andi@sekneg.go.id", avatarUrl: "" },
  { id: "p2", name: "Sari Dewi, S.Sos.", role: "Sekretaris", email: "sari@sekneg.go.id", avatarUrl: "" },
  { id: "p3", name: "Bambang Susilo", role: "Kepala Divisi TI", email: "bambang@sekneg.go.id", avatarUrl: "" },
  { id: "p4", name: "Dian Kusumawardhani", role: "Analis Kebijakan", email: "dian@sekneg.go.id", avatarUrl: "" },
  { id: "p5", name: "Fajar Nugroho", role: "Staf Hukum", email: "fajar@sekneg.go.id", avatarUrl: "" },
];

export const mockMeetings: Meeting[] = [
  {
    id: "M-2026-001",
    title: "Rapat Koordinasi Evaluasi Program Kerja Triwulan II",
    date: "2026-06-12T09:00:00",
    status: "completed",
    duration: 105,
    location: "Ruang Rapat Utama, Gedung Sekretariat Negara",
    organizerId: "p1",
    tags: ["koordinasi", "evaluasi", "triwulan"],
  },
  {
    id: "M-2026-002",
    title: "Rapat Persiapan Laporan Akhir Tahun",
    date: "2026-06-15T10:00:00",
    status: "in_progress",
    duration: 90,
    location: "Ruang Rapat Lantai 3",
    organizerId: "p1",
    tags: ["laporan", "tahunan", "persiapan"],
  },
  {
    id: "M-2026-003",
    title: "Sosialisasi Sistem Informasi Baru",
    date: "2026-06-20T08:30:00",
    status: "scheduled",
    duration: 120,
    location: "Aula Utama",
    organizerId: "p3",
    tags: ["sosialisasi", "TI", "sistem"],
  },
  {
    id: "M-2026-004",
    title: "Rapat Tim Anggaran dan Perencanaan",
    date: "2026-06-10T13:00:00",
    status: "completed",
    duration: 60,
    location: "Ruang Rapat Anggaran",
    organizerId: "p2",
    tags: ["anggaran", "perencanaan"],
  },
  {
    id: "M-2026-005",
    title: "Bimtek Penyusunan Regulasi",
    date: "2026-06-25T09:00:00",
    status: "scheduled",
    duration: 180,
    location: "Gedung Diklat Lt. 2",
    organizerId: "p5",
    tags: ["bimtek", "regulasi", "hukum"],
  },
];

export const mockTranscripts: Record<string, Transcript> = {
  "M-2026-001": {
    id: "T-2026-001",
    meetingId: "M-2026-001",
    status: "completed",
    lines: [
      { id: "l1", speakerName: "Dr. Andi Pratama", text: "Selamat pagi, terima kasih sudah hadir. Rapat koordinasi hari ini akan membahas evaluasi program kerja triwulan kedua dan persiapan laporan akhir tahun.", timestampMs: 135000 },
      { id: "l2", speakerName: "Dr. Andi Pratama", text: "Saya ingin memulai dengan agenda pertama, yaitu capaian target indikator kinerja utama yang sudah kita tetapkan di awal tahun.", timestampMs: 220000 },
      { id: "l3", speakerName: "Sari Dewi, S.Sos.", text: "Terima kasih, Pak Andi. Dari divisi kami, realisasi anggaran sudah mencapai 72 persen dari total pagu yang dialokasikan. Terdapat beberapa item yang masih dalam proses lelang.", timestampMs: 322000 },
      { id: "l4", speakerName: "Dr. Andi Pratama", text: "Baik, tolong pastikan proses lelang dapat diselesaikan sebelum akhir bulan depan. Kita tidak ingin ada sisa anggaran yang tidak terserap.", timestampMs: 490000 },
      { id: "l5", speakerName: "Bambang Susilo", text: "Dari sisi infrastruktur TI, implementasi sistem baru berjalan sesuai jadwal. Migrasi data ditargetkan selesai pada minggu ketiga bulan depan.", timestampMs: 705000 },
      { id: "l6", speakerName: "Sari Dewi, S.Sos.", text: "Kami juga sudah menyiapkan draf laporan evaluasi untuk disampaikan ke pimpinan. Mohon masukan dari Bapak dan Ibu sekalian sebelum finalisasi.", timestampMs: 930000 },
      { id: "l7", speakerName: "Dian Kusumawardhani", text: "Terkait regulasi, kami masih menunggu revisi dari Kemenkumham. Prosesnya sudah di tahap akhir, tinggal pengesahan.", timestampMs: 1080000 },
      { id: "l8", speakerName: "Dr. Andi Pratama", text: "Saya setuju. Kita akan adakan rapat lanjutan pekan depan untuk membahas draf tersebut. Sekian rapat hari ini, terima kasih atas partisipasinya.", timestampMs: 1350000 },
    ],
  },
};

export const mockSummaries: Record<string, Summary> = {
  "M-2026-001": {
    id: "S-2026-001",
    meetingId: "M-2026-001",
    status: "completed",
    keyPoints: [
      { id: "kp1", description: "Realisasi anggaran mencapai 72% dari total pagu yang dialokasikan, beberapa item masih dalam proses lelang.", category: "Anggaran" },
      { id: "kp2", description: "Implementasi sistem baru berjalan sesuai jadwal, migrasi data ditargetkan selesai minggu ketiga bulan depan.", category: "Infrastruktur TI" },
      { id: "kp3", description: "Draf laporan evaluasi sudah disiapkan dan akan difinalisasi setelah mendapatkan masukan dari pimpinan.", category: "Laporan" },
      { id: "kp4", description: "Regulasi masih menunggu revisi dari Kemenkumham, proses di tahap akhir.", category: "Regulasi" },
    ],
    actionItems: [
      { id: "ai1", description: "Menyelesaikan proses lelang item anggaran yang tersisa", assigneeId: "p2", dueDate: "2026-07-31", status: "in_progress" },
      { id: "ai2", description: "Finalisasi migrasi data sistem baru", assigneeId: "p3", dueDate: "2026-07-21", status: "in_progress" },
      { id: "ai3", description: "Menyusun draf laporan akhir tahun", assigneeId: "p2", dueDate: "2026-08-15", status: "pending" },
      { id: "ai4", description: "Tindak lanjut pengesahan regulasi dari Kemenkumham", assigneeId: "p5", dueDate: "2026-07-14", status: "pending" },
    ],
    decisions: [
      { id: "dc1", description: "Rapat lanjutan akan diadakan pekan depan untuk membahas draf laporan evaluasi.", date: "2026-06-12" },
      { id: "dc2", description: "Proses lelang harus diselesaikan sebelum akhir bulan depan untuk menghindari sisa anggaran.", date: "2026-06-12" },
      { id: "dc3", description: "Laporan akhir tahun harus sudah diserahkan paling lambat pertengahan Agustus.", date: "2026-06-12" },
    ],
  },
};

export const mockAuditLogs: AuditLogEntry[] = Array.from({ length: 25 }, (_, i) => {
  const actions = ["auth.login", "meeting.create", "transcript.edit", "export.create", "member.invite", "minutes.approve", "auth.logout", "settings.update", "meeting.view", "search.perform"];
  const action = actions[i % actions.length];
  const isAuth = action.startsWith("auth");
  return {
    id: `audit-${i + 1}`,
    action,
    actorEmail: ["andi@sekneg.go.id", "sari@sekneg.go.id", "bambang@sekneg.go.id", "dian@sekneg.go.id"][i % 4],
    actorName: ["Dr. Andi Pratama", "Sari Dewi, S.Sos.", "Bambang Susilo", "Dian Kusumawardhani"][i % 4],
    resourceType: isAuth ? undefined : action.includes("meeting") ? "meeting" : action.includes("transcript") ? "transcript" : action.includes("minutes") ? "minutes" : undefined,
    resourceId: isAuth ? undefined : ["M-2026-001", "M-2026-002", "M-2026-004"][i % 3],
    metadata: undefined,
    createdAt: new Date(Date.now() - i * 3600000 - Math.random() * 7200000).toISOString(),
  };
});

export const mockAnalytics = {
  totalMeetings: 12,
  totalHours: 28.5,
  averageDuration: 95,
  completionRate: 75,
  topCategories: [
    { name: "Koordinasi", count: 5 },
    { name: "Anggaran", count: 3 },
    { name: "Regulasi", count: 2 },
    { name: "Infrastruktur", count: 2 },
  ],
  monthlyTrend: [
    { month: "Jan", meetings: 2 },
    { month: "Feb", meetings: 1 },
    { month: "Mar", meetings: 3 },
    { month: "Apr", meetings: 2 },
    { month: "May", meetings: 2 },
    { month: "Jun", meetings: 2 },
  ],
  participantStats: [
    { name: "Dr. Andi Pratama", meetings: 10, speakingTime: 45 },
    { name: "Sari Dewi, S.Sos.", meetings: 8, speakingTime: 25 },
    { name: "Bambang Susilo", meetings: 6, speakingTime: 18 },
    { name: "Dian Kusumawardhani", meetings: 5, speakingTime: 12 },
  ],
};

export const mockVideoConnections: VideoConferenceConnection[] = [
  { id: "vc-1", provider: "zoom", name: "Sekretariat Negara RI", email: "admin@sekneg.go.id", connected: true, connectedAt: "2026-06-15T09:00:00", autoRecord: true, lastSyncAt: "2026-07-06T17:00:00" },
  { id: "vc-2", provider: "google_meet", name: "Andi Pratama", email: "andi@sekneg.go.id", connected: true, connectedAt: "2026-06-20T10:00:00", autoRecord: false, lastSyncAt: "2026-07-05T16:30:00" },
  { id: "vc-3", provider: "teams", name: "Kementerian Dalam Negeri", email: "admin@kemendagri.go.id", connected: false, connectedAt: "2026-06-01T08:00:00", autoRecord: false },
];
