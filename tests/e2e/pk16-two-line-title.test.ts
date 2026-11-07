import path from 'node:path'
import { expect, test, type Locator, type Page } from './fixtures'

/**
 * PK-16: two-tone titles always break into two rows (line 2 strictly below line 1).
 * Uses the /styleguide demos (no admin needed). Runs once on desktop-1440 and checks 1440 and
 * 375 itself. Screenshots only with PK16_SCREENSHOTS=1, so a normal run never rewrites docs/.
 * QA PK-16c: the ImageText check was missing, fixed waits removed, screenshots made opt-in.
 */

const SHOT_DIR = path.join(process.cwd(), 'docs/screenshots/pk16')
const SHOTS = process.env.PK16_SCREENSHOTS === '1'

async function expectTwoRows(heading: Locator, line1: string, line2: string) {
  const first = heading.getByText(line1, { exact: true })
  const second = heading.getByText(line2, { exact: true })
  await expect(first).toBeVisible()
  await expect(second).toBeVisible()
  // The accessible name keeps a space between the lines (no "…BỀN BỈ.TỎA…").
  await expect(heading).toHaveText(`${line1} ${line2}`)
  const a = await first.boundingBox()
  const b = await second.boundingBox()
  expect(a).not.toBeNull()
  expect(b).not.toBeNull()
  expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height - 1)
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test.describe('PK-16: two-tone titles on two rows', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')
  })

  for (const width of [1440, 375]) {
    test(`HeroTwoEntries and ImageText: line 2 below line 1 (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
      await page.goto('/styleguide')

      const hero = page.locator('#demo-eb14-split-cu section').first()
      const heroHeading = hero.locator('h1, h2').first()
      await expect(heroHeading.locator('span.block')).toHaveCount(2)
      const [h1, h2] = await heroHeading.locator('span.block').allTextContents()
      await expectTwoRows(heroHeading, h1.trim(), h2.trim())

      const imageText = page.getByRole('heading', {
        name: 'LẮNG NGHE KHÔNG PHÁN XÉT HIỂU MÌNH ĐỂ THƯƠNG MÌNH',
      })
      await expectTwoRows(imageText, 'LẮNG NGHE KHÔNG PHÁN XÉT', 'HIỂU MÌNH ĐỂ THƯƠNG MÌNH')

      await noHorizontalScroll(page)
      if (SHOTS) await hero.screenshot({ path: path.join(SHOT_DIR, `hero-two-line-${width}.png`) })
    })
  }

  test('home page has no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await noHorizontalScroll(page)
  })
})
