import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const data = await prisma.meeting.groupBy({
      by: ["meetingType"],
      where: { organizationId: payload.organizationId, isDeleted: false, meetingType: { not: null } },
      _count: true,
    });

    return NextResponse.json({ success: true, data: data.map((d) => ({ type: d.meetingType, count: d._count })) });
  } catch (error) {
    console.error("Analytics categories error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
