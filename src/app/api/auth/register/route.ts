import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, signRefreshToken, setTokenCookie, setRefreshTokenCookie } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, nip, position, organizationName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email, password, and full name are required" } },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "EMAIL_EXISTS", message: "Email already registered" } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, passwordHash, fullName, nip, position },
    });

    let organization;
    if (organizationName) {
      const slug = organizationName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      organization = await prisma.organization.create({
        data: { name: organizationName, slug },
      });

      await prisma.organizationMember.create({
        data: { organizationId: organization.id, userId: user.id, role: "admin" },
      });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      organizationId: organization?.id,
      role: "admin",
    };

    const token = await signToken(payload);
    const refreshToken = await signRefreshToken(payload);

    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organization: organization ?? null,
      },
    });

    response.headers.append("Set-Cookie", setTokenCookie(token));
    response.headers.append("Set-Cookie", setRefreshTokenCookie(refreshToken));

    const forwarded = request.headers.get("x-forwarded-for");
    recordAudit({
      action: "auth.register",
      actorId: user.id,
      actorEmail: user.email,
      organizationId: organization?.id,
      ip: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
