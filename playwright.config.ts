import { defineConfig, devices } from "@playwright/test";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://tablekeep:tablekeep@127.0.0.1:5432/tablekeep_test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["line"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "node e2e/support/mock-data-source.mjs",
      url: "http://127.0.0.1:4100/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "pnpm --filter web dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        BASE_URL: "http://localhost:3000",
        BETTER_AUTH_SECRET:
          "tablekeep-browser-secret-at-least-thirty-two-characters",
        GOOGLE_CLIENT_ID: "tablekeep-browser-client",
        GOOGLE_CLIENT_SECRET: "tablekeep-browser-client-secret",
        DATABASE_URL: databaseUrl,
        DATA_SOURCE: "http://127.0.0.1:4100",
        LOG_LEVEL: "warn",
      },
    },
    {
      command: "pnpm --filter docs dev",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      },
    },
  ],
});
