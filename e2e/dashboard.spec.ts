import { test, expect } from "@playwright/test";

test.describe("Dashboard Pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@sekneg.go.id");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/overview");
  });

  test("overview shows stat cards", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Overview");
  });

  test("meetings page shows meeting list", async ({ page }) => {
    await page.goto("/meetings");
    await expect(page.locator("h1")).toContainText("Meetings");
  });

  test("transcripts page accessible", async ({ page }) => {
    await page.goto("/transcripts");
    await expect(page.locator("h1")).toContainText("Transcripts");
  });

  test("summary page accessible", async ({ page }) => {
    await page.goto("/summary");
    await expect(page.locator("h1")).toContainText("Summary");
  });

  test("analytics page shows charts", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.locator("h1")).toContainText("Analytics");
  });

  test("settings page shows tabs", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1")).toContainText("Settings");
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/overview");
    await page.click('a[href="/meetings"]');
    await expect(page).toHaveURL("/meetings");
  });

  test("upload page shows drag and drop area", async ({ page }) => {
    await page.goto("/upload");
    await expect(page.locator("h1")).toContainText("Upload");
  });

  test("chat page is accessible", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.locator("h1")).toContainText("AI Chat");
  });

  test("search page has input", async ({ page }) => {
    await page.goto("/search");
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });
});
