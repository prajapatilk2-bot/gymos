import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@gymos.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";

test("login, see dashboard placeholder, then logout", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  const main = page.getByRole("main");
  await expect(main.getByText("Main Dashboard")).toBeVisible();
  await expect(main.getByText(/Planned for Phase/)).toBeVisible();

  await page.getByTestId("user-menu-trigger").click();
  await page.getByTestId("logout-menu-item").click();

  await expect(page).toHaveURL(/\/login/);
});
