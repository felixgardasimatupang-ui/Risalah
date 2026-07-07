import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/middleware/auth-guard";
import { generateMfaSecret } from "@/lib/mfa";
import { recordAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const result = await guardRoute(request, { rateLimit: true });
  if (result instanceof Response) return result;

  const mfaSecret = await generateMfaSecret(result.payload.email);

  recordAudit({
    action: "auth.mfa_enable",
    actorId: result.payload.userId,
    actorEmail: result.payload.email,
    organizationId: result.payload.organizationId,
  });

  return NextResponse.json({ success: true, data: mfaSecret });
}
