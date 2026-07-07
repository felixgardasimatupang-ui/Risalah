export type MeetingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type VideoConferenceProvider = "zoom" | "google_meet" | "teams";

export interface VideoConferenceConnection {
  id: string;
  provider: VideoConferenceProvider;
  name: string;
  email: string;
  connected: boolean;
  connectedAt: string;
  autoRecord: boolean;
  lastSyncAt?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  status: MeetingStatus;
  duration: number;
  location: string;
  organizerId: string;
  meetingType?: string;
  tags: string[];
}

export interface TranscriptLine {
  id: string;
  speakerName: string;
  text: string;
  timestampMs: number;
}

export interface Transcript {
  id: string;
  meetingId: string;
  status: "processing" | "completed" | "failed";
  lines: TranscriptLine[];
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl: string;
}

export interface KeyPoint {
  id: string;
  description: string;
  category: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed";
}

export interface Decision {
  id: string;
  description: string;
  date: string;
}

export type NotificationType = "new_meeting" | "transcript_ready" | "summary_ready" | "action_item_due" | "mention";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  meetingId?: string;
  read: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  memberCount: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorEmail: string;
  actorName: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  organizationId?: string;
}

export interface Invite {
  id: string;
  email: string;
  role: "admin" | "member" | "viewer";
  status: "pending" | "accepted" | "expired";
  invitedBy: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastDigits: string;
  role: string;
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  duration: number;
  meetingId?: string;
  description?: string;
  attendees: string[];
  synced: boolean;
}

export interface Summary {
  id: string;
  meetingId: string;
  status: "processing" | "completed" | "failed";
  keyPoints: KeyPoint[];
  actionItems: ActionItem[];
  decisions: Decision[];
}
