export type Role = "super_admin" | "admin" | "member" | "viewer";

export type Permission =
  | "meeting:create"
  | "meeting:read"
  | "meeting:update"
  | "meeting:delete"
  | "transcript:read"
  | "transcript:edit"
  | "summary:read"
  | "summary:edit"
  | "minutes:create"
  | "minutes:approve"
  | "member:invite"
  | "member:manage"
  | "organization:manage"
  | "billing:read"
  | "billing:manage"
  | "settings:read"
  | "settings:manage"
  | "export:create"
  | "audit:read"
  | "ai:configure";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "meeting:create", "meeting:read", "meeting:update", "meeting:delete",
    "transcript:read", "transcript:edit",
    "summary:read", "summary:edit",
    "minutes:create", "minutes:approve",
    "member:invite", "member:manage",
    "organization:manage",
    "billing:read", "billing:manage",
    "settings:read", "settings:manage",
    "export:create",
    "audit:read",
    "ai:configure",
  ],
  admin: [
    "meeting:create", "meeting:read", "meeting:update", "meeting:delete",
    "transcript:read", "transcript:edit",
    "summary:read", "summary:edit",
    "minutes:create", "minutes:approve",
    "member:invite",
    "billing:read",
    "settings:read", "settings:manage",
    "export:create",
    "audit:read",
  ],
  member: [
    "meeting:create", "meeting:read", "meeting:update",
    "transcript:read",
    "summary:read",
    "minutes:create",
    "export:create",
    "settings:read",
  ],
  viewer: [
    "meeting:read",
    "transcript:read",
    "summary:read",
    "settings:read",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role | undefined, permission: Permission): void {
  if (!role || !hasPermission(role, permission)) {
    throw new PermissionError(`Missing permission: ${permission}`);
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}
