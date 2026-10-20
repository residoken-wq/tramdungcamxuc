import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

// SM-06: trang Liên hệ dựng bằng Puck (ContactInfo + ContactForms + FAQ theo nhóm) và trang
// /cau-hoi-thuong-gap. CI chạy trên DB chưa seed → test tự tạo dữ liệu qua REST rồi tự dọn.

async function bootstrapAdmin(page: Page): Promise<void> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`sm-06-${randomUUID()}@example.test`)
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
}

test.describe('SM-06: Trang Liên hệ và Câu hỏi thường gặp', () => {
  test('liên hệ lấy từ CMS, form 2 cột / tab, FAQ theo nhóm, trang FAQ tìm kiếm + anchor', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    const marker = randomUUID().slice(0, 8)
    const pageSlug = `e2e-lien-he-${marker}`
    const question = `[MẪU] Câu hỏi E2E ${marker}`
    let faqId: number | undefined
    let pageId: number | undefined
    let previousSettings: Record<string, unknown> | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      await bootstrapAdmin(page)

      // 1. Thông tin liên hệ trong Cài đặt chung (giữ bản cũ để trả lại).
      previousSettings = await (await page.request.get('/api/globals/siteSettings')).json()
      const settings = await page.request.post('/api/globals/siteSettings', {
        data: {
          email: `lien-he-${marker}@example.test`,
          hotline: '0900 000 000',
          leadStatusOptions: [{ label: '[MẪU] Tình trạng Test 01' }],
        },
      })
      expect(settings.ok()).toBe(true)

      // 2. Một câu FAQ đã xuất bản, nhóm "general".
      const faq = await page.request.post('/api/faqs', {
        data: {
          question,
          answer: '[MẪU] Câu trả lời E2E.',
          group: 'general',
          order: 0,
          _status: 'published',
        },
      })
      expect(faq.ok()).toBe(true)
      faqId = (await faq.json()).doc.id

      // 3. Trang Puck: ContactInfo + ContactForms (tabs) + FAQ lấy theo nhóm.
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] Liên hệ E2E ${marker}`,
          slug: pageSlug,
          _status: 'published',
          puckData: {
            root: { props: {} },
            content: [
              {
                type: 'ContactInfo',
                props: { id: 'e2e-contact-info', version: 1, titleLine1: '[MẪU] LIÊN HỆ' },
              },
              {
                type: 'ContactForms',
                props: {
                  id: 'e2e-contact-forms',
                  version: 1,
                  layout: 'tabs',
                  titleB2C: '[MẪU] Dành cho Cá nhân',
                  titleB2B: '[MẪU] Dành cho Doanh nghiệp',
                },
              },
              {
                type: 'FAQ',
                props: {
                  id: 'e2e-faq',
                  version: 3,
                  source: 'group',
                  group: 'general',
                  limit: 5,
                  items: [],
                  titleLine1: '[MẪU] HỎI ĐÁP',
                },
              },
            ],
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 4. Khách xem trang: email / hotline từ CMS, form tab, câu FAQ theo nhóm, link "Xem toàn bộ".
      await guest.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      await expect(guest.locator(`a[href="mailto:lien-he-${marker}@example.test"]`)).toBeVisible()
      await expect(guest.locator('a[href="tel:0900000000"]')).toBeVisible()

      const tabB2C = guest.getByRole('tab', { name: /Cá nhân/i })
      const tabB2B = guest.getByRole('tab', { name: /Doanh nghiệp/i })
      await expect(tabB2C).toHaveAttribute('aria-selected', 'true')
      await tabB2C.focus()
      await guest.keyboard.press('ArrowRight')
      await expect(tabB2B).toHaveAttribute('aria-selected', 'true')

      await expect(guest.getByText(question)).toBeVisible()
      await expect(guest.locator('a[href^="/cau-hoi-thuong-gap#general"]').first()).toBeVisible()

      // 5. Trang FAQ: nhóm có anchor, tìm kiếm lọc đúng, không khớp → trạng thái rỗng.
      await guest.goto('/cau-hoi-thuong-gap', { waitUntil: 'domcontentloaded' })
      await expect(guest.locator('#general')).toBeVisible()
      await expect(guest.getByText(question)).toBeVisible()

      await guest.goto(`/cau-hoi-thuong-gap?q=${marker}`, { waitUntil: 'domcontentloaded' })
      await expect(guest.getByText(question)).toBeVisible()

      await guest.goto('/cau-hoi-thuong-gap?q=khong-co-cau-nao-khop-xyz', {
        waitUntil: 'domcontentloaded',
      })
      await expect(guest.getByText(question)).toHaveCount(0)
      const clearSearch = guest.getByRole('link', { name: /Xóa tìm kiếm/i }).first()
      await expect(clearSearch).toBeVisible()
      await clearSearch.click()
      await expect(guest).toHaveURL(/\/cau-hoi-thuong-gap$/)

      // 6. CTA cuối trang FAQ dẫn tới Liên hệ; 375px không tràn ngang.
      await expect(guest.locator('a[href="/lien-he"]').first()).toBeVisible()
      await guest.setViewportSize({ width: 375, height: 667 })
      await guest.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      const overflow = await guest.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(overflow).toBe(false)
    } finally {
      await visitor.close().catch(() => {})
      if (pageId) await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      if (faqId) await page.request.delete(`/api/faqs/${faqId}`).catch(() => {})
      if (previousSettings) {
        await page.request
          .post('/api/globals/siteSettings', {
            data: {
              email: previousSettings.email ?? null,
              hotline: previousSettings.hotline ?? null,
              leadStatusOptions: previousSettings.leadStatusOptions ?? [],
            },
          })
          .catch(() => {})
      }
    }
  })
})
