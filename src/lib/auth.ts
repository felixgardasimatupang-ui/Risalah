import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production"
);

export interface AuthPayload extends JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role?: string;
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as AuthPayload;
}

export function getTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const tokenCookie = cookies.find((c) => c.startsWith("token="));
  return tokenCookie ? tokenCookie.slice(6) : null;
}

const isSecure = process.env.NODE_ENV === "production";

export function setTokenCookie(token: string): string {
  return `token=${token}; HttpOnly${isSecure ? "; Secure" : ""}; SameSite=Strict; Path=/; Max-Age=900`;
}

export function setRefreshTokenCookie(token: string): string {
  return `refresh_token=${token}; HttpOnly${isSecure ? "; Secure" : ""}; SameSite=Strict; Path=/api/auth; Max-Age=604800`;
}

export function clearAuthCookies(): string[] {
  return [
    `token=; HttpOnly${isSecure ? "; Secure" : ""}; SameSite=Strict; Path=/; Max-Age=0`,
    `refresh_token=; HttpOnly${isSecure ? "; Secure" : ""}; SameSite=Strict; Path=/api/auth; Max-Age=0`,
  ];
}
