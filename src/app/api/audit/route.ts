import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardRoute } from "@/lib/middleware/auth-guard";

export async function GET(request: Request) {
  const result = await guardRoute(request, { permission: "audit:read" });
  if (result instanceof Response) return result;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "50"));
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const action = searchParams.get("action");
  const actorId = searchParams.get("actor_id");

  const where: Record<string, unknown> = {
    organizationId: result.payload.organizationId,
  };
  if (action) where.action = action;
  if (actorId) where.actorId = actorId;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: where as any,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where: where as any }),
  ]);

  return NextResponse.json({ success: true, data: entries, meta: { total, limit, offset } });
}
