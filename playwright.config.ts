import { defineConfig } from '@playwright/test';

const PORT = 4173;

// Runs against the production build served by `vite preview`, so what is tested is what ships.
// `npm run test:e2e` builds first; CI builds in an earlier step.
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  // A retry would hide a flaky test instead of showing it.
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 420, height: 900 },
    launchOptions: {
      // Lets a machine with a pre-installed Chromium skip `playwright install`.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      // Chromium refuses to start its sandbox as root (containers); everywhere else keep it on.
      args: process.getuid?.() === 0 ? ['--no-sandbox'] : []
    }
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI
  }
});
