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
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));

    const summaries = await prisma.summary.findMany({
      where: { meeting: { organizationId: payload.organizationId, isDeleted: false } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        meeting: { select: { id: true, title: true, date: true } },
        keyPoints: true,
        actionItems: { where: { status: { not: "completed" } } },
        _count: { select: { keyPoints: true, actionItems: true, decisions: true } },
      },
    });

    const total = await prisma.summary.count({
      where: { meeting: { organizationId: payload.organizationId, isDeleted: false } },
    });

    return NextResponse.json({
      success: true,
      data: summaries,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List summaries error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
