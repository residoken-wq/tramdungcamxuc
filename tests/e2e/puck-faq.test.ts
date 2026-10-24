import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-05: Draggable FaqItem child blocks with slot in FAQ (v4)
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.
// KHÔNG CHẠY trong luồng Pair Programming theo quy định task PK-05.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk05-${randomUUID()}@example.test`
  const password = randomUUID()
  await page.locator('#field-email').fill(email)
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
  const registered = await response.json()
  await expect(page).toHaveURL(/\/admin\/?$/)
  const userId = registered.user?.id || registered.doc?.id
  return { userId }
}

test.describe('PK-05: Draggable FaqItem child blocks in FAQ (v4)', () => {
  test('trang FAQ v3 thủ công vẫn hiện đủ câu (migration khi đọc); builder sửa câu 2, nhân bản câu 1, xuất bản thành 3 câu', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    const marker = randomUUID().slice(0, 8)
    const slug = `e2e-faq-item-${marker}`
    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      const q = (n: number, suffix = 'ban đầu') => `[MẪU] Câu hỏi số ${n} ${suffix} ${marker}`
      // 1. Trang đã xuất bản lưu FAQ **v3** thủ công: 3 câu, đánh số, câu giữa rỗng (v3 bỏ qua)
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E FAQ Page ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'FAQ',
                props: {
                  id: 'faq-e2e',
                  version: 3,
                  titleLine1: '[MẪU] GIẢI ĐÁP',
                  titleLine2: '[MẪU] THẮC MẮC',
                  source: 'manual',
                  numbered: true,
                  aside: 'none',
                  items: [
                    { question: q(1), answer: `[MẪU] Trả lời câu 1 ${marker}` },
                    { question: '', answer: '' },
                    { question: q(2), answer: `[MẪU] Trả lời câu 2 ${marker}` },
                  ],
                  bgColor: 'warm-ivory',
                  padding: 'md',
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E FAQ Page ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc?.id
      expect(pageId).toBeDefined()

      // 2. Trang công khai **trước khi mở builder**: đúng 2 câu theo thứ tự, câu 1 mở được
      const faqButtons = publicPage.locator('section[data-numbered] button[aria-expanded]')
      await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      await expect(faqButtons).toHaveCount(2)
      await expect(faqButtons.nth(0)).toContainText(q(1))
      await expect(faqButtons.nth(1)).toContainText(q(2))
      await expect(faqButtons.nth(0)).toHaveAttribute('aria-expanded', 'false')
      await faqButtons.nth(0).click()
      await expect(faqButtons.nth(0)).toHaveAttribute('aria-expanded', 'true')
      await expect(publicPage.getByText(`[MẪU] Trả lời câu 1 ${marker}`)).toBeVisible()

      // 3. Builder: sửa câu 2 trên field (nhãn đúng vi.ts), nhân bản câu 1
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const canvas = page.frameLocator('iframe')
      const q2InCanvas = canvas.getByText(q(2)).first()
      await expect(q2InCanvas).toBeVisible({ timeout: 30000 })

      const questionInput = page.getByRole('textbox', { name: 'Câu hỏi thắc mắc', exact: true })
      await expect(async () => {
        await q2InCanvas.click()
        await expect(questionInput).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await questionInput.fill(q(2, 'đã sửa'))
      await expect(canvas.getByText(q(2, 'đã sửa')).first()).toBeVisible()

      const q1InCanvas = canvas.getByText(q(1)).first()
      const duplicate = canvas.locator('button[title="Nhân bản"]').first()
      await expect(async () => {
        await q1InCanvas.click()
        await expect(duplicate).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await duplicate.click()
      await expect(canvas.getByText(q(1))).toHaveCount(2)

      // 4. Xuất bản; trang công khai: 3 câu theo thứ tự mới
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      await expect(async () => {
        await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
        await expect(faqButtons).toHaveCount(3, { timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await expect(faqButtons.nth(0)).toContainText(q(1))
      await expect(faqButtons.nth(1)).toContainText(q(1))
      await expect(faqButtons.nth(2)).toContainText(q(2, 'đã sửa'))
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary E2E page must be removed.').toBe(true)
        }
      } finally {
        if (userId) {
          try {
            await page.request.delete(`/api/users/${userId}`)
          } catch {
            // ignore cleanup errors
          }
        }
      }
    }
  })
})
