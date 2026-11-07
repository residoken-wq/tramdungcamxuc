import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'
import { vi } from '../../src/lib/i18n/vi'

const SHOT_DIR = path.join(process.cwd(), 'docs/screenshots/pk19')

async function bootstrapAdmin(page: Page): Promise<number> {
  const init = await (await page.request.get('/api/users/init')).json()
  if (init.initialized !== false) {
    const meRes = await page.request.get('/api/users/me')
    if (meRes.ok() && (await meRes.json()).user) {
      return (await meRes.json()).user.id
    }
  }

  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-pk19-${randomUUID()}@example.test`)
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

  if (!response || !response.ok()) throw new Error('First-user registration failed.')
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('PK-19: SolutionEcosystem Groups & FAQ Contact Aside (E2E)', () => {
  // QA PK-19c: bootstraps the first admin, so it runs once; 375 is checked inside the test.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')
  })

  test('renders 3-column groups layout, FAQ with contact card & plusminus, no horizontal scroll, and satisfies a11y', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const marker = randomUUID().slice(0, 8)
    const pageSlug = `pk19-e2e-${marker}`

    let userId: number | undefined
    let pageId: number | undefined
    let productId: number | undefined
    let serviceId: number | undefined
    let programId: number | undefined
    let mediaId: number | undefined
    let previousEmail: string | null | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      userId = await bootstrapAdmin(page)
      expect(userId).toBeDefined()

      // The contact card shows "Hoặc email:" from siteSettings; set a sample address (restored below).
      previousEmail =
        (await (await page.request.get('/api/globals/siteSettings?depth=0')).json()).email ?? null
      const emailRes = await page.request.post('/api/globals/siteSettings', {
        data: { email: 'lien-he-mau@example.test' },
      })
      expect(emailRes.ok()).toBe(true)

      // 1. Create sample product, service, program, media
      const prodRes = await page.request.post('/api/products', {
        data: {
          name: `[MẪU] CLEAR ${marker}`,
          slug: `clear-${marker}`,
          web: 'site',
          type: 'package',
          saleStatus: 'on_sale',
          price: 1750000,
          isSample: true,
          _status: 'published',
          tagline: 'Định hình góc nhìn nội tại',
          ctaLabel: 'Đặt ngay',
        },
      })
      expect(prodRes.ok()).toBe(true)
      productId = (await prodRes.json()).doc?.id

      const srvRes = await page.request.post('/api/services', {
        data: {
          name: `[MẪU] Growth Mirror ${marker}`,
          slug: `growth-mirror-${marker}`,
          audienceLabel: 'Dành cho Chuyên gia / Cá nhân chuyển nghề',
          ctaLabel: 'Đặt lịch',
          _status: 'published',
          isSample: true,
        },
      })
      expect(srvRes.ok()).toBe(true)
      serviceId = (await srvRes.json()).doc?.id

      const progRes = await page.request.post('/api/programs', {
        data: {
          name: `[MẪU] Lãnh đạo Cảm xúc ${marker}`,
          slug: `lanh-dao-${marker}`,
          learnerGroup: 'Dành cho Quản lý / Lãnh đạo (Leadership)',
          ctaLabel: 'Gửi brief',
          _status: 'published',
          isSample: true,
        },
      })
      expect(progRes.ok()).toBe(true)
      programId = (await progRes.json()).doc?.id

      // 1x1 png for media
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lN8AAAAASUVORK5CYII=',
        'base64',
      )
      const uploadRes = await page.request.post('/api/media', {
        multipart: {
          _payload: JSON.stringify({ alt: '[MẪU] Ảnh liên hệ' }),
          file: {
            name: `hana-${marker}.png`,
            mimeType: 'image/png',
            buffer: pngBuffer,
          },
        },
      })
      expect(uploadRes.ok()).toBe(true)
      mediaId = (await uploadRes.json()).doc?.id

      // 2. Create page with SolutionEcosystem (groups) and FAQ (contact + pill + plusminus)
      const pageRes = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] PK-19 Trang Thử Nghiệm ${marker}`,
          slug: pageSlug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'SolutionEcosystem',
                props: {
                  id: 'eco-e2e',
                  version: 2,
                  layout: 'groups',
                  titleLine1: '[MẪU] HỆ SINH THÁI GIẢI PHÁP',
                  titleLine2: '[MẪU] TOÀN DIỆN VÀ CHUYÊN SÂU',
                  description:
                    '[MẪU] Đồng hành bền bỉ từ chặng tự nhận thức đến chuyển mình vượt bậc.',
                  col1Title: '[MẪU] Đào tạo cá nhân',
                  col1Icon: 'target',
                  col1Accent: 'accent-pink',
                  col1Groups: [
                    {
                      badge: 'SIGNATURE PROGRAM',
                      title: 'Chuyển mình không chênh vênh',
                      frame: 'outlined',
                      itemStyle: 'row',
                      buttonStyle: 'outline',
                      items: [{ productId, buttonText: 'Đặt ngay' }],
                    },
                  ],
                  col2Title: '[MẪU] Khai vấn 1:1',
                  col2Icon: 'compass',
                  col2Accent: 'none',
                  col2Groups: [
                    {
                      title: 'Đồng hành chuyên sâu',
                      frame: 'plain',
                      itemStyle: 'card',
                      buttonStyle: 'outline',
                      items: [
                        {
                          serviceId,
                          heading: '1. Dành cho Chuyên gia / Cá nhân chuyển nghề',
                          buttonText: 'Đặt lịch',
                        },
                      ],
                    },
                  ],
                  col3Title: '[MẪU] Doanh nghiệp',
                  col3Icon: 'team',
                  col3Accent: 'deep-navy',
                  col3Groups: [
                    {
                      title: 'Giải pháp tổ chức',
                      frame: 'plain',
                      itemStyle: 'card',
                      buttonStyle: 'filled',
                      items: [
                        {
                          programId,
                          heading: '1. Dành cho Quản lý / Lãnh đạo',
                          buttonText: 'Gửi brief',
                        },
                      ],
                    },
                  ],
                },
              },
              {
                type: 'FAQ',
                props: {
                  id: 'faq-e2e',
                  version: 5,
                  titleLine1: '[MẪU] CÂU HỎI THƯỜNG GẶP',
                  titleLine2: '[MẪU] GIẢI ĐÁP TẬN TÂM',
                  description: '[MẪU] Tất cả những điều bạn cần biết trước khi bắt đầu hành trình.',
                  seriesLabel: 'FAQS',
                  seriesLabelStyle: 'pill',
                  iconStyle: 'plusminus',
                  aside: 'contact',
                  contactMediaId: mediaId,
                  contactBadge: 'Tư vấn 1:1',
                  bookingAsideTitle: 'Đặt lịch gọi 15 phút',
                  bookingAsideDescription:
                    'Trò chuyện trực tiếp cùng Hana để lắng nghe và tìm ra giải pháp phù hợp.',
                  bookingButtonText: 'Đặt lịch tư vấn',
                  bookingButtonLink: '/lien-he',
                  showEmail: true,
                  source: 'manual',
                  items: [
                    {
                      type: 'FaqItem',
                      props: {
                        id: 'faq-item-1',
                        question: '[MẪU] Khóa học và công cụ số kéo dài trong bao lâu?',
                        answer: '[MẪU] Hành trình kéo dài trong 28 ngày trọn vẹn.',
                      },
                    },
                    {
                      type: 'FaqItem',
                      props: {
                        id: 'faq-item-2',
                        question: '[MẪU] Tôi có được chuyên gia hỗ trợ 1:1 trong suốt lộ trình?',
                        answer: '[MẪU] Đúng vậy, bạn có các phiên khai vấn chuyên sâu riêng biệt.',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: `[MẪU] PK-19 Trang Thử Nghiệm ${marker}` } },
          },
        },
      })
      expect(pageRes.ok()).toBe(true)
      pageId = (await pageRes.json()).doc?.id
      expect(pageId).toBeDefined()

      // Ensure directory for screenshots
      fs.mkdirSync(SHOT_DIR, { recursive: true })

      // ==============================================================
      // 3. Desktop 1440px Verification
      // ==============================================================
      await publicPage.setViewportSize({ width: 1440, height: 900 })
      await publicPage.goto(`/${pageSlug}`, { waitUntil: 'networkidle' })

      // Verify SolutionEcosystem: 3 columns layout
      const grid = publicPage.locator('section').first().locator('.grid.md\\:grid-cols-3')
      await expect(grid).toBeVisible()

      // Accent bars
      await expect(publicPage.locator('.bg-accent-pink.h-\\[6px\\]')).toBeVisible()
      await expect(publicPage.locator('.bg-deep-navy.h-\\[6px\\]')).toBeVisible()

      // Column 1 Product item
      const prodButton = publicPage.getByRole('link', { name: 'Đặt ngay' }).first()
      await expect(prodButton).toBeVisible()
      const prodHref = await prodButton.getAttribute('href')
      expect(prodHref).toContain(`/thanh-toan?san-pham=clear-${marker}`)

      // Column 2 Service item heading & link
      await expect(
        publicPage.getByText('1. Dành cho Chuyên gia / Cá nhân chuyển nghề'),
      ).toBeVisible()
      const srvButton = publicPage.getByRole('link', { name: 'Đặt lịch' }).first()
      await expect(srvButton).toBeVisible()
      expect(await srvButton.getAttribute('href')).toContain(`/coaching/growth-mirror-${marker}`)

      // Column 3 Program item heading & link
      await expect(publicPage.getByText('1. Dành cho Quản lý / Lãnh đạo')).toBeVisible()
      const progButton = publicPage.getByRole('link', { name: 'Gửi brief' }).first()
      await expect(progButton).toBeVisible()
      expect(await progButton.getAttribute('href')).toContain(`/doanh-nghiep/lanh-dao-${marker}`)

      // Verify FAQ section
      // Pill series label
      const faqPill = publicPage.getByText('FAQS')
      await expect(faqPill).toBeVisible()
      expect(await faqPill.getAttribute('class')).toContain('rounded-full')
      expect(await faqPill.getAttribute('class')).toContain('border-[1.5px]')

      // Description under heading
      await expect(
        publicPage.getByText('[MẪU] Tất cả những điều bạn cần biết trước khi bắt đầu hành trình.'),
      ).toBeVisible()

      // Contact aside card
      const avatarImg = publicPage.locator('img[alt="[MẪU] Ảnh liên hệ"]')
      await expect(avatarImg).toBeVisible()

      const contactBtn = publicPage.getByRole('link', { name: 'Đặt lịch tư vấn' })
      await expect(contactBtn).toBeVisible()
      const contactBtnClass = await contactBtn.getAttribute('class')
      expect(contactBtnClass).not.toContain('w-full')
      expect(contactBtnClass).toContain('rounded-full')

      // "Hoặc email:" row
      await expect(publicPage.getByText(new RegExp(vi.pk19.orEmail))).toBeVisible()

      // FAQ accordion plus/minus interaction
      const q2Button = publicPage.getByRole('button', {
        name: /Tôi có được chuyên gia hỗ trợ 1:1 trong suốt lộ trình\?/i,
      })
      await expect(q2Button).toBeVisible()
      expect(await q2Button.getAttribute('aria-expanded')).toBe('false')

      // Click to open Q2
      await q2Button.click()
      await expect(q2Button).toHaveAttribute('aria-expanded', 'true')
      const q2Text = q2Button.locator('span').filter({ hasText: 'Tôi có được chuyên gia' }).last()
      expect(await q2Text.getAttribute('class')).toContain('text-bright-magenta')

      // Capture desktop screenshot
      if (process.env.PK19_SCREENSHOTS === '1')
        await publicPage.screenshot({
          path: path.join(SHOT_DIR, 'desktop-1440.png'),
          fullPage: true,
        })

      // Run axe a11y audit
      await expectNoSeriousA11y(publicPage, 'pk19-desktop-1440')

      // ==============================================================
      // 4. Mobile 375px Verification
      // ==============================================================
      await publicPage.setViewportSize({ width: 375, height: 667 })
      await publicPage.goto(`/${pageSlug}`, { waitUntil: 'networkidle' })

      // Check no horizontal scroll overflow
      const hasOverflow = await publicPage.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(hasOverflow).toBe(false)

      // Columns stack vertically: verify all 3 column titles are in view
      await expect(publicPage.getByText('[MẪU] Đào tạo cá nhân')).toBeVisible()
      await expect(publicPage.getByText('[MẪU] Khai vấn 1:1')).toBeVisible()
      await expect(publicPage.getByText('[MẪU] Doanh nghiệp')).toBeVisible()

      // Capture mobile screenshot
      if (process.env.PK19_SCREENSHOTS === '1')
        await publicPage.screenshot({
          path: path.join(SHOT_DIR, 'mobile-375.png'),
          fullPage: true,
        })

      // Run axe a11y audit on mobile
      await expectNoSeriousA11y(publicPage, 'pk19-mobile-375')
    } finally {
      await publicContext.close().catch(() => {})
      if (previousEmail !== undefined) {
        await page.request
          .post('/api/globals/siteSettings', { data: { email: previousEmail } })
          .catch(() => {})
      }
      if (pageId) await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      if (productId) await page.request.delete(`/api/products/${productId}`).catch(() => {})
      if (serviceId) await page.request.delete(`/api/services/${serviceId}`).catch(() => {})
      if (programId) await page.request.delete(`/api/programs/${programId}`).catch(() => {})
      if (mediaId) await page.request.delete(`/api/media/${mediaId}`).catch(() => {})
      if (userId) await page.request.delete(`/api/users/${userId}`).catch(() => {})
    }
  })
})
