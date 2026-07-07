import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const data = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', date) as month,
        COUNT(*)::int as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int as in_progress,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END)::int as scheduled
      FROM "Meeting"
      WHERE "organizationId" = ${payload.organizationId}
        AND "isDeleted" = false
        AND date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Analytics timeline error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
