import { describe, it, expect } from "vitest";
import { hasPermission, requirePermission, PermissionError } from "@/lib/rbac";

describe("RBAC", () => {
  it("super_admin has all permissions", () => {
    expect(hasPermission("super_admin", "meeting:delete")).toBe(true);
    expect(hasPermission("super_admin", "organization:manage")).toBe(true);
    expect(hasPermission("super_admin", "audit:read")).toBe(true);
    expect(hasPermission("super_admin", "ai:configure")).toBe(true);
    expect(hasPermission("super_admin", "billing:manage")).toBe(true);
  });

  it("admin has management permissions but not billing:manage or ai:configure", () => {
    expect(hasPermission("admin", "meeting:create")).toBe(true);
    expect(hasPermission("admin", "member:invite")).toBe(true);
    expect(hasPermission("admin", "meeting:delete")).toBe(true);
    expect(hasPermission("admin", "audit:read")).toBe(true);
    expect(hasPermission("admin", "billing:manage")).toBe(false);
    expect(hasPermission("admin", "ai:configure")).toBe(false);
  });

  it("member has basic meeting permissions but cannot delete", () => {
    expect(hasPermission("member", "meeting:create")).toBe(true);
    expect(hasPermission("member", "meeting:read")).toBe(true);
    expect(hasPermission("member", "meeting:update")).toBe(true);
    expect(hasPermission("member", "meeting:delete")).toBe(false);
    expect(hasPermission("member", "member:invite")).toBe(false);
  });

  it("viewer has read-only access", () => {
    expect(hasPermission("viewer", "meeting:read")).toBe(true);
    expect(hasPermission("viewer", "transcript:read")).toBe(true);
    expect(hasPermission("viewer", "meeting:create")).toBe(false);
    expect(hasPermission("viewer", "member:invite")).toBe(false);
  });

  it("requirePermission throws for missing permission", () => {
    expect(() => requirePermission("viewer", "meeting:create")).toThrow(PermissionError);
    expect(() => requirePermission("viewer", "meeting:create")).toThrow("Missing permission");
  });

  it("requirePermission does not throw when permission exists", () => {
    expect(() => requirePermission("admin", "meeting:delete")).not.toThrow();
  });

  it("requirePermission throws for undefined role", () => {
    expect(() => requirePermission(undefined, "meeting:read")).toThrow(PermissionError);
  });
});
