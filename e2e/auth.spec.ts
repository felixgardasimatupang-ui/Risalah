import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL("/login");
  });

  test("shows login page with valid form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sekneg/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /masuk/i })).toBeVisible();
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@sekneg.go.id");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page).toHaveURL("/overview", { timeout: 5000 });
  });

  test("login with invalid email shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("user@gmail.com");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: /masuk/i }).click();
    await expect(page.getByText(/email.*sekneg/i)).toBeVisible();
  });
});
