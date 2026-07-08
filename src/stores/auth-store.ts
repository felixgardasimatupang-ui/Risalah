import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  nip: string | null;
  position: string | null;
  avatarUrl: string | null;
  organization: { id: string; name: string; slug: string } | null;
  role: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { fullName: string; email: string; password: string; position?: string; nip?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const json = await res.json();
          if (!json.success) {
            return { success: false, error: json.error?.message || "Login gagal" };
          }
          set({
            user: json.data,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch {
          return { success: false, error: "Terjadi kesalahan. Coba lagi." };
        }
      },

      register: async (data) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (!json.success) {
            return { success: false, error: json.error?.message || "Registrasi gagal" };
          }
          set({
            user: json.data,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch {
          return { success: false, error: "Terjadi kesalahan. Coba lagi." };
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // proceed even if API fails
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      fetchUser: async () => {
        try {
          const res = await fetch("/api/auth/me");
          if (!res.ok) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          const json = await res.json();
          if (json.success) {
            set({ user: json.data, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "risalah-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          state.fetchUser();
        } else if (state) {
          state.isLoading = false;
        }
      },
    },
  ),
);
