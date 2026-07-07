import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookies = clearAuthCookies();
  cookies.forEach((c) => response.headers.append("Set-Cookie", c));
  return response;
}
