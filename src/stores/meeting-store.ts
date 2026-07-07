import { create } from "zustand";
import type { Meeting, Transcript, Summary } from "@/types/meeting";
import { api } from "@/lib/api-client";

interface MeetingState {
  meetings: Meeting[];
  totalMeetings: number;
  isLoading: boolean;
  error: string | null;
  selectedMeeting: Meeting | null;
  selectedTranscript: Transcript | null;
  selectedSummary: Summary | null;

  fetchMeetings: () => Promise<void>;
  fetchMeeting: (id: string) => Promise<void>;
  fetchTranscript: (meetingId: string) => Promise<void>;
  fetchSummary: (meetingId: string) => Promise<void>;
}

export const useMeetingStore = create<MeetingState>()((set) => ({
  meetings: [],
  totalMeetings: 0,
  isLoading: false,
  error: null,
  selectedMeeting: null,
  selectedTranscript: null,
  selectedSummary: null,

  fetchMeetings: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.getMeetings();
      set({ meetings: result.data, totalMeetings: result.total, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchMeeting: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const meeting = await api.getMeeting(id);
      set({ selectedMeeting: meeting, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchTranscript: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const transcript = await api.getTranscript(meetingId);
      set({ selectedTranscript: transcript, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchSummary: async (meetingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await api.getSummary(meetingId);
      set({ selectedSummary: summary, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
}));
