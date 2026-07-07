import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

async function getMeeting(meetingId: string, organizationId: string) {
  return prisma.meeting.findFirst({
    where: { id: meetingId, organizationId, isDeleted: false },
    include: {
      participants: true,
      audioFiles: true,
      transcript: { include: { lines: { orderBy: { timestampMs: "asc" } } } },
      summary: { include: { keyPoints: true, actionItems: true, decisions: true } },
      minutes: true,
    },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload.organizationId) {
      return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });
    }

    const { id } = await params;
    const meeting = await getMeeting(id, payload.organizationId);

    if (!meeting) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Meeting not found" } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    console.error("Get meeting error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload.organizationId) {
      return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });
    }

    const { id } = await params;
    const existing = await getMeeting(id, payload.organizationId);
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Meeting not found" } }, { status: 404 });
    }

    const body = await request.json();
    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status,
        location: body.location,
        meetingType: body.meetingType,
        tags: body.tags,
      },
    });

    return NextResponse.json({ success: true, data: meeting });
  } catch (error) {
    console.error("Update meeting error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload.organizationId) {
      return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });
    }

    const { id } = await params;
    const existing = await getMeeting(id, payload.organizationId);
    if (!existing) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Meeting not found" } }, { status: 404 });
    }

    await prisma.meeting.update({
      where: { id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete meeting error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
