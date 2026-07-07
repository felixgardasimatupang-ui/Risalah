import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return unauthorized();

    const payload = await verifyToken(token);
    if (!payload.organizationId) return noOrg();

    const orgId = payload.organizationId;

    const [
      totalMeetings,
      completedMeetings,
      totalParticipants,
      recentMeetings,
      monthlyData,
      statusCounts,
    ] = await Promise.all([
      prisma.meeting.count({ where: { organizationId: orgId, isDeleted: false } }),
      prisma.meeting.count({ where: { organizationId: orgId, isDeleted: false, status: "completed" } }),
      prisma.participant.count({
        where: { meeting: { organizationId: orgId, isDeleted: false } },
      }),
      prisma.meeting.findMany({
        where: { organizationId: orgId, isDeleted: false },
        orderBy: { date: "desc" },
        take: 5,
        select: { id: true, title: true, date: true, status: true, durationMinutes: true },
      }),
      prisma.$queryRaw`
        SELECT
          DATE_TRUNC('month', date) as month,
          COUNT(*)::int as count
        FROM "Meeting"
        WHERE "organizationId" = ${orgId}
          AND "isDeleted" = false
          AND date >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', date)
        ORDER BY month ASC
      `,
      prisma.meeting.groupBy({
        by: ["status"],
        where: { organizationId: orgId, isDeleted: false },
        _count: true,
      }),
    ]);

    const totalDuration = (await prisma.meeting.aggregate({
      where: { organizationId: orgId, isDeleted: false },
      _sum: { durationMinutes: true },
    }))._sum.durationMinutes ?? 0;

    const avgDuration = totalMeetings > 0 ? Math.round(totalDuration / totalMeetings) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalMeetings,
        completedMeetings,
        totalParticipants,
        avgDuration,
        totalDurationHours: Math.round(totalDuration / 60),
        recentMeetings,
        monthlyTrend: monthlyData,
        statusDistribution: statusCounts.map((s: any) => ({ status: s.status, count: s._count })),
      },
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

function unauthorized() {
  return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
}
function noOrg() {
  return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });
}
