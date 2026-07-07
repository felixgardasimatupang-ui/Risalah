import { describe, it, expect } from "vitest";
import { translations } from "@/lib/i18n";

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

describe("i18n translations", () => {
  it("should have ID and EN translations", () => {
    expect(translations.id).toBeDefined();
    expect(translations.en).toBeDefined();
  });

  it("should resolve dot-path keys in ID", () => {
    const val = getNestedValue(translations.id as unknown as Record<string, unknown>, "auth.login");
    expect(val).toBe("Masuk");
  });

  it("should resolve dot-path keys in EN", () => {
    const val = getNestedValue(translations.en as unknown as Record<string, unknown>, "auth.login");
    expect(val).toBe("Sign In");
  });

  it("should return the path for missing keys", () => {
    const val = getNestedValue(translations.id as unknown as Record<string, unknown>, "nonexistent.key");
    expect(val).toBe("nonexistent.key");
  });

  it("should have matching keys between ID and EN", () => {
    const idKeys = Object.keys(translations.id);
    const enKeys = Object.keys(translations.en);
    expect(idKeys.sort()).toEqual(enKeys.sort());
  });

  it("should contain all nav translation keys", () => {
    const idNav = translations.id.nav;
    expect(idNav.overview).toBe("Overview");
    expect(idNav.meetings).toBe("Meetings");
    expect(idNav.trash).toBe("Sampah");
  });
});
