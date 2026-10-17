import { test } from '@playwright/test'
import { expectNoSeriousA11y } from './helpers/a11y'

/**
 * T1-17e & T3-06a: Automated Accessibility Spec using Axe Core Playwright
 *
 * Scans key public routes against WCAG 2.0 / 2.1 Level A and AA tags.
 * Runs on both desktop-1440 and mobile-375 projects defined in playwright.config.ts.
 * Fails when any 'serious' or 'critical' violations are detected.
 *
 * NOTE: Does NOT use networkidle because pages load Turnstile / live scripts.
 *
 * ROUTE AUDIT FOR UNSEEDED CI DB:
 * - Scanned static routes (200 OK on unseeded DB):
 *   - `/` (Home): has fallback brand UI when DB is unseeded.
 *   - `/thu-vien` (Library): has fallback header and empty state when unseeded.
 *   - `/thu-vien?tab=noi-dung`: fallback header, tabs, search bar, empty state card.
 *   - `/habit/chan-doan` (Diagnostic Quiz): renders quiz shell with empty question notification.
 *   - `/coaching/growth-mirror` & `/gia-thanh-toan`: renders full Puck/Legal layout when seeded, shell 404 fallback when unseeded.
 *   - `/habit/5-phut`: renders 4-step habit loop wizard with fallback steps.
 *   - `/eq-buddy`: renders EQ buddy landing with fallback cards when DB is unseeded.
 *   - `/eq-buddy/rut-the`: renders EQ card draw wizard with fallback deck.
 *   - `/tai-khoan/dang-nhap`: renders customer login form with OTP request.
 *   - `/nhac-lich/huy`: renders reminder opt-out form with invalid token notice.
 *
 * - Evaluated & Skipped on unseeded scan (audited in connected E2E journey tests instead):
 *   - `/habit/1-percent-better`: Calls notFound() when product '1-percent-better' is not in DB.
 *     Audited via expectNoSeriousA11y inside tests/e2e/gate-habit-journey.test.ts after seeding.
 *   - `/dung-thu`: Redirects to /tai-khoan/dang-nhap when guest; calls notFound() if ?san-pham is missing.
 *     Audited via expectNoSeriousA11y inside tests/e2e/gate-habit-journey.test.ts.
 *   - `/sap-ra-mat`: Calls notFound() when query param ?san-pham=<slug> is missing.
 *   - `/habit/hoc` & `/habit/tracker`: Requires customer auth + active trial/order.
 *     Audited via expectNoSeriousA11y inside tests/e2e/gate-habit-journey.test.ts.
 *   - `/tai-khoan`: Requires customer auth. Audited in journey tests.
 *   - Dynamic catch-all Puck routes (`/ve-hana`, `/doanh-nghiep`, `/coaching`): require DB pages.
 *   - Dynamic legal routes (`/dieu-khoan-su-dung`, etc.): require DB legalPages.
 */

const SCAN_ROUTES = [
  '/',
  '/thu-vien',
  '/thu-vien?tab=noi-dung',
  '/habit/chan-doan',
  '/coaching/growth-mirror',
  '/gia-thanh-toan',
  '/habit/5-phut',
  '/eq-buddy',
  '/eq-buddy/rut-the',
  '/tai-khoan/dang-nhap',
  '/nhac-lich/huy',
]

test.describe('Accessibility Scans (Axe WCAG 2.0 / 2.1 A & AA)', () => {
  for (const route of SCAN_ROUTES) {
    test(`route ${route} has no serious or critical a11y violations`, async ({ page }) => {
      // Load page without networkidle to prevent hanging on Turnstile / analytics / live previews
      await page.goto(route, { waitUntil: 'load' })

      // Ensure main content is attached before scanning
      await page.locator('body').waitFor({ state: 'visible' })

      await expectNoSeriousA11y(page, route)
    })
  }
})
