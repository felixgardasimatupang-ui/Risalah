import type { TourStep } from "@/stores/tour-store";

export const overviewTour: TourStep[] = [
  {
    selector: "[data-tour='stat-cards']",
    title: "Ringkasan Statistik",
    content: "Lihat total meeting, jam transkrip, peserta, dan ringkasan AI dalam bentuk kartu statistik.",
    position: "bottom",
  },
  {
    selector: "[data-tour='meeting-trend']",
    title: "Tren Meeting",
    content: "Grafik tren meeting per bulan — lihat pola dan frekuensi rapat dari waktu ke waktu.",
    position: "top",
  },
  {
    selector: "[data-tour='participant-bars']",
    title: "Partisipasi Terbanyak",
    content: "Peserta dengan jumlah rapat terbanyak — identifikasi anggota tim yang paling aktif.",
    position: "left",
  },
];

export const meetingsTour: TourStep[] = [
  {
    selector: "[data-tour='search-bar']",
    title: "Pencarian Meeting",
    content: "Cari meeting berdasarkan judul, tanggal, atau status. Hasil muncul secara real-time.",
    position: "bottom",
  },
  {
    selector: "[data-tour='meeting-list']",
    title: "Daftar Meeting",
    content: "Semua meeting dalam satu daftar. Klik untuk melihat detail, transkrip, dan ringkasan.",
    position: "top",
  },
  {
    selector: "[data-tour='status-badge']",
    title: "Status Meeting",
    content: "Status meeting: Completed (selesai), In Progress (berlangsung), atau Scheduled (dijadwalkan).",
    position: "right",
  },
];

export const transcriptsTour: TourStep[] = [
  {
    selector: "[data-tour='transcript-filter']",
    title: "Filter Transkrip",
    content: "Filter berdasarkan status. Hanya meeting completed yang memiliki transkrip.",
    position: "bottom",
  },
  {
    selector: "[data-tour='transcript-timeline']",
    title: "Timeline Transkrip",
    content: "Setiap baris memiliki timestamp. Klik untuk menavigasi ke momen tertentu dalam rapat.",
    position: "top",
  },
  {
    selector: "[data-tour='speaker-badge']",
    title: "Identifikasi Pembicara",
    content: "Setiap pembicara diidentifikasi dengan badge warna dan nama — hasil dari speaker diarization.",
    position: "right",
  },
];

export const chatTour: TourStep[] = [
  {
    selector: "[data-tour='chat-sessions']",
    title: "Riwayat Chat",
    content: "Semua sesi chat dengan AI. Klik untuk melanjutkan percakapan sebelumnya.",
    position: "right",
  },
  {
    selector: "[data-tour='chat-input']",
    title: "Tanya AI",
    content: "Tanyakan apapun tentang meeting Anda. AI akan menjawab dengan kutipan dari transkrip terkait.",
    position: "top",
  },
  {
    selector: "[data-tour='chat-citations']",
    title: "Kutipan & Referensi",
    content: "Setiap jawaban disertai kutipan langsung dari sumber transkrip untuk verifikasi.",
    position: "left",
  },
];

export const searchTour: TourStep[] = [
  {
    selector: "[data-tour='search-input']",
    title: "Pencarian Semantik",
    content: "Cari kata kunci di semua transkrip. Hasil akan menampilkan konteks relevan.",
    position: "bottom",
  },
  {
    selector: "[data-tour='search-filters']",
    title: "Filter Lanjutan",
    content: "Filter berdasarkan jenis, status, atau rentang tanggal untuk hasil yang lebih spesifik.",
    position: "top",
  },
  {
    selector: "[data-tour='search-results']",
    title: "Hasil Pencarian",
    content: "Klik hasil untuk membuka transkrip lengkap. Kata kunci akan di-highlight.",
    position: "top",
  },
];

export const tourDefinitions: Record<string, TourStep[]> = {
  overview: overviewTour,
  meetings: meetingsTour,
  transcripts: transcriptsTour,
  chat: chatTour,
  search: searchTour,
};
