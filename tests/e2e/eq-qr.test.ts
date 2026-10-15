import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test cho trang thẻ mở từ QR (T3-03).
 *
 * Kịch bản:
 * 1. Khởi tạo tài khoản admin trên môi trường CI nếu DB chưa có người dùng.
 * 2. Admin tạo một thẻ EQ Buddy test đã xuất bản (_status = 'published') kèm thông điệp và câu chuyện.
 * 3. Người dùng khách (chưa đăng nhập, browser context mới hoàn toàn) truy cập trực tiếp
 *    đường dẫn in trên mã QR: /eq-buddy/the/<qrSlug>$
 * 4. Kiểm tra trang mở thành công (không chuyển hướng đăng nhập hay đòi mua),
 *    hiển thị đúng thông điệp và nội dung câu chuyện của thẻ.
 * 5. Dọn dẹp thẻ test và người dùng trong khối finally, đóng visitor context.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t3-03-${randomUUID()}@example.test`)
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

test.describe('EQ Card QR Page Flow (T3-03)', () => {
  test('khách không đăng nhập mở link QR thẻ -> thấy đúng thông điệp và câu chuyện', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let adminId: number | undefined
    let createdCardId: number | string | undefined

    const suffix = randomUUID().slice(0, 8)
    const cardCode = `EQ-TEST-${suffix}`
    const qrSlug = `test-qr-card-${suffix}`
    const expectedMessage = `Dừng lại một nhịp, lắng nghe chính mình trong tĩnh lặng (${suffix})`
    const expectedStory = `Đây là câu chuyện chữa lành đầy cảm hứng dành cho bạn hôm nay (${suffix}).`

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guestPage = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // 1. Tạo thẻ EQ Buddy test có đầy đủ thông điệp và câu chuyện (rich text Lexical)
      const cardRes = await page.request.post('/api/eqCards', {
        data: {
          code: cardCode,
          qrSlug,
          message: expectedMessage,
          story: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: expectedStory,
                      type: 'text',
                      style: '',
                      detail: 0,
                      format: 0,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                },
              ],
              direction: 'ltr',
            },
          },
          keywordEn: '[TEST] Keyword',
          promptRecall: '[TEST] Gợi nhớ?',
          promptPack: '[TEST] Gói ghém?',
          promptAcknowledge: '[TEST] Ghi nhận?',
          _status: 'published',
        },
      })
      expect(cardRes.ok()).toBe(true)
      const cardData = await cardRes.json()
      createdCardId = cardData.doc?.id || cardData.id

      // 2. Khách mở link QR không cần đăng nhập
      await guestPage.goto(`/eq-buddy/the/${qrSlug}`)

      // Neo URL chính xác với ký tự kết thúc $
      await expect(guestPage).toHaveURL(new RegExp(`/eq-buddy/the/${qrSlug}$`))

      // Kiểm tra thông điệp và câu chuyện hiển thị trên giao diện
      await expect(guestPage.getByText(expectedMessage)).toBeVisible({ timeout: 15000 })
      await expect(guestPage.getByText(expectedStory)).toBeVisible({ timeout: 15000 })
      await expect(guestPage.getByText('[TEST] Keyword')).toBeVisible()
      await expect(guestPage.getByText('[TEST] Ghi nhận?')).toBeVisible()
    } finally {
      // 3. Dọn dẹp dữ liệu kiểm thử
      try {
        if (createdCardId) {
          await page.request.delete(`/api/eqCards/${createdCardId}`)
        }
        if (adminId) {
          await page.request.delete(`/api/users/${adminId}`)
        }
      } catch {
        // Ignore deletion errors in test cleanup
      } finally {
        await visitor.close()
      }
    }
  })
})
