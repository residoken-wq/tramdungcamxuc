import path from 'node:path'
import { expect, test, type Page } from './fixtures'

/**
 * PK-17 on the /styleguide demos (Pk17Demo, data [MẪU]). Runs once on desktop-1440 and checks
 * 1440 and 375 itself. Screenshots only with PK17_SCREENSHOTS=1.
 * QA PK-17c: the PC test only opened the page and took screenshots; it now checks the design.
 */

const SHOT_DIR = path.join(process.cwd(), 'docs/screenshots/pk17')
const SHOTS = process.env.PK17_SCREENSHOTS === '1'

/** Tailwind writes "no shadow" as transparent layers; treat those as none. */
const noShadow = (v: string) => v === 'none' || !/rgba?\((?!0, 0, 0, 0\))/.test(v)

const css = (page: Page, selector: string, prop: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop)

test.describe('PK-17: circles, spotlight, card frame', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')
  })

  for (const width of [1440, 375]) {
    test(`design checks (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
      await page.goto('/styleguide')

      // 1. Circles: 5 round number badges, step 5 filled pink, its texts still dark (readable).
      const circles = page.locator('#demo-pk17-circles')
      const badges = circles.locator('[data-eb-card-row].rounded-full:visible')
      await expect(badges).toHaveCount(5)
      await expect(badges.nth(4)).toHaveCSS('background-color', 'rgb(239, 59, 131)')
      await expect(circles.getByText('[MẪU] Thực hành bền bỉ').first()).toHaveCSS(
        'color',
        'rgb(40, 10, 96)',
      )
      // No card box around a step.
      expect(noShadow(await css(page, '#demo-pk17-circles [data-eb-card]', 'box-shadow'))).toBe(
        true,
      )

      // 2. Spotlight: image panel beside the text on desktop, quote with a left bar, no double quotes.
      const spot = page.locator('#demo-pk17-spotlight')
      const quote = spot.getByText(/Câu trích dẫn có sẵn ngoặc kép/)
      await expect(quote).toHaveText('“[MẪU] Câu trích dẫn có sẵn ngoặc kép.”')
      expect(await quote.locator('..').evaluate((el) => getComputedStyle(el).borderLeftWidth)).toBe(
        '3px',
      )
      const img = await spot.getByRole('img', { name: '[MẪU] Ảnh minh họa' }).boundingBox()
      const title = await spot.getByRole('heading', { level: 2 }).boundingBox()
      expect(img && title).toBeTruthy()
      if (width === 1440) expect(img!.x).toBeGreaterThan(title!.x + title!.width - 1)

      // 3. "Không khung": plain cards lose shadow and background, the highlighted (navy) one keeps it.
      const frame = '#demo-pk17-frame-none [data-eb-card]'
      expect(noShadow(await css(page, `${frame}:not([data-eb-card-solid])`, 'box-shadow'))).toBe(
        true,
      )
      expect(await css(page, `${frame}:not([data-eb-card-solid])`, 'background-color')).toBe(
        'rgba(0, 0, 0, 0)',
      )
      expect(await css(page, `${frame}[data-eb-card-solid]`, 'background-color')).toBe(
        'rgb(40, 10, 96)',
      )

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)

      if (SHOTS) {
        await circles.screenshot({ path: path.join(SHOT_DIR, `circles-${width}.png`) })
        await spot.screenshot({ path: path.join(SHOT_DIR, `spotlight-${width}.png`) })
      }
    })
  }
})
