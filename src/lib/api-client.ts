import {
  mockMeetings,
  mockTranscripts,
  mockSummaries,
  mockParticipants,
  mockAnalytics,
  mockOrganizations,
  mockInvites,
  mockCalendarEvents,
} from "./mock-data";
import type { Meeting, Transcript, Summary, Participant, Organization, Invite, CalendarEvent } from "@/types/meeting";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const api = {
  async getMeetings(page = 1, pageSize = 20): Promise<PaginatedResult<Meeting>> {
    await delay(300);
    const start = (page - 1) * pageSize;
    return {
      data: mockMeetings.slice(start, start + pageSize),
      total: mockMeetings.length,
      page,
      pageSize,
    };
  },

  async getMeeting(id: string): Promise<Meeting | null> {
    await delay(200);
    return mockMeetings.find((m) => m.id === id) ?? null;
  },

  async getTranscript(meetingId: string): Promise<Transcript | null> {
    await delay(250);
    return mockTranscripts[meetingId] ?? null;
  },

  async getSummary(meetingId: string): Promise<Summary | null> {
    await delay(250);
    return mockSummaries[meetingId] ?? null;
  },

  async getParticipants(): Promise<Participant[]> {
    await delay(150);
    return mockParticipants;
  },

  async getAnalytics() {
    await delay(350);
    return mockAnalytics;
  },

  async getOrganizations(): Promise<Organization[]> {
    await delay(200);
    return mockOrganizations;
  },

  async getInvites(): Promise<Invite[]> {
    await delay(200);
    return mockInvites;
  },

  async sendInvite(email: string, role: string): Promise<Invite> {
    await delay(400);
    const invite: Invite = {
      id: `inv-${Date.now()}`,
      email,
      role: role as Invite["role"],
      status: "pending",
      invitedBy: "admin@sekneg.go.id",
      createdAt: new Date().toISOString(),
    };
    mockInvites.push(invite);
    return invite;
  },

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    await delay(250);
    return mockCalendarEvents;
  },

  async syncCalendarEvent(id: string): Promise<CalendarEvent> {
    await delay(500);
    const event = mockCalendarEvents.find((e) => e.id === id);
    if (event) event.synced = true;
    return event!;
  },

  async createCalendarEvent(data: { title: string; date: string; duration: number; attendees: string[]; meetingId?: string }): Promise<CalendarEvent> {
    await delay(400);
    const event: CalendarEvent = {
      id: `cal-${Date.now()}`,
      ...data,
      description: "",
      synced: true,
    };
    mockCalendarEvents.push(event);
    return event;
  },

  async getOverviewStats() {
    await delay(200);
    const completed = mockMeetings.filter((m) => m.status === "completed").length;
    const totalHours = mockMeetings
      .filter((m) => m.status === "completed" || m.status === "in_progress")
      .reduce((acc, m) => acc + m.duration, 0) / 60;
    const pendingSummaries = mockMeetings.filter((m) => m.status === "completed").length - Object.keys(mockSummaries).length;
    return {
      totalMeetings: mockMeetings.length,
      totalHours: Math.round(totalHours * 10) / 10,
      completedMeetings: completed,
      pendingSummaries,
      actionItemsOpen: Object.values(mockSummaries).reduce(
        (acc, s) => acc + s.actionItems.filter((a) => a.status !== "completed").length,
        0,
      ),
    };
  },
};
