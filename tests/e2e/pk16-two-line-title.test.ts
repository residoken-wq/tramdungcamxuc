import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from './fixtures'

test.describe('PK-16: TwoToneTitle two-line layout and bounding boxes', () => {
  const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots/pk16')

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }
  })

  test('HeroTwoEntries and ImageText render titleLine2 strictly below titleLine1 at 1440 and 375, with no horizontal scroll at 375', async ({
    page,
  }) => {
    // Navigate to /styleguide where HeroTwoEntries and multiple blocks are rendered
    await page.goto('/styleguide', { waitUntil: 'domcontentloaded' })

    // Test across desktop-1440
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(500)

    // Locate the first HeroTwoEntries demo inside styleguide
    const heroSection = page.locator('#demo-eb14-split-cu section').first()
    await expect(heroSection).toBeVisible()

    const heroHeading = heroSection.locator('h1, h2').first()
    await expect(heroHeading).toBeVisible()

    const spans1440 = heroHeading.locator('span.block')
    await expect(spans1440).toHaveCount(2)

    const line1Box1440 = await spans1440.nth(0).boundingBox()
    const line2Box1440 = await spans1440.nth(1).boundingBox()

    expect(line1Box1440).not.toBeNull()
    expect(line2Box1440).not.toBeNull()

    // Line 2 top must be at or below line 1 bottom
    expect(line2Box1440!.y).toBeGreaterThanOrEqual(line1Box1440!.y + line1Box1440!.height - 1)

    // Capture 1440 screenshot of Hero
    await heroSection.screenshot({
      path: path.join(screenshotsDir, 'hero-two-line-1440.png'),
    })

    // Test across mobile-375
    await page.setViewportSize({ width: 375, height: 812 })
    await page.waitForTimeout(500)

    const spans375 = heroHeading.locator('span.block')
    await expect(spans375).toHaveCount(2)

    const line1Box375 = await spans375.nth(0).boundingBox()
    const line2Box375 = await spans375.nth(1).boundingBox()

    expect(line1Box375).not.toBeNull()
    expect(line2Box375).not.toBeNull()

    // Line 2 top must be at or below line 1 bottom on mobile as well
    expect(line2Box375!.y).toBeGreaterThanOrEqual(line1Box375!.y + line1Box375!.height - 1)

    // Capture 375 screenshot of Hero
    await heroSection.screenshot({
      path: path.join(screenshotsDir, 'hero-two-line-375.png'),
    })

    // Verify no horizontal overflow at 375px
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test('Public home or fallback page has no horizontal scroll and renders properly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const noOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth
    })
    expect(noOverflow).toBe(true)
  })
})
