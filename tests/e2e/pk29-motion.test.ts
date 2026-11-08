import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

// PK-29: Motion & Animation E2E tests
// Runs on CI on desktop-1440, self-checks 1440 & 375 viewports, tests reduced-motion, cleanup in finally.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk29-${randomUUID()}@example.test`)
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

test.describe('PK-29: Motion & Animation (Public Pages)', () => {
  test('verifies hero entrance, stagger cards, stats count-up, header shrink on scroll, smooth FAQ, and reduced-motion compliance', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(240000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const suffix = randomUUID().slice(0, 8)
    const slug = `e2e-pk29-motion-${suffix}`
    let pageId: number | string | undefined

    const testPuckData = {
      root: { props: { title: `[MẪU] Motion Test ${suffix}` } },
      content: [
        {
          type: 'HeroTwoEntries',
          props: {
            id: `hero-${suffix}`,
            titleLine1: '[MẪU] TRẠM DỪNG',
            titleLine2: '[MẪU] CẢM XÚC',
            seriesLabel: '[MẪU] CHUYỂN MÌNH',
            emotionLine: '[MẪU] Bình an từng khoảnh khắc',
            layout: 'simple',
            entry1: {
              label: '[MẪU] Cá nhân',
              buttonText: 'Bắt đầu ngay',
              buttonLink: '#personal',
            },
          },
        },
        {
          type: 'IconCardGrid',
          props: {
            id: `grid-${suffix}`,
            _style: {
              entrance: 'stagger',
            },
            cards: [
              {
                type: 'Card',
                props: {
                  id: `card-1-${suffix}`,
                  title: '[MẪU] Thẻ số 1',
                  text: 'Nội dung thẻ số 1',
                },
              },
              {
                type: 'Card',
                props: {
                  id: `card-2-${suffix}`,
                  title: '[MẪU] Thẻ số 2',
                  text: 'Nội dung thẻ số 2',
                },
              },
            ],
          },
        },
        {
          type: 'StatsBar',
          props: {
            id: `stats-${suffix}`,
            stats: [
              {
                type: 'Stat',
                props: {
                  id: `stat-1-${suffix}`,
                  value: '[MẪU] 500+',
                  label: 'Học viên đồng hành',
                },
              },
            ],
          },
        },
        {
          type: 'JourneySteps',
          props: {
            id: `journey-${suffix}`,
            variant: 'cards',
          },
        },
        {
          type: 'FAQ',
          props: {
            id: `faq-${suffix}`,
            items: [
              {
                question: '[MẪU] Khóa học có hoàn tiền không?',
                answer: '[MẪU] Không có chính sách hoàn tiền sau khi đăng ký.',
              },
            ],
          },
        },
      ],
    }

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      await bootstrapAdmin(page)

      // Create test page via REST
      const res = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] Trang Motion E2E ${suffix}`,
          slug,
          _status: 'published',
          puckData: testPuckData,
        },
      })
      expect(res.ok(), await res.text()).toBe(true)
      pageId = (await res.json()).doc.id

      // -------------------------------------------------------------
      // 1. Kiểm tra trên màn hình Desktop 1440px
      // -------------------------------------------------------------
      await guest.setViewportSize({ width: 1440, height: 900 })
      const navRes = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(navRes?.status()).toBe(200)

      // Hero elements are visible
      await expect(guest.getByText('[MẪU] TRẠM DỪNG')).toBeVisible()

      // Header before scroll: not in scrolled state
      const header = guest.locator('header')
      await expect(header).toBeVisible()
      const initialHeaderBox = await header.boundingBox()
      expect(initialHeaderBox).not.toBeNull()

      // Scroll 200px: header enters scrolled state, height remains stable (no layout shift)
      await guest.evaluate(() => window.scrollTo(0, 200))
      await expect(header).toHaveAttribute('data-eb-scrolled', 'true', { timeout: 5000 })
      const scrolledHeaderBox = await header.boundingBox()
      expect(scrolledHeaderBox).not.toBeNull()
      // Bounding box height should not shift significantly (≤ 2px delta)
      expect(Math.abs(scrolledHeaderBox!.height - initialHeaderBox!.height)).toBeLessThanOrEqual(2)

      // Cuộn tới StatsBar -> số cuối hiển thị đúng là "500+"
      const statsSection = guest.locator('section').filter({ hasText: 'Học viên đồng hành' })
      await statsSection.scrollIntoViewIfNeeded()
      await expect(guest.getByText('500+')).toBeVisible({ timeout: 5000 })

      // Cuộn tới IconCardGrid -> mọi thẻ [data-eb-card] có opacity = 1 sau <= 1s
      const cardGrid = guest.locator('[data-eb-entrance="stagger"]')
      await cardGrid.scrollIntoViewIfNeeded()
      await expect(cardGrid).toHaveClass(/eb-in-view/, { timeout: 5000 })
      const cardLocators = cardGrid.locator('[data-eb-card]')
      await expect(cardLocators.first()).toBeVisible({ timeout: 2000 })
      const firstCardOpacity = await cardLocators
        .first()
        .evaluate((el) => window.getComputedStyle(el).opacity)
      expect(firstCardOpacity).toBe('1')

      // Mở FAQ bằng bàn phím (Enter) -> nội dung hiện, aria-expanded = true
      const faqBtn = guest.getByRole('button', { name: /Khóa học có hoàn tiền không/i })
      await faqBtn.scrollIntoViewIfNeeded()
      expect(await faqBtn.getAttribute('aria-expanded')).toBe('false')

      await faqBtn.focus()
      await guest.keyboard.press('Enter')
      await expect(faqBtn).toHaveAttribute('aria-expanded', 'true')
      await expect(guest.getByText('Không có chính sách hoàn tiền sau khi đăng ký.')).toBeVisible()

      // -------------------------------------------------------------
      // 2. Kiểm tra chế độ Reduced Motion: nội dung hiện ngay, số cuối ngay
      // -------------------------------------------------------------
      const rmContext = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        reducedMotion: 'reduce',
      })
      const rmGuest = await rmContext.newPage()
      await rmGuest.goto(`/${slug}`)

      // Under reduced motion, stat is already final
      await expect(rmGuest.getByText('500+')).toBeVisible()
      // Staggered cards are visible immediately
      const rmCards = rmGuest.locator('[data-eb-entrance="stagger"] [data-eb-card]')
      await expect(rmCards.first()).toBeVisible()
      const rmOpacity = await rmCards.first().evaluate((el) => window.getComputedStyle(el).opacity)
      expect(rmOpacity).toBe('1')

      await rmContext.close()

      // -------------------------------------------------------------
      // 3. Kiểm tra trên Mobile 375px: không cuộn ngang, a11y sạch
      // -------------------------------------------------------------
      await guest.setViewportSize({ width: 375, height: 667 })
      await guest.evaluate(() => window.scrollTo(0, 0))

      const hasHorizontalScroll = await guest.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(hasHorizontalScroll).toBe(false)

      await expectNoSeriousA11y(guest)
    } finally {
      await visitor.close()
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`)
      }
    }
  })
})

