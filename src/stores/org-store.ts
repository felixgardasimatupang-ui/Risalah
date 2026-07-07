"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api-client";
import type { Organization, Invite } from "@/types/meeting";

interface OrgState {
  organizations: Organization[];
  activeOrg: Organization | null;
  invites: Invite[];
  isLoading: boolean;

  fetchOrganizations: () => Promise<void>;
  setActiveOrg: (org: Organization) => void;
  fetchInvites: () => Promise<void>;
  sendInvite: (email: string, role: string) => Promise<Invite>;
}

export const useOrgStore = create<OrgState>()(
  persist(
    (set, get) => ({
      organizations: [],
      activeOrg: null,
      invites: [],
      isLoading: false,

      fetchOrganizations: async () => {
        set({ isLoading: true });
        const orgs = await api.getOrganizations();
        const state = get();
        set({
          organizations: orgs,
          activeOrg: state.activeOrg ?? orgs[0],
          isLoading: false,
        });
      },

      setActiveOrg: (org: Organization) => {
        set({ activeOrg: org });
      },

      fetchInvites: async () => {
        const invites = await api.getInvites();
        set({ invites });
      },

      sendInvite: async (email: string, role: string) => {
        const invite = await api.sendInvite(email, role);
        set((state) => ({ invites: [...state.invites, invite] }));
        return invite;
      },
    }),
    { name: "risalah-org" },
  ),
);
