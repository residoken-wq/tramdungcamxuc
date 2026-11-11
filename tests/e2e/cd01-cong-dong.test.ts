import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'
import { communityTemplate } from '@/puck/templates/community'

// CD-01: Trang Cộng đồng của Trạm 100% precision E2E (Slide 47–57)
// Creates a page from communityTemplate via REST, verifies 1440px desktop & 375px mobile responsiveness,
// checks interactive anchors, color stripes, CTA 2 buttons, and clean a11y, then cleans up in finally.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`cd01-${randomUUID()}@example.test`)
  await page.locator('#field-password').fill(password)
  await page.locator('#field-confirm-password').fill(password)

  let response: Response | undefined
  await expect(async () => {
    const registration = page.waitForResponse(
      (res) => res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
      { timeout: 5000 },
    )
    await page.locator('button[type="submit"]').click()
    response = await registration
  }).toPass({ timeout: 60000 })

  if (!response) throw new Error('First-user registration request was never sent.')
  expect(response.ok()).toBe(true)
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('CD-01: Trang Cộng đồng của Trạm (100% precision)', () => {
  test('public page renders community template with 1440px desktop layout, 375px mobile responsiveness, and clean a11y', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const suffix = randomUUID().slice(0, 8)
    const slug = `e2e-cd01-${suffix}`
    let pageId: number | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      await bootstrapAdmin(page)

      // Create page with communityTemplate via REST (Hero with image for overlay test)
      const testTemplate = {
        ...communityTemplate,
        content: communityTemplate.content.map((item) => {
          if (item.type === 'HeroImage') {
            return {
              ...item,
              props: {
                ...item.props,
                imageUrl: '/brand/sample-cover.svg',
                imageAlt: 'Ảnh bìa mẫu',
              },
            }
          }
          if (item.type === 'ImageText' && item.props?.id === 'community-yoga-buddy') {
            return {
              ...item,
              props: {
                ...item.props,
                imageUrl: '/brand/sample-cover.svg',
                imageAlt: 'Ảnh Yoga Buddy mẫu',
              },
            }
          }
          if (item.type === 'PhotoGallery' && Array.isArray(item.props?.items)) {
            return {
              ...item,
              props: {
                ...item.props,
                items: item.props.items.map((pi: any, idx: number) => ({
                  ...pi,
                  imageUrl: '/brand/sample-cover.svg',
                  alt: pi.alt || `Ảnh khoảnh khắc ${idx + 1}`,
                })),
              },
            }
          }
          return item
        }),
      }

      const res = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] Cộng đồng CD-01 ${suffix}`,
          slug,
          _status: 'published',
          puckData: testTemplate,
        },
      })

      expect(res.ok(), await res.text()).toBe(true)
      pageId = (await res.json()).doc.id

      // 1. Desktop 1440px
      await guest.setViewportSize({ width: 1440, height: 900 })
      const navRes = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(navRes?.status()).toBe(200)

      // Slide 48: Hero text on left half (max-w-xl, text-left)
      const heroTitle = guest.getByRole('heading', { level: 1 }).first()
      await expect(heroTitle).toBeVisible()
      const heroBox = await heroTitle.boundingBox()
      if (heroBox) {
        // Center of hero title should be in left half (< 720px)
        expect(heroBox.x + heroBox.width / 2).toBeLessThan(720)
      }

      // CD-02: Hero overlay has dark background color, not transparent
      const overlayEl = guest.locator('section[data-eb-hero] [aria-hidden="true"]').first()
      await expect(overlayEl).toBeVisible()
      const overlayBg = await overlayEl.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      )
      expect(overlayBg).not.toBe('rgba(0, 0, 0, 0)')
      expect(overlayBg).toMatch(/rgba?\(40,\s*10,\s*96/)

      // Slide 49: 3 cards in space section, card 3 has no link, check top stripes
      const spaceHeading = guest.getByRole('heading', { name: /chọn không gian của bạn/i })
      await expect(spaceHeading).toBeVisible()

      const meTimeHeading = guest.getByRole('heading', { name: /^me time$/i }).first()
      const yogaHeading = guest.getByRole('heading', { name: /^yoga buddy$/i }).first()
      const comingSoonHeading = guest.getByRole('heading', { name: /không gian mới/i }).first()

      await expect(meTimeHeading).toBeVisible()
      await expect(yogaHeading).toBeVisible()
      await expect(comingSoonHeading).toBeVisible()

      const meTimeCard = meTimeHeading.locator('xpath=ancestor::*[@data-eb-card][1]')
      const yogaCard = yogaHeading.locator('xpath=ancestor::*[@data-eb-card][1]')
      const comingSoonCard = comingSoonHeading.locator('xpath=ancestor::*[@data-eb-card][1]')

      await expect(meTimeCard).toBeVisible()
      await expect(yogaCard).toBeVisible()
      await expect(comingSoonCard).toBeVisible()

      // Card 0 and 1 have links
      await expect(meTimeCard.locator('a[href="#me-time"]')).toBeVisible()
      await expect(yogaCard.locator('a[href="#yoga-buddy"]')).toBeVisible()

      // CD-02: Slide 49 subtitle has text-transform: uppercase
      const meTimeSubtitle = meTimeCard
        .locator('div')
        .filter({ hasText: /thương mình theo cách riêng/i })
        .first()
      const subtitleTransform = await meTimeSubtitle.evaluate(
        (el) => window.getComputedStyle(el).textTransform,
      )
      expect(subtitleTransform).toBe('uppercase')

      // Card 2 (coming soon) has NO link
      expect(await comingSoonCard.locator('a').count()).toBe(0)

      // Prompt check: Top color stripes on card 1 and 2, but NOT on coming-soon card
      const meTimeBorderTop = await meTimeCard.evaluate(
        (el) => window.getComputedStyle(el).borderTopWidth,
      )
      expect(meTimeBorderTop).toBe('6px')
      const comingSoonBorderTop = await comingSoonCard.evaluate(
        (el) => window.getComputedStyle(el).borderTopWidth,
      )
      expect(comingSoonBorderTop).not.toBe('6px')

      // CD-03: Slide 49 (carousel equalHeight) – all 3 cards equal height (diff <= 1px), including "Coming soon"
      const meTimeBox = await meTimeCard.boundingBox()
      const yogaBox = await yogaCard.boundingBox()
      const comingSoonBox = await comingSoonCard.boundingBox()
      expect(meTimeBox).toBeTruthy()
      expect(yogaBox).toBeTruthy()
      expect(comingSoonBox).toBeTruthy()
      if (meTimeBox && yogaBox && comingSoonBox) {
        expect(Math.abs(meTimeBox.height - yogaBox.height)).toBeLessThanOrEqual(1)
        expect(Math.abs(meTimeBox.height - comingSoonBox.height)).toBeLessThanOrEqual(1)
      }

      // CD-04: Slide 49 – side arrows are located to the left of the first card and right of the last card
      const spacePrevBtn = spaceHeading
        .locator(
          'xpath=ancestor::section[1]//button[contains(@class, "absolute") and @aria-label="Thẻ trước"]',
        )
        .first()
      const spaceNextBtn = spaceHeading
        .locator(
          'xpath=ancestor::section[1]//button[contains(@class, "absolute") and @aria-label="Thẻ tiếp theo"]',
        )
        .first()
      await expect(spacePrevBtn).toBeVisible()
      await expect(spaceNextBtn).toBeVisible()
      const spacePrevBox = await spacePrevBtn.boundingBox()
      const spaceNextBox = await spaceNextBtn.boundingBox()
      if (spacePrevBox && spaceNextBox && meTimeBox && comingSoonBox) {
        expect(spacePrevBox.x + spacePrevBox.width).toBeLessThanOrEqual(meTimeBox.x + 1)
        expect(spaceNextBox.x).toBeGreaterThanOrEqual(comingSoonBox.x + comingSoonBox.width - 1)
      }

      if (process.env.CD03_SCREENSHOT) {
        const spaceSection = spaceHeading.locator('xpath=ancestor::section[1]')
        await spaceSection.screenshot({ path: process.env.CD03_SCREENSHOT })
      }

      // Anchor scroll targets exist on page
      await expect(guest.locator('#me-time')).toBeVisible()
      await expect(guest.locator('#yoga-buddy')).toBeVisible()

      // CD-04: Slide 54 – Yoga Buddy image touches top and bottom of section (diff <= 1px)
      const yogaContainer = guest.locator('#yoga-buddy')
      const yogaSection =
        (await yogaContainer.locator('section').count()) > 0
          ? yogaContainer.locator('section').first()
          : yogaContainer
      await expect(yogaSection).toBeVisible()
      const yogaImg = yogaSection.locator('img').first()
      await expect(yogaImg).toBeVisible()
      const yogaSecBox = await yogaSection.boundingBox()
      const yogaImgBox = await yogaImg.boundingBox()
      expect(yogaSecBox).toBeTruthy()
      expect(yogaImgBox).toBeTruthy()
      if (yogaSecBox && yogaImgBox) {
        expect(Math.abs(yogaImgBox.y - yogaSecBox.y)).toBeLessThanOrEqual(1)
        expect(
          Math.abs(yogaImgBox.y + yogaImgBox.height - (yogaSecBox.y + yogaSecBox.height)),
        ).toBeLessThanOrEqual(1)
      }

      // CD-02: Slide 51 center card "Me Time của tui" title color accent-pink and font-size >= 24px
      const centerCardHeading = guest.getByRole('heading', { name: /me time của tui/i }).first()
      await expect(centerCardHeading).toBeVisible()
      const centerTitleColor = await centerCardHeading.evaluate(
        (el) => window.getComputedStyle(el).color,
      )
      expect(centerTitleColor).toMatch(/rgb\(239,\s*59,\s*131\)/)
      const centerTitleSizeDesktop = await centerCardHeading.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize),
      )
      expect(centerTitleSizeDesktop).toBeGreaterThanOrEqual(24)

      // CD-04: Slide 51 – cards have flat top corners (border-top-left-radius = 0px) and muted eyebrow (deep-navy 70%)
      const centerCardBorderRadius = await centerCardHeading
        .locator('xpath=ancestor::*[@data-eb-card][1]')
        .evaluate((el) => window.getComputedStyle(el).borderTopLeftRadius)
      expect(centerCardBorderRadius).toBe('0px')

      const centerEyebrow = centerCardHeading
        .locator('xpath=ancestor::*[@data-eb-card][1]')
        .locator('.tracking-wider')
        .first()
      await expect(centerEyebrow).toBeVisible()
      const eyebrowColor = await centerEyebrow.evaluate((el) => window.getComputedStyle(el).color)
      expect(eyebrowColor).toMatch(/rgba?\(40,\s*10,\s*96,\s*(0\.7|0\.69\d*)\)/)

      // CD-03: Slide 51 (grid equalHeight) – all 3 cards equal height (diff <= 1px)
      const weTimeHeading = guest.getByRole('heading', { name: /^we time$/i }).first()
      const youMeHeading = guest.getByRole('heading', { name: /^you & me$/i }).first()
      await expect(weTimeHeading).toBeVisible()
      await expect(youMeHeading).toBeVisible()
      const weTimeCard = weTimeHeading.locator('xpath=ancestor::*[@data-eb-card][1]')
      const centerCard = centerCardHeading.locator('xpath=ancestor::*[@data-eb-card][1]')
      const youMeCard = youMeHeading.locator('xpath=ancestor::*[@data-eb-card][1]')
      const weTimeBox = await weTimeCard.boundingBox()
      const centerBox = await centerCard.boundingBox()
      const youMeBox = await youMeCard.boundingBox()
      expect(weTimeBox).toBeTruthy()
      expect(centerBox).toBeTruthy()
      expect(youMeBox).toBeTruthy()
      if (weTimeBox && centerBox && youMeBox) {
        expect(Math.abs(weTimeBox.height - centerBox.height)).toBeLessThanOrEqual(1)
        expect(Math.abs(weTimeBox.height - youMeBox.height)).toBeLessThanOrEqual(1)
      }

      // Slide 55: 2 cards in one row on desktop 1440
      const routineLeft = guest.getByRole('heading', { name: /hành trình 30 phút/i })
      const routineRight = guest.getByRole('heading', { name: /vài điều giữ cho nhau/i })
      await expect(routineLeft).toBeVisible()
      await expect(routineRight).toBeVisible()

      const leftBox = await routineLeft.boundingBox()
      const rightBox = await routineRight.boundingBox()
      if (leftBox && rightBox) {
        expect(leftBox.x).toBeLessThan(rightBox.x)
        // Check they are horizontally aligned (same row, y difference small)
        expect(Math.abs(leftBox.y - rightBox.y)).toBeLessThan(150)
      }

      // CD-04: Slide 55 – 2 cards equal height (diff <= 1px)
      const routineLeftCard = routineLeft.locator('xpath=ancestor::*[@data-eb-card][1]')
      const routineRightCard = routineRight.locator('xpath=ancestor::*[@data-eb-card][1]')
      await expect(routineLeftCard).toBeVisible()
      await expect(routineRightCard).toBeVisible()
      const routineLeftBox = await routineLeftCard.boundingBox()
      const routineRightBox = await routineRightCard.boundingBox()
      expect(routineLeftBox).toBeTruthy()
      expect(routineRightBox).toBeTruthy()
      if (routineLeftBox && routineRightBox) {
        expect(Math.abs(routineLeftBox.height - routineRightBox.height)).toBeLessThanOrEqual(1)
      }

      // CD-04 Item 2: Slide 55 – Top accent stripe colors on both cards
      // Left card "Hành trình 30 Phút": accent-pink rgb(239, 59, 131)
      // Right card "Vài điều giữ cho nhau": deep-navy rgb(40, 10, 96)
      const leftBorderTopColor = await routineLeftCard.evaluate(
        (el) => window.getComputedStyle(el).borderTopColor,
      )
      const rightBorderTopColor = await routineRightCard.evaluate(
        (el) => window.getComputedStyle(el).borderTopColor,
      )
      expect(leftBorderTopColor).toMatch(/rgb\(239,\s*59,\s*131\)/)
      expect(rightBorderTopColor).toMatch(/rgb\(40,\s*10,\s*96\)/)

      if (process.env.CD04_SCREENSHOT_DIR) {
        const dir = process.env.CD04_SCREENSHOT_DIR
        const spaceSection = spaceHeading.locator('xpath=ancestor::section[1]')
        await spaceSection.screenshot({ path: `${dir}/slide-49-1440.png` })

        const scheduleSection = guest
          .getByRole('heading', { name: /lịch trình 5:00 AM/i })
          .locator('xpath=ancestor::section[1]')
        await scheduleSection.screenshot({ path: `${dir}/slide-51-1440.png` })

        const meTimeMoments = guest
          .getByRole('heading', { name: /khoảnh khắc me time/i })
          .locator('xpath=ancestor::section[1]')
        await meTimeMoments.screenshot({ path: `${dir}/slide-53-1440.png` })

        await yogaSection.screenshot({ path: `${dir}/slide-54-1440.png` })

        const yogaSchedule = routineLeft.locator('xpath=ancestor::section[1]')
        await yogaSchedule.screenshot({ path: `${dir}/slide-55-1440.png` })

        const yogaMoments = guest
          .getByRole('heading', { name: /góc nhỏ yoga buddy/i })
          .locator('xpath=ancestor::section[1]')
        await yogaMoments.screenshot({ path: `${dir}/slide-56-1440.png` })
      }

      // Slide 57: CTASection solid with deep-navy bg and 2 buttons
      const ctaSection = guest.locator('[data-cta-solid]').first()
      await expect(ctaSection).toBeVisible()
      const ctaBgColor = await ctaSection.evaluate(
        (el) => window.getComputedStyle(el).backgroundColor,
      )
      expect(ctaBgColor).toMatch(/rgb\(40,\s*10,\s*96\)/)

      await expect(
        guest
          .getByRole('button', { name: /tham gia me time/i })
          .or(guest.getByRole('link', { name: /tham gia me time/i })),
      ).toBeVisible()
      await expect(
        guest
          .getByRole('button', { name: /tham gia yoga buddy/i })
          .or(guest.getByRole('link', { name: /tham gia yoga buddy/i })),
      ).toBeVisible()

      // 2. Mobile & Tablet: responsive check & screenshots
      if (process.env.CD04_SCREENSHOT_DIR) {
        await guest.setViewportSize({ width: 768, height: 1024 })
        await guest.waitForTimeout(300)
        const spaceSection768 = spaceHeading.locator('xpath=ancestor::section[1]')
        await spaceSection768.screenshot({
          path: `${process.env.CD04_SCREENSHOT_DIR}/slide-49-768.png`,
        })
      }

      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.waitForTimeout(300)

      // CD-02: Slide 51 center card title size >= 24px on mobile
      const centerTitleSizeMobile = await centerCardHeading.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize),
      )
      expect(centerTitleSizeMobile).toBeGreaterThanOrEqual(24)

      // CD-04 Item 3: On mobile (375px), bottom nav buttons exist for carousel track
      const mobileNavPrev = guest
        .locator('[data-carousel-track] .sm\\:hidden button[aria-label="Thẻ trước"]')
        .first()
      await expect(mobileNavPrev).toBeVisible()

      const scrollWidth = await guest.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await guest.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // max 5px subpixel margin

      // Accessibility check on public community page
      await expectNoSeriousA11y(guest)
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      await visitor.close()
    }
  })
})
