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
        p.name,
        p.role,
        COUNT(DISTINCT p."meetingId")::int as meeting_count
      FROM "Participant" p
      JOIN "Meeting" m ON m.id = p."meetingId"
      WHERE m."organizationId" = ${payload.organizationId}
        AND m."isDeleted" = false
      GROUP BY p.name, p.role
      ORDER BY meeting_count DESC
      LIMIT 20
    `;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Analytics participants error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
