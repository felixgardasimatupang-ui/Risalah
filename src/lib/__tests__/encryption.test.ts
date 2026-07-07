import { describe, it, expect, beforeAll } from "vitest";

describe("Encryption", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = "test-encryption-key-32chars!!";
  });

  it("encrypts and decrypts text correctly", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    const original = "Sensitive data: APBD 2025 Rp 5.000.000.000.000";
    const encrypted = await encrypt(original);
    expect(encrypted).toBeTruthy();
    expect(encrypted).not.toBe(original);

    const decrypted = await decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertexts for same plaintext", async () => {
    const { encrypt } = await import("@/lib/encryption");
    const text = "same data";
    const [a, b] = await Promise.all([encrypt(text), encrypt(text)]);
    expect(a).not.toBe(b);
  });

  it("fails without encryption key", async () => {
    delete process.env.ENCRYPTION_KEY;
    const { encrypt } = await import("@/lib/encryption");
    await expect(encrypt("test")).rejects.toThrow("ENCRYPTION_KEY");
  });
});
