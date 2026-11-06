import { defineConfig, devices } from "@playwright/test";

const isCi = Boolean(process.env.CI);
const port = isCi ? 4173 : 5173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  testIgnore:
    process.env.CAPTURE_SCREENSHOTS === "1"
      ? []
      : ["**/capture-screenshots.spec.ts"],
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 2 : undefined,
  reporter: isCi ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: isCi
      ? `npx vite preview --host 127.0.0.1 --port ${port} --mode e2e`
      : `npx vite --host 127.0.0.1 --port ${port} --mode e2e`,
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});
