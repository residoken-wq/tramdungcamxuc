import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const PORT = process.env.PORT || 3000
const baseURL = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only – once: a real failure repeated twice more only cost time. */
  retries: process.env.CI ? 1 : 0,
  /* Stop CI early: after a few failures later tests usually fail in cascade
     (e.g. a test aborted mid-way leaves its first admin user behind). */
  maxFailures: process.env.CI ? 3 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Fail a missing element in seconds instead of waiting for the whole test timeout
       (3–4 min). Assertions keep their own `expect` timeout. */
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'desktop-1440',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-375',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 375, height: 667 },
      },
    },
  ],
  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: `${baseURL}/admin`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      TZ: 'UTC',
      PGTZ: 'UTC',
    },
  },
})
