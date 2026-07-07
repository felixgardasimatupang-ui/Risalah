import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const sessions = await prisma.chatSession.findMany({
      where: { userId: payload.userId, isActive: true },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("List chat sessions error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const { meetingId, title, contextType } = await request.json();

    const session = await prisma.chatSession.create({
      data: {
        organizationId: payload.organizationId,
        userId: payload.userId,
        meetingId,
        title: title ?? "New Chat",
        contextType: contextType ?? "meeting",
        contextId: meetingId,
      },
    });

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (error) {
    console.error("Create chat session error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
