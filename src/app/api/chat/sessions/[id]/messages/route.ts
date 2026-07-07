import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

interface Citation {
  source: string;
  text: string;
  score: number;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const { id } = await params;
    const { content, model } = await request.json();

    if (!content) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Message content required" } }, { status: 400 });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id, userId: payload.userId, isActive: true },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Session not found" } }, { status: 404 });
    }

    const userMessage = await prisma.chatMessage.create({
      data: { sessionId: id, role: "user", content },
    });

    const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8000";

    const aiRes = await fetch(`${AI_SERVICE_URL}/api/v1/chat/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: id,
        message: content,
        model: model ?? "free-developer",
        meeting_ids: session.meetingId ? [session.meetingId] : undefined,
      }),
    });

    let assistantReply = "Maaf, saya tidak bisa memproses pertanyaan ini saat ini. Silakan coba lagi.";
    let citations: Citation[] = [];

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      assistantReply = aiData.answer ?? assistantReply;
      citations = aiData.citations ?? [];
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: id,
        role: "assistant",
        content: assistantReply,
        metadata: JSON.parse(JSON.stringify({ citations, model_used: model ?? "free-developer" })),
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: userMessage, assistant: assistantMessage, citations },
    });
  } catch (error) {
    console.error("Chat message error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
