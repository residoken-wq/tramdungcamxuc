import path from 'node:path'
import { expect, test } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

const SHOT_DIR = path.join(process.cwd(), 'docs/screenshots/pk21')
const SHOTS = process.env.PK21_SCREENSHOTS === '1'

test.describe('PK-21: v2 Variants and New Blocks on /styleguide', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')
  })

  for (const width of [1440, 375]) {
    test(`PK-21 design and interaction verification (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
      await page.goto('/styleguide')

      // Ensure PK-21 root is visible
      const pk21Root = page.locator('[data-testid="pk21-demo-root"]')
      await expect(pk21Root).toBeVisible()

      // 1. PhotoGallery arrow navigation & keyboard
      const gallery = page.locator('#demo-pk21-gallery')
      await expect(gallery).toBeVisible()

      if (width >= 640) {
        const scrollArea = gallery.locator('.sm\\:flex[role="region"]').first()
        await expect(scrollArea).toBeVisible()

        const nextBtn = gallery.getByRole('button', { name: /tiếp theo/i }).first()
        await expect(nextBtn).toBeVisible()
        await nextBtn.click()

        // Keyboard navigation on scrollArea
        await scrollArea.focus()
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowLeft')
      } else {
        const mobileGallery = gallery.locator('.sm\\:hidden').first()
        await expect(mobileGallery).toBeVisible()
      }

      // 2. FAQ quick expand
      const faqQuick = page.locator('#demo-pk21-faq')
      await expect(faqQuick).toBeVisible()
      const expandBtn = faqQuick.getByRole('button', { name: /Phiên trải nghiệm/i }).first()
      await expect(expandBtn).toBeVisible()
      await expect(expandBtn).toHaveAttribute('aria-expanded', 'false')
      await expandBtn.click()
      await expect(expandBtn).toHaveAttribute('aria-expanded', 'true')

      // 3. ContactForms personal has all 5 fields
      const contactPersonal = page.locator('#demo-pk21-contact-personal')
      await expect(contactPersonal.getByLabel(/Họ và tên/i)).toBeVisible()
      await expect(contactPersonal.getByLabel(/Email/i)).toBeVisible()
      await expect(contactPersonal.getByLabel(/Số điện thoại/i)).toBeVisible()
      await expect(contactPersonal.getByLabel(/Lộ trình bạn quan tâm/i)).toBeVisible()
      await expect(contactPersonal.getByLabel(/Điều bạn đang trăn trở/i)).toBeVisible()

      // 4. Callout strip has bright-magenta highlight
      const calloutStrip = page.locator('#demo-pk21-callout-strip')
      await expect(calloutStrip.locator('strong.text-bright-magenta').first()).toBeVisible()

      // 5. Check no horizontal overflow at 375px
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1) // 1px rounding tolerance across browsers

      // 6. Axe accessibility check on the PK-21 section
      await expectNoSeriousA11y(page, 'PK-21 Styleguide Demo', {
        include: [
          '#demo-pk21-gallery',
          '#demo-pk21-icon-carousel',
          '#demo-pk21-faq',
          '#demo-pk21-service-detailed',
          '#demo-pk21-testimonial-featured',
          '#demo-pk21-image-bleed',
          '#demo-pk21-contact-personal',
          '#demo-pk21-lead-list',
          '#demo-pk21-library-featured',
          '#demo-pk21-callout-strip',
        ],
      })

      // 7. Screenshots when enabled
      if (SHOTS) {
        await gallery.screenshot({
          path: path.join(SHOT_DIR, `gallery-${width}.png`),
        })
        await faqQuick.screenshot({
          path: path.join(SHOT_DIR, `faq-${width}.png`),
        })
        await calloutStrip.screenshot({
          path: path.join(SHOT_DIR, `callout-strip-${width}.png`),
        })
      }
    })
  }
})
