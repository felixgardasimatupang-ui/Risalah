import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const authCookie = "risalah-auth";

const PROTECTED_PATHS = [
  "/overview", "/meetings", "/transcripts", "/summary",
  "/analytics", "/settings", "/upload", "/chat",
  "/search", "/notifications", "/speaker", "/export",
  "/live-meeting", "/minutes"
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isProtectedPage = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicApi = pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register");

  const stored = request.cookies.get(authCookie);
  const isAuthenticated = stored?.value
    ? (() => {
        try {
          const parsed = JSON.parse(decodeURIComponent(stored.value));
          return parsed?.state?.isAuthenticated === true;
        } catch {
          return false;
        }
      })()
    : false;

  if (isProtectedPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  if (isApiRoute && !isPublicApi && !isAuthenticated) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' ws: https:; frame-src 'none'; object-src 'none'"
  );
  response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts).*)",
  ],
};
