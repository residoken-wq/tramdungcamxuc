import path from 'node:path'
import { expect, test, type Page } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

const SHOT_DIR = path.join(process.cwd(), 'docs/screenshots/pk20')
const SHOTS = process.env.PK20_SCREENSHOTS === '1'

test.describe('PK-20: cardAccent, highlight, and BrandImage on /styleguide', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')
  })

  for (const width of [1440, 375]) {
    test(`PK-20 design verification (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
      await page.goto('/styleguide')

      // 1. Vạch đầu thẻ có border-top-width 6px
      const accentCards = page.locator('#demo-pk20-accent [data-eb-card]')
      await expect(accentCards.first()).toBeVisible()
      const borderTopWidth = await accentCards
        .first()
        .evaluate((el) => getComputedStyle(el).borderTopWidth)
      expect(borderTopWidth).toBe('6px')

      // 2. Thẻ navy nền xanh thẫm
      const highlightCards = page.locator('#demo-pk20-highlight [data-eb-card]')
      const navyCard = highlightCards.nth(2)
      await expect(navyCard).toBeVisible()
      const navyBg = await navyCard.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(navyBg).toBe('rgb(40, 10, 96)')

      // 3. Nhãn và thẻ chú thích nằm trong khung ảnh (so boundingBox)
      const roundedImgBox = page.locator('#brand-image-rounded')
      await expect(roundedImgBox).toBeVisible()
      const imgRect = await roundedImgBox.boundingBox()
      expect(imgRect).toBeTruthy()

      const badge = roundedImgBox.locator('[data-brand-image-badge]')
      await expect(badge).toBeVisible()
      const badgeRect = await badge.boundingBox()
      expect(badgeRect).toBeTruthy()

      // Badge nằm trọn vẹn trong khung ảnh
      expect(badgeRect!.x).toBeGreaterThanOrEqual(imgRect!.x - 1)
      expect(badgeRect!.y).toBeGreaterThanOrEqual(imgRect!.y - 1)
      expect(badgeRect!.x + badgeRect!.width).toBeLessThanOrEqual(imgRect!.x + imgRect!.width + 1)
      expect(badgeRect!.y + badgeRect!.height).toBeLessThanOrEqual(imgRect!.y + imgRect!.height + 1)

      const caption = roundedImgBox.locator('[data-brand-image-caption]')
      await expect(caption).toBeVisible()
      const captionRect = await caption.boundingBox()
      expect(captionRect).toBeTruthy()

      // Caption nằm trọn vẹn trong khung ảnh
      expect(captionRect!.x).toBeGreaterThanOrEqual(imgRect!.x - 1)
      expect(captionRect!.y).toBeGreaterThanOrEqual(imgRect!.y - 1)
      expect(captionRect!.x + captionRect!.width).toBeLessThanOrEqual(
        imgRect!.x + imgRect!.width + 1,
      )
      expect(captionRect!.y + captionRect!.height).toBeLessThanOrEqual(
        imgRect!.y + imgRect!.height + 1,
      )

      // 4. Không cuộn ngang ở 375px
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)

      // 5. Axe accessibility check on the PK-20 section
      await expectNoSeriousA11y(page, 'PK-20 Styleguide Demo', {
        include: [
          '#demo-pk20-accent',
          '#demo-pk20-highlight',
          '#demo-pk20-glass',
          '#demo-pk20-brand-image',
        ],
      })

      // 6. Screenshot when enabled
      if (SHOTS) {
        await page.locator('#demo-pk20-brand-image').screenshot({
          path: path.join(SHOT_DIR, `brand-image-${width}.png`),
        })
        await page.locator('#demo-pk20-accent').screenshot({
          path: path.join(SHOT_DIR, `accent-${width}.png`),
        })
      }
    })
  }
})
