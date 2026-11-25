import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Some sandboxes pre-install a Chromium build outside Playwright's usual
// cache (see CLAUDE.md "Running things in your environment"). Use it only
// when present; everywhere else (CI, a contributor's machine) fall back to
// Playwright's own managed browser from `playwright install`.
const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium";
const executablePath = existsSync(SANDBOX_CHROMIUM)
  ? SANDBOX_CHROMIUM
  : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
