import { NextResponse } from "next/server";
import { getTokenFromCookie, verifyToken, type AuthPayload } from "@/lib/auth";
import { requirePermission, type Permission, PermissionError } from "@/lib/rbac";
import { recordAudit, type AuditAction } from "@/lib/audit";
import { rateLimitMiddleware } from "@/lib/rate-limit";

interface GuardOptions {
  permission?: Permission;
  audit?: AuditAction;
  rateLimit?: boolean;
}

export async function guardRoute(
  request: Request,
  options: GuardOptions = {}
): Promise<{ payload: AuthPayload } | Response> {
  if (options.rateLimit !== false) {
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  const token = getTokenFromCookie(request);
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  let payload: AuthPayload;
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "TOKEN_EXPIRED", message: "Token expired or invalid" } },
      { status: 401 }
    );
  }

  if (options.permission) {
    try {
      requirePermission(payload.role as any, options.permission);
    } catch (e) {
      if (e instanceof PermissionError) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: e.message } },
          { status: 403 }
        );
      }
      throw e;
    }
  }

  if (options.audit) {
    const forwarded = request.headers.get("x-forwarded-for");
    recordAudit({
      action: options.audit,
      actorId: payload.userId,
      actorEmail: payload.email,
      organizationId: payload.organizationId,
      ip: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  }

  return { payload };
}
