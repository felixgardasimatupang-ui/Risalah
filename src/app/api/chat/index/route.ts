import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8000";

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const { meetingId } = await request.json();
    if (!meetingId) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "meetingId required" } }, { status: 400 });

    const transcript = await prisma.transcript.findUnique({
      where: { meetingId },
      include: {
        lines: { orderBy: { timestampMs: "asc" } },
        meeting: { select: { title: true, organizationId: true } },
      },
    });

    if (!transcript || transcript.status !== "completed") {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Transcript not found or not completed" } }, { status: 404 });
    }

    const textChunks = transcript.lines.map((line) => ({
      text: `[${line.speakerName}] ${line.text}`,
      source: transcript.meeting.title,
      line_id: line.id,
      speaker: line.speakerName,
    }));

    const aiRes = await fetch(`${AI_SERVICE_URL}/api/v1/chat/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meeting_id: meetingId, text_chunks: textChunks }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ success: false, error: { code: "AI_ERROR", message: "Indexing failed" } }, { status: 502 });
    }

    const aiData = await aiRes.json();
    return NextResponse.json({ success: true, data: aiData });
  } catch (error) {
    console.error("Index chat error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
