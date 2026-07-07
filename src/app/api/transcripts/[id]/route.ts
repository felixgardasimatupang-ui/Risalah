import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload.organizationId) return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });

    const { id } = await params;
    const transcript = await prisma.transcript.findFirst({
      where: { id, meeting: { organizationId: payload.organizationId, isDeleted: false } },
      include: {
        lines: { orderBy: { timestampMs: "asc" } },
        meeting: { select: { id: true, title: true, date: true } },
      },
    });

    if (!transcript) {
      return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Transcript not found" } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: transcript });
  } catch (error) {
    console.error("Get transcript error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
