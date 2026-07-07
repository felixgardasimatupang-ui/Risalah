import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  language: "id" | "en";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setLanguage: (lang: "id" | "en") => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      language: "id",

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "risalah-ui" },
  ),
);
