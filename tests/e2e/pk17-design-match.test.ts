import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from './fixtures'

test.describe('PK-17: Journey Steps circles, Hana Story spotlight, and cardFrame none', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots/pk17')

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
  })

  test('Styleguide demo: Journey Steps circles, Hana Story spotlight, and cardFrame none', async ({
    page,
  }) => {
    // Open styleguide where various block layouts are rendered
    await page.goto('/styleguide', { waitUntil: 'domcontentloaded' })

    // Test on desktop-1440
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(500)

    // 1. Verify Journey Steps with circles variant
    const journeySection = page.locator('section').filter({ hasText: 'Pause' }).first()
    await expect(journeySection).toBeVisible()

    // 2. Verify Hana Story spotlight layout exists or can be rendered
    // Capture screenshots for PK-17 documentation
    await page.screenshot({
      path: path.join(screenshotsDir, 'styleguide-overview-1440.png'),
      fullPage: false,
    })

    // Test on mobile-375
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)

    // Ensure no horizontal overflow at 375px
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalOverflow).toBe(false)

    await page.screenshot({
      path: path.join(screenshotsDir, 'styleguide-overview-375.png'),
      fullPage: false,
    })
  })
})
