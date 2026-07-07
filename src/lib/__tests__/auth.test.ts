import { describe, it, expect } from "vitest";
import { clearAuthCookies, getTokenFromCookie, setTokenCookie, setRefreshTokenCookie } from "@/lib/auth";

describe("Auth utilities", () => {
  it("setTokenCookie returns HttpOnly Secure SameSite cookie", () => {
    const cookie = setTokenCookie("test-token");
    expect(cookie).toContain("token=test-token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Max-Age=900");
  });

  it("setRefreshTokenCookie returns cookie with path /api/auth", () => {
    const cookie = setRefreshTokenCookie("refresh-token");
    expect(cookie).toContain("Path=/api/auth");
    expect(cookie).toContain("Max-Age=604800");
  });

  it("clearAuthCookies returns expired cookies", () => {
    const cookies = clearAuthCookies();
    expect(cookies).toHaveLength(2);
    cookies.forEach((c) => expect(c).toContain("Max-Age=0"));
  });

  it("getTokenFromCookie extracts token from cookie header", () => {
    const request = new Request("http://localhost", {
      headers: { cookie: "token=abc123; other=val" },
    });
    const token = getTokenFromCookie(request);
    expect(token).toBe("abc123");
  });

  it("getTokenFromCookie returns null when no token cookie", () => {
    const request = new Request("http://localhost", {
      headers: { cookie: "other=val" },
    });
    expect(getTokenFromCookie(request)).toBeNull();
  });

  it("getTokenFromCookie returns null when no cookies", () => {
    const request = new Request("http://localhost");
    expect(getTokenFromCookie(request)).toBeNull();
  });
});

describe("JWT token signing and verification", () => {
  it("signs and verifies a token", async () => {
    const { signToken, verifyToken } = await import("@/lib/auth");
    const payload = { userId: "u1", email: "test@sekneg.go.id", role: "admin" };
    const token = await signToken(payload);
    expect(token).toBeTruthy();

    const verified = await verifyToken(token);
    expect(verified.userId).toBe("u1");
    expect(verified.email).toBe("test@sekneg.go.id");
    expect(verified.role).toBe("admin");
  });

  it("signs and verifies refresh tokens with long expiration", async () => {
    const { signRefreshToken, verifyToken } = await import("@/lib/auth");
    const payload = { userId: "u1", email: "test@sekneg.go.id" };
    const token = await signRefreshToken(payload);
    const verified = await verifyToken(token);
    expect(verified.userId).toBe("u1");
  });
});
