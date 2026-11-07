import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

// PK-24: Tab Kiểu – font khối và khoảng cách trên / dưới
// Test E2E tự tạo trang qua REST, kiểm tra getComputedStyle trên trang công khai ở cả 1440px và 375px,
// sau đó tự dọn dẹp dữ liệu trong finally.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk24-${randomUUID()}@example.test`)
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

test.describe('PK-24: Tab Kiểu font khối và khoảng đệm trên / dưới', () => {
  test('font khối áp cho mọi chữ (tiêu đề + đoạn văn) và cách lề trong trên = 0 thay thế khoảng đệm gốc của section', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')
    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const suffix = randomUUID().slice(0, 8)
    const slug = `e2e-pk24-${suffix}`
    let adminId: number | undefined
    let pageId: number | undefined
    let originalLock: Record<string, unknown> | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // QA PK-24c: a block font is only kept when the design system's font lock is open (owner
      // setting; locked on a fresh DB). Open it for the test and restore it in finally.
      const ds = await (await page.request.get('/api/globals/designSystem?depth=0')).json()
      originalLock = ds.lock
      const opened = await page.request.post('/api/globals/designSystem', {
        data: { lock: { ...ds.lock, fonts: 'open' } },
      })
      expect(opened.ok(), await opened.text()).toBe(true)

      const hdrId = `hdr-${suffix}`
      const quoteId = `quote-${suffix}`

      const res = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E PK-24 ${suffix}`,
          slug,
          _status: 'published',
          puckData: {
            root: { props: { title: `[MẪU] E2E PK-24 ${suffix}` } },
            content: [
              {
                type: 'SectionHeader',
                props: {
                  id: hdrId,
                  seriesLabel: '[MẪU] DÀNH CHO BẠN',
                  titleLine1: '[MẪU] TIÊU ĐỀ PHẦN 1',
                  titleLine2: '[MẪU] VỚI FONT PLAYFAIR',
                  emotionLine: '[MẪU] Dòng cảm xúc ấm áp và an yên',
                  _style: {
                    fontFamily: 'Playfair Display',
                    padding: {
                      desktop: { top: 'none' },
                      mobile: { top: 'none' },
                    },
                  },
                },
              },
              {
                type: 'QuoteBlock',
                props: {
                  id: quoteId,
                  quote: '[MẪU] Mọi cảm xúc đều xứng đáng được lắng nghe và tôn trọng.',
                  cite: '[MẪU] Tác giả',
                  roleOrContext: '[MẪU] Vai trò',
                  _style: {
                    fontFamily: 'Playfair Display',
                    padding: {
                      desktop: { top: 'none' },
                      mobile: { top: 'none' },
                    },
                  },
                },
              },
            ],
          },
        },
      })

      expect(res.ok(), await res.text()).toBe(true)
      pageId = (await res.json()).doc.id

      // 1. Kiểm tra trên màn hình Desktop (1440px)
      await guest.setViewportSize({ width: 1440, height: 900 })
      const navRes = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(navRes?.status()).toBe(200)

      const hdrWrapper = guest.locator(`[data-eb-id="${hdrId}"]`)
      await expect(hdrWrapper).toBeVisible()

      // Tiêu đề h2 mang font Playfair Display
      const hdrTitle = hdrWrapper.locator('h2').first()
      await expect(async () => {
        const font = await hdrTitle.evaluate((el) => window.getComputedStyle(el).fontFamily)
        expect(font.toLowerCase()).toContain('playfair')
      }).toPass({ timeout: 10000 })

      // Đoạn cảm xúc p mang font Playfair Display
      const hdrEmotion = hdrWrapper.locator('p').first()
      await expect(async () => {
        const font = await hdrEmotion.evaluate((el) => window.getComputedStyle(el).fontFamily)
        expect(font.toLowerCase()).toContain('playfair')
      }).toPass({ timeout: 10000 })

      // Section gốc bên trong (direct child) có padding-top: 0px (thay thế py-12 / py-14 mặc định)
      const hdrSection = hdrWrapper.locator('> *').first()
      await expect(async () => {
        const paddingTop = await hdrSection.evaluate((el) => window.getComputedStyle(el).paddingTop)
        expect(paddingTop).toBe('0px')
      }).toPass({ timeout: 10000 })

      // Kiểm tra QuoteBlock
      const quoteWrapper = guest.locator(`[data-eb-id="${quoteId}"]`)
      await expect(quoteWrapper).toBeVisible()
      // QA PK-24c: the quote itself is already Playfair (font-quote); the author line uses
      // font-ui (Montserrat), so it is the one that proves the block font reaches every text.
      const quoteAuthor = quoteWrapper.getByText('[MẪU] Tác giả', { exact: true })
      await expect(async () => {
        const font = await quoteAuthor.evaluate((el) => window.getComputedStyle(el).fontFamily)
        expect(font.toLowerCase()).toContain('playfair')
      }).toPass({ timeout: 10000 })

      const quoteSection = quoteWrapper.locator('> *').first()
      await expect(async () => {
        const paddingTop = await quoteSection.evaluate(
          (el) => window.getComputedStyle(el).paddingTop,
        )
        expect(paddingTop).toBe('0px')
      }).toPass({ timeout: 10000 })

      // 2. Kiểm tra trên màn hình Mobile (375px)
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.waitForTimeout(300) // Cho CSS reflow

      await expect(async () => {
        const font = await hdrTitle.evaluate((el) => window.getComputedStyle(el).fontFamily)
        expect(font.toLowerCase()).toContain('playfair')
      }).toPass({ timeout: 10000 })

      await expect(async () => {
        const paddingTop = await hdrSection.evaluate((el) => window.getComputedStyle(el).paddingTop)
        expect(paddingTop).toBe('0px')
      }).toPass({ timeout: 10000 })
    } finally {
      await visitor.close()
      if (originalLock) {
        await page.request
          .post('/api/globals/designSystem', { data: { lock: originalLock } })
          .catch(() => {})
      }
      if (pageId) await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      if (adminId) await page.request.delete(`/api/users/${adminId}`).catch(() => {})
    }
  })
})
