import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

// Usa o Chromium já instalado (PLAYWRIGHT_BROWSERS_PATH); no CI, o workflow instala.
export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:8788",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx wrangler pages dev dist --port 8788",
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    url: "http://localhost:8788",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
