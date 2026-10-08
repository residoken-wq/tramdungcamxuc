import { expect, test } from '@playwright/test'

// E2E Test for 5 seed pages created from real Puck blocks (T1-16).
// Assumes seed data has been populated (pnpm seed).
// Tests viewports 375px (mobile) and 1440px (desktop):
// - HTTP status 200 for all 5 pages
// - No horizontal scroll overflow (scrollWidth <= innerWidth)
// - Home page (/) contains both entry points (Cá nhân & Doanh nghiệp)
// - /doanh-nghiep contains the #gui-brief form target
// - Does NOT use networkidle on pages containing forms

const SEED_PAGES = [
  '/',
  '/ve-hana',
  '/coaching',
  '/coaching/growth-mirror',
  '/doanh-nghiep',
] as const

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 667 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const

// Needs `pnpm seed` first. The regular CI e2e run uses an empty database (other specs create
// their own pages, some with the same slugs as the seed), so this spec runs only on request:
//   pnpm seed && E2E_SEEDED=1 pnpm exec playwright test tests/e2e/seed-pages.test.ts
test.skip(!process.env.E2E_SEEDED, 'Chạy sau `pnpm seed` với E2E_SEEDED=1.')

for (const viewport of VIEWPORTS) {
  test.describe(`5 seed pages – viewport: ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
    })

    for (const path of SEED_PAGES) {
      test(`page "${path}" returns 200 and has no horizontal overflow`, async ({ page }) => {
        // Use domcontentloaded instead of networkidle because pages may contain forms / client components
        const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBe(200)

        // Wait for main content to render
        await page.waitForSelector('main', { timeout: 15000 })

        // Check for horizontal overflow
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth
        })
        expect(isOverflowing).toBe(false)
      })
    }

    test('home page (/) contains two entry points (Cá nhân & Doanh nghiệp)', async ({ page }) => {
      const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await page.waitForSelector('main', { timeout: 15000 })

      // Check verbatim texts from AGENTS.md 8.1
      await expect(
        page.getByText('Hiểu mình rõ. Hành động bền bỉ.', { exact: false }).first(),
      ).toBeVisible()
      await expect(
        page.getByText('Tỏa sáng bằng thế mạnh riêng.', { exact: false }).first(),
      ).toBeVisible()

      // Entry 1 (Cá nhân)
      await expect(
        page.getByText('Tôi đang ở một bước chuyển trong sự nghiệp', { exact: false }).first(),
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: 'Khám phá cách Hana đồng hành' }).first(),
      ).toBeVisible()

      // Entry 2 (Doanh nghiệp)
      await expect(
        page.getByText('Tôi muốn việc học tạo ra hành vi thực tế', { exact: false }).first(),
      ).toBeVisible()
      await expect(
        page.getByRole('link', { name: 'Trao đổi về chương trình cho đội ngũ' }).first(),
      ).toBeVisible()
    })

    test('/doanh-nghiep page contains the #gui-brief form section', async ({ page }) => {
      const response = await page.goto('/doanh-nghiep', { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await page.waitForSelector('main', { timeout: 15000 })

      // Verify #gui-brief element exists and is attached
      const briefSection = page.locator('#gui-brief')
      await expect(briefSection).toBeAttached()
      await expect(briefSection).toBeVisible()
    })
  })
}
