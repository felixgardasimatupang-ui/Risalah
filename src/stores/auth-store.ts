import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  mfaSetupDate: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string; position?: string; nip?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  enableMfa: (secret: string) => void;
  disableMfa: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      mfaEnabled: false,
      mfaSecret: null,
      mfaSetupDate: null,

      login: async (email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 800));
        if (email.includes("sekneg.go.id")) {
          set({
            user: { id: "p1", name: "Admin SEKNEG", email, role: "Admin" },
            isAuthenticated: true,
          });
          return true;
        }
        return false;
      },

      register: async (data) => {
        await new Promise((r) => setTimeout(r, 800));
        if (!data.email.includes("sekneg.go.id")) {
          return { success: false, error: "Gunakan email @sekneg.go.id" };
        }
        set({
          user: { id: "p1", name: data.name, email: data.email, role: "Admin" },
          isAuthenticated: true,
        });
        return { success: true };
      },

      enableMfa: (secret) => {
        set({ mfaEnabled: true, mfaSecret: secret, mfaSetupDate: new Date().toISOString() });
      },

      disableMfa: () => {
        set({ mfaEnabled: false, mfaSecret: null, mfaSetupDate: null });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, mfaEnabled: false, mfaSecret: null, mfaSetupDate: null });
      },
    }),
    { name: "risalah-auth" },
  ),
);
