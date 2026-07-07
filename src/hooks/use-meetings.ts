"use client";

import { useEffect } from "react";
import { useMeetingStore } from "@/stores/meeting-store";

export function useMeetings() {
  const { meetings, totalMeetings, isLoading, error, fetchMeetings } = useMeetingStore();

  useEffect(() => {
    if (meetings.length === 0) {
      fetchMeetings();
    }
  }, [meetings.length, fetchMeetings]);

  return { meetings, totalMeetings, isLoading, error, refetch: fetchMeetings };
}

export function useMeeting(id: string) {
  const { selectedMeeting, isLoading, error, fetchMeeting, fetchTranscript, fetchSummary } = useMeetingStore();

  useEffect(() => {
    fetchMeeting(id);
    fetchTranscript(id);
    fetchSummary(id);
  }, [id, fetchMeeting, fetchTranscript, fetchSummary]);

  return { meeting: selectedMeeting, isLoading, error };
}
