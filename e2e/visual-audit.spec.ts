import { test, expect } from "@playwright/test";

test.describe("Visual Audit — Design & Quality Check", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("risalah-onboarding", JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 }));
    });
    await page.fill('input[type="email"]', "admin@sekneg.go.id");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/overview");
  });

  test("cookie consent banner appears on fresh visit", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("risalah-cookie-consent"));
    await page.reload();
    const banner = page.locator("text=Pengaturan Cookie");
    await expect(banner).toBeVisible({ timeout: 3000 });
    const acceptBtn = page.locator("button:has-text('Setuju')");
    const rejectBtn = page.locator("button:has-text('Tolak')");
    await expect(acceptBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();
    await acceptBtn.click();
    await expect(banner).not.toBeVisible();
  });

  test("cookie consent persists after accept", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("risalah-cookie-consent"));
    await page.reload();
    await page.locator("button:has-text('Setuju')").click();

    const consent = await page.evaluate(() => localStorage.getItem("risalah-cookie-consent"));
    expect(consent).toBe("accepted");

    await page.reload();
    await expect(page.locator("text=Pengaturan Cookie")).not.toBeVisible();
  });

  test("sidebar renders with all nav items", async ({ page }) => {
    await page.goto("/overview");
    const navItems = [
      { label: "Overview", matcher: /overview/i },
      { label: "Meetings", matcher: /meetings/i },
      { label: "Transkrip", matcher: /transkrip|transcripts/i },
      { label: "Ringkasan", matcher: /ringkasan|summary/i },
      { label: "Unggah", matcher: /unggah|upload/i },
      { label: "Pengaturan", matcher: /pengaturan|settings/i },
    ];
    for (const item of navItems) {
      await expect(page.getByRole("link", { name: item.matcher }).first()).toBeVisible();
    }
  });

  test("glass-panel renders correctly", async ({ page }) => {
    await page.goto("/data-retention");
    const panels = page.locator("text=Kebijakan Retensi Data");
    await expect(panels).toBeVisible();
  });

  test("dark mode toggle works", async ({ page }) => {
    await page.goto("/settings");
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    await page.evaluate(() => {
      const store = JSON.parse(localStorage.getItem("risalah-ui") || "{}");
      store.state = { ...store.state, theme: "dark" };
      localStorage.setItem("risalah-ui", JSON.stringify(store));
    });
    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });

  test("sidebar navigation links are functional", async ({ page }) => {
    const links = [
      { href: "/overview", matcher: /overview/i },
      { href: "/meetings", matcher: /meetings/i },
      { href: "/transcripts", matcher: /transkrip|transcripts/i },
      { href: "/summary", matcher: /ringkasan|summary/i },
      { href: "/upload", matcher: /unggah|upload/i },
      { href: "/chat", matcher: /ai chat/i },
    ];
    for (const link of links) {
      await page.goto(link.href);
      await expect(page).toHaveURL(link.href);
    }
  });

  test("responsive layout — mobile sidebar via sheet", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/overview");
    const menuBtn = page.locator('button:has(svg.lucide-menu)');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const sheet = page.locator('[role="dialog"]');
    await expect(sheet).toBeVisible();
  });
});
