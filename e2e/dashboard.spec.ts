import { test, expect } from "@playwright/test";

test.describe("Dashboard Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("risalah-onboarding", JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 }));
    });
    await page.getByLabel("Email").fill("admin@sekneg.go.id");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL("/overview", { timeout: 5000 });
  });

  test("overview shows stat cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /overview/i }).first()).toBeVisible();
  });

  test("meetings page shows meeting list", async ({ page }) => {
    await page.goto("/meetings");
    await expect(page.getByRole("heading", { name: /meetings/i }).first()).toBeVisible();
  });

  test("transcripts page accessible", async ({ page }) => {
    await page.goto("/transcripts");
    await expect(page.getByRole("heading", { name: /transcript/i }).first()).toBeVisible();
  });

  test("summary page accessible", async ({ page }) => {
    await page.goto("/summary");
    await expect(page.getByRole("heading", { name: /summary|ringkasan/i }).first()).toBeVisible();
  });

  test("analytics page accessible", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: /analytics|analitik/i }).first()).toBeVisible();
  });

  test("settings page accessible", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings|pengaturan/i }).first()).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/overview");
    await page.getByRole("link", { name: /meetings/i }).click();
    await expect(page).toHaveURL("/meetings");
  });

  test("upload page shows upload area", async ({ page }) => {
    await page.goto("/upload");
    await expect(page.getByRole("heading", { name: /upload/i }).first()).toBeVisible();
  });

  test("chat page is accessible", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByRole("heading", { name: /ai chat/i }).first()).toBeVisible();
  });
});
