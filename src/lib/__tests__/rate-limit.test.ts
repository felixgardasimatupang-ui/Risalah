import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows requests within limit", () => {
    const result = checkRateLimit("test-key", { windowMs: 60000, max: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("allows multiple requests up to max", () => {
    const config = { windowMs: 60000, max: 3 };
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit("multi-key", config);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks requests exceeding max", () => {
    const config = { windowMs: 60000, max: 2 };
    checkRateLimit("block-key", config);
    checkRateLimit("block-key", config);
    const result = checkRateLimit("block-key", config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const config = { windowMs: 50, max: 1 };
    checkRateLimit("reset-key", config);
    await new Promise((r) => setTimeout(r, 60));
    const result = checkRateLimit("reset-key", config);
    expect(result.allowed).toBe(true);
  });

  it("uses default config when none provided", () => {
    const result = checkRateLimit("default-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });
});
