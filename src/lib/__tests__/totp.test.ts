import { describe, it, expect } from "vitest";
import { createSecret, generateTOTPUri, verifyTOTP } from "@/lib/totp";

describe("TOTP", () => {
  it("creates a base32 secret of correct length", () => {
    const secret = createSecret();
    expect(secret).toBeTruthy();
    expect(secret.length).toBe(32);
    expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true);
  });

  it("generates valid otpauth URI", () => {
    const secret = createSecret();
    const uri = generateTOTPUri({
      secret,
      email: "user@sekneg.go.id",
      issuer: "Risalah SEKNEG",
    });
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=");
    expect(uri).toContain("issuer=Risalah%20SEKNEG");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });

  it("verifies correct token within valid window", async () => {
    const secret = createSecret();
    const token = "123456";
    const result = await verifyTOTP({ secret, token });
    expect(result).toBe(false);
  });

  it("rejects invalid token", async () => {
    const result = await verifyTOTP({ secret: createSecret(), token: "000000" });
    expect(result).toBe(false);
  });

  it("creates secrets of custom length", () => {
    const secret = createSecret(32);
    expect(secret.length).toBeGreaterThan(32);
  });
});
