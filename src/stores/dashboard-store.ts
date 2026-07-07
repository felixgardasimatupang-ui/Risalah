import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidgetId =
  | "stat-cards"
  | "meeting-trend"
  | "participant-bars"
  | "recent-meetings"
  | "upcoming-meetings"
  | "action-items"
  | "ai-insights";

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  description: string;
  visible: boolean;
  order: number;
  size: "full" | "half";
}

const defaultWidgets: WidgetConfig[] = [
  { id: "stat-cards", title: "Statistik", description: "Ringkasan angka rapat", visible: true, order: 0, size: "full" },
  { id: "meeting-trend", title: "Tren Rapat", description: "Grafik tren bulanan", visible: true, order: 1, size: "half" },
  { id: "participant-bars", title: "Partisipasi", description: "Kehadiran peserta", visible: true, order: 2, size: "half" },
  { id: "recent-meetings", title: "Rapat Terbaru", description: "Daftar rapat terkini", visible: true, order: 3, size: "full" },
  { id: "upcoming-meetings", title: "Akan Datang", description: "Jadwal rapat selanjutnya", visible: false, order: 4, size: "half" },
  { id: "action-items", title: "Tindak Lanjut", description: "Action items yang belum selesai", visible: false, order: 5, size: "half" },
  { id: "ai-insights", title: "AI Insights", description: "Wawasan dari AI", visible: false, order: 6, size: "full" },
];

interface DashboardStore {
  widgets: WidgetConfig[];
  setWidgets: (widgets: WidgetConfig[]) => void;
  toggleWidget: (id: WidgetId) => void;
  reorderWidgets: (fromIndex: number, toIndex: number) => void;
  resetWidgets: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      widgets: defaultWidgets,
      setWidgets: (widgets) => set({ widgets }),
      toggleWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, visible: !w.visible } : w
          ),
        })),
      reorderWidgets: (fromIndex, toIndex) =>
        set((state) => {
          const widgets = [...state.widgets];
          const [moved] = widgets.splice(fromIndex, 1);
          widgets.splice(toIndex, 0, moved);
          return {
            widgets: widgets.map((w, i) => ({ ...w, order: i })),
          };
        }),
      resetWidgets: () => set({ widgets: defaultWidgets }),
    }),
    { name: "dashboard-widgets" }
  )
);
