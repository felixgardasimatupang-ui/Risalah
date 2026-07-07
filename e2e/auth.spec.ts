import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL("/login");
  });

  test("shows login page with valid form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Masuk");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@sekneg.go.id");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/overview");
    await expect(page.locator("h1")).toContainText("Overview");
  });

  test("login with invalid email stays on login page", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "user@gmail.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/login");
  });

  test("redirects authenticated user from login to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@sekneg.go.id");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/overview");

    await page.goto("/login");
    await expect(page).toHaveURL("/overview");
  });
});
