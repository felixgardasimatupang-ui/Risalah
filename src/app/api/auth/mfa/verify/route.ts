import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/middleware/auth-guard";
import { verifyMfaToken } from "@/lib/mfa";

export async function POST(request: Request) {
  const result = await guardRoute(request, { rateLimit: true });
  if (result instanceof Response) return result;

  const { secret, token } = await request.json();

  if (!secret || !token) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Secret and token are required" } },
      { status: 400 }
    );
  }

  const isValid = await verifyMfaToken(secret, token);

  return NextResponse.json({ success: true, data: { valid: isValid } });
}
