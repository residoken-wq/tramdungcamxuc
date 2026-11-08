import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

// PK-27: LeadMagnetCarousel renders free digital tool with externalUrl link
// Test creates a free digital tool product with externalUrl = '/habit/chan-doan' via REST,
// publishes a page with LeadMagnetCarousel (display: 'list', mode: 'auto'),
// verifies the card and navigation on public page, checks 375 layout and a11y,
// and cleans up in finally. Runs on CI.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk27-${randomUUID()}@example.test`)
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

test.describe('PK-27: LeadMagnetCarousel free digital tool with externalUrl', () => {
  test('public page displays free digital tool card, clicks link to /habit/chan-doan, verifies 375px and clean a11y', async ({
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
    const pageSlug = `e2e-free-resources-${suffix}`
    const productSlug = `e2e-chan-doan-${suffix}`
    const productName = `[MẪU] Chẩn đoán điểm kẹt ${suffix}`

    let adminId: number | undefined
    let productId: number | undefined
    let pageId: number | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // 1. Tạo sản phẩm [MẪU] loại digital_tool, Miễn phí, có externalUrl = /habit/chan-doan
      const productRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: productSlug,
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'free',
          externalUrl: '/habit/chan-doan',
          ctaLabel: '[MẪU] Nhận công cụ miễn phí',
          _status: 'published',
        },
      })
      expect(productRes.ok(), await productRes.text()).toBe(true)
      productId = (await productRes.json()).doc.id

      // 2. Tạo trang có LeadMagnetCarousel (kiểu list, auto)
      const pageRes = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] Trang tài nguyên E2E ${suffix}`,
          slug: pageSlug,
          _status: 'published',
          puckData: {
            // QA PK-27b: same layout as the home page (half-width column next to the forms)
            content: [
              {
                type: 'Columns',
                props: {
                  id: `cols-${suffix}`,
                  numColumns: '2',
                  gap: 'lg',
                  bgColor: 'warm-ivory',
                  padding: 'lg',
                  col1: [
                    {
                      type: 'LeadMagnetCarousel',
                      props: {
                        id: `carousel-${suffix}`,
                        display: 'list',
                        mode: 'auto',
                        seriesLabel: '[MẪU] Lead magnet',
                        titleLine1: '[MẪU] QUÀ TẶNG MIỄN PHÍ',
                        titleLine2: '',
                        bgColor: 'warm-ivory',
                        padding: 'none',
                      },
                    },
                  ],
                  col2: [
                    {
                      type: 'ContactForms',
                      props: {
                        id: `forms-${suffix}`,
                        layout: 'tabs',
                        titleB2C: '[MẪU] Bắt đầu hành trình',
                        titleB2B: '[MẪU] Bắt đầu hành trình',
                        bgColor: 'warm-ivory',
                        padding: 'none',
                      },
                    },
                  ],
                  col3: [],
                },
              },
            ],
            root: { props: { title: `[MẪU] Trang tài nguyên E2E ${suffix}` } },
            zones: {},
          },
        },
      })
      expect(pageRes.ok(), await pageRes.text()).toBe(true)
      pageId = (await pageRes.json()).doc.id

      // 3. Kiểm tra trang công khai trên Desktop (1440px)
      await guest.setViewportSize({ width: 1440, height: 900 })
      const navRes = await guest.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      expect(navRes?.status()).toBe(200)

      // Thẻ hiện tên sản phẩm
      const cardTitle = guest.getByRole('heading', { name: productName })
      await expect(cardTitle).toBeVisible()

      // Nút hiển thị ctaLabel tùy chỉnh và liên kết đúng
      const ctaBtn = guest.getByRole('link', { name: /Nhận công cụ miễn phí/i })
      await expect(ctaBtn).toBeVisible()
      expect(await ctaBtn.getAttribute('href')).toBe('/habit/chan-doan')

      // QA PK-27b: the card is not squeezed – the title fits on a readable width
      const cardBox = await guest
        .locator('[data-eb-card]')
        .filter({ hasText: productName })
        .boundingBox()
      expect(cardBox?.width ?? 0).toBeGreaterThan(300)

      // Bấm nút -> điều hướng tới /habit/chan-doan
      await ctaBtn.click()
      await expect(guest).toHaveURL(/\/habit\/chan-doan/)

      // 4. Kiểm tra trên Mobile (375px)
      await guest.setViewportSize({ width: 375, height: 667 })
      await guest.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      await expect(guest.getByRole('heading', { name: productName })).toBeVisible()

      // Không cuộn ngang
      const scrollWidth = await guest.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await guest.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)

      // Axe không có lỗi nghiêm trọng
      await expectNoSeriousA11y(guest)

      // QA PK-27b: the builder preview shows the same card (it used to stay empty)
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.frameLocator('iframe').getByText(productName).first()).toBeVisible({
        timeout: 60000,
      })
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (productId) {
        await page.request.delete(`/api/products/${productId}`).catch(() => {})
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await guest.close().catch(() => {})
      await visitor.close().catch(() => {})
    }
  })
})
