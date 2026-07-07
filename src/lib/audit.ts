import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.register"
  | "auth.mfa_enable"
  | "auth.mfa_disable"
  | "meeting.create"
  | "meeting.update"
  | "meeting.delete"
  | "meeting.view"
  | "transcript.edit"
  | "summary.edit"
  | "minutes.approve"
  | "minutes.reject"
  | "export.create"
  | "member.invite"
  | "member.remove"
  | "member.role_change"
  | "organization.update"
  | "settings.update"
  | "ai.configure"
  | "search.perform";

export interface AuditEntry {
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  organizationId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry as any });
  } catch (error) {
    console.error("Failed to persist audit log:", error);
  }
}
