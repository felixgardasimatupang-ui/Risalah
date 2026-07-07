import { NextResponse } from "next/server";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const { message, model, meeting_ids } = await request.json();
    if (!message) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Message required" } }, { status: 400 });

    const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL ?? "http://localhost:8000";

    const aiRes = await fetch(`${AI_SERVICE_URL}/api/v1/chat/ask/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: "stream",
        message,
        model: model ?? "free-developer",
        meeting_ids,
      }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ success: false, error: { code: "AI_ERROR", message: "AI service error" } }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "text/event-stream");
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");

    return new Response(aiRes.body, { headers });
  } catch (error) {
    console.error("Stream chat error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
