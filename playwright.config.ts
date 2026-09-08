import { defineConfig, devices } from "@playwright/test";

const chromePath = process.env.CHROME_PATH;

const launchOptions = chromePath
  ? { executablePath: chromePath }
  : { channel: "chrome" as const };

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8080",
    headless: process.env.PW_HEADED !== "1",
    ...launchOptions,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
