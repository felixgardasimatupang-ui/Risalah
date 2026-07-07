import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload.organizationId) {
      return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const sort = searchParams.get("sort") ?? "date";
    const order = searchParams.get("order") ?? "desc";

    const where: Record<string, unknown> = {
      organizationId: payload.organizationId,
      isDeleted: false,
    };

    if (status) where.status = status;
    if (search) where.title = { contains: search, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) (where.date as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.date as Record<string, unknown>).lte = new Date(dateTo);
    }

    const [meetings, total] = await Promise.all([
      prisma.meeting.findMany({
        where: where as any,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          participants: { select: { id: true, name: true, role: true } },
          _count: { select: { participants: true, audioFiles: true } },
        },
      }),
      prisma.meeting.count({ where: where as any }),
    ]);

    return NextResponse.json({
      success: true,
      data: meetings,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List meetings error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload.organizationId) {
      return NextResponse.json({ success: false, error: { code: "NO_ORGANIZATION", message: "No organization selected" } }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, date, location, meetingType, tags } = body;

    if (!title || !date) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Title and date are required" } }, { status: 400 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        organizationId: payload.organizationId,
        title,
        description,
        date: new Date(date),
        location,
        meetingType,
        tags: tags ?? [],
        organizerId: payload.userId,
      },
    });

    return NextResponse.json({ success: true, data: meeting }, { status: 201 });
  } catch (error) {
    console.error("Create meeting error:", error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
