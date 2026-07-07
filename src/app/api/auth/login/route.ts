import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken, setTokenCookie, setRefreshTokenCookie } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const membership = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: { organization: { select: { id: true, name: true, slug: true } } },
    });

    const payload = {
      userId: user.id,
      email: user.email,
      organizationId: membership?.organization.id,
      role: membership?.role ?? "member",
    };

    const token = await signToken(payload);
    const refreshToken = await signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        nip: user.nip,
        position: user.position,
        avatarUrl: user.avatarUrl,
        organization: membership?.organization ?? null,
        role: membership?.role ?? null,
      },
    });

    response.headers.append("Set-Cookie", setTokenCookie(token));
    response.headers.append("Set-Cookie", setRefreshTokenCookie(refreshToken));

    const forwarded = request.headers.get("x-forwarded-for");
    recordAudit({
      action: "auth.login",
      actorId: user.id,
      actorEmail: user.email,
      organizationId: payload.organizationId,
      ip: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
