import { defineConfig, devices } from "@playwright/test";

// Lightweight Playwright setup tuned for CI: chromium only, retries on CI,
// reuses an already-running dev server when one is up locally. The full
// "smoke" suite is what gates auto-merge — it must stay under ~1 min wall time.
//
// PLAYWRIGHT_BASE_URL targets an already-deployed environment (e.g. a Vercel
// preview) instead of localhost. When it's set, `webServer` is omitted
// entirely — not just skipped via reuseExistingServer — so Playwright never
// spins up a local `npm run start` that nothing points at and never masks a
// real network failure behind its 60s startup timeout.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: "npm run start",
          url: "http://localhost:3000",
          // JAMAIS de reprise d'un serveur deja lance. Mesure du 2026-08-20 :
          // avec `!process.env.CI`, un `next start` reste ecoute sur le port et
          // Playwright le REUTILISE apres un rebuild -- la suite teste alors
          // l'ancien build, en silence. Une preuve par le rouge est passee
          // verte pour cette raison exacte. Ca compte surtout pour la garde
          // nocturne, qui tourne sur le VPS sans `CI` et heritait du piege.
          reuseExistingServer: false,
          timeout: 60_000,
          stdout: "ignore",
          stderr: "pipe",
        },
      }),
});
