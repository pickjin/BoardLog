import { defineConfig } from '@playwright/test';

const APP_PORT = 4173;
const GA_PORT = 4174;

// Runs against production builds served by `vite preview`, so what is tested is what ships.
// `npm run test:e2e` builds first; CI builds in earlier steps.
//  - dist/     the normal build, no measurement id: nothing may reach an analytics service
//  - dist-ga/  the same app built with a fake GA4 id (`npm run build:ga`): checks what GA4 would receive
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  // A retry would hide a flaky test instead of showing it.
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    viewport: { width: 420, height: 900 },
    launchOptions: {
      // Lets a machine with a pre-installed Chromium skip `playwright install`.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      // Chromium refuses to start its sandbox as root (containers); everywhere else keep it on.
      args: process.getuid?.() === 0 ? ['--no-sandbox'] : []
    }
  },
  projects: [
    { name: 'app', testIgnore: /analytics-on\.spec\.ts/, use: { baseURL: `http://localhost:${APP_PORT}` } },
    { name: 'analytics-build', testMatch: /analytics-on\.spec\.ts/, use: { baseURL: `http://localhost:${GA_PORT}` } }
  ],
  webServer: [
    {
      command: `npx vite preview --port ${APP_PORT} --strictPort`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: !process.env.CI
    },
    {
      command: `npx vite preview --outDir dist-ga --port ${GA_PORT} --strictPort`,
      url: `http://localhost:${GA_PORT}`,
      reuseExistingServer: !process.env.CI
    }
  ]
});
