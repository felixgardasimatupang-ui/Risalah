import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromCookie, verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromCookie(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, email: true, fullName: true, nip: true,
        position: true, phone: true, avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const membership = payload.organizationId
      ? await prisma.organizationMember.findFirst({
          where: { userId: user.id, organizationId: payload.organizationId },
          include: { organization: { select: { id: true, name: true, slug: true, type: true } } },
        })
      : null;

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        organization: membership?.organization ?? null,
        role: membership?.role ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      { status: 401 }
    );
  }
}
