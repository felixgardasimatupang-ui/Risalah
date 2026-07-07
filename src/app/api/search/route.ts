import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") ?? "all";
    const searchMeetingId = searchParams.get("meeting_id");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

    if (!q) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Search query required" } }, { status: 400 });
    }

    const results: Record<string, unknown>[] = [];

    if (type === "meeting" || type === "all") {
      const meetings = await prisma.meeting.findMany({
        where: {
          organizationId: payload.organizationId,
          isDeleted: false,
          title: { contains: q, mode: "insensitive" },
        },
        select: { id: true, title: true, date: true, status: true, meetingType: true },
        take: limit,
      });
      results.push(...meetings.map((m) => ({ ...m, _type: "meeting" })));
    }

    if ((type === "transcript" || type === "all") && !searchMeetingId) {
      const lines = await prisma.transcriptLine.findMany({
        where: {
          transcript: { meeting: { organizationId: payload.organizationId, isDeleted: false } },
          text: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          text: true,
          speakerName: true,
          timestampMs: true,
          transcript: { select: { meeting: { select: { id: true, title: true } } } },
        },
        take: limit,
      });
      results.push(...lines.map((l) => ({ ...l, _type: "transcript_line" })));
    }

    if (searchMeetingId) {
      const lines = await prisma.transcriptLine.findMany({
        where: {
          transcript: { meetingId: searchMeetingId },
          text: { contains: q, mode: "insensitive" },
        },
        select: { id: true, text: true, speakerName: true, timestampMs: true },
        take: limit,
      });
      results.push(...lines.map((l) => ({ ...l, _type: "transcript_line" })));
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
