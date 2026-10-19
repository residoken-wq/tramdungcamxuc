import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * End-to-End Test cho Luồng lưu thẻ EQ Buddy & Thẻ đã lưu trong tài khoản (T3-04).
 *
 * Kịch bản:
 * 1. Khởi tạo tài khoản admin trên môi trường CI nếu DB chưa có người dùng.
 * 2. Admin tạo thẻ EQ Buddy test đã xuất bản qua REST API /api/eqCards (đủ từ khóa, thông điệp, 3 câu hỏi).
 * 3. Khách truy cập trang thẻ -> bấm link "Đăng nhập để lưu" -> đăng nhập bằng OTP.
 * 4. Chuyển hướng quay lại đúng trang thẻ -> bấm nút "Lưu thẻ" -> nút chuyển sang "Đã lưu".
 * 5. Khách vào trang /tai-khoan -> thấy khối "Thẻ đã lưu" có thẻ vừa lưu.
 * 6. Khách bấm "Xóa" -> xác nhận xóa -> thẻ biến mất khỏi danh sách.
 * 7. Dọn dẹp thẻ test và người dùng trong khối finally.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t3-04-${randomUUID()}@example.test`)
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

async function getTestOtpCode(page: Page, email: string): Promise<string> {
  const res = await page.request.get(`/api/test-otp?email=${encodeURIComponent(email)}`)
  expect(res.status(), 'CI must run e2e with E2E_TEST_HOOKS=1').toBe(200)
  const data = (await res.json()) as { code?: string | null }
  if (!data.code) throw new Error(`No OTP recorded for ${email}`)
  return data.code
}

async function expectCodeStep(page: Page) {
  const codeInput = page.locator('input[name="code"]')
  // Bỏ qua thông báo chuyển trang của Next (#__next-route-announcer__, cũng role="alert"):
  // tới trang đăng nhập bằng link nên nó có chữ tiêu đề trang.
  const alert = page
    .locator('div[role="alert"]:not(#__next-route-announcer__)')
    .filter({ hasText: /\S/ })
  await expect(codeInput.or(alert).first()).toBeVisible({ timeout: 15000 })
  if (await alert.isVisible()) {
    throw new Error(`OTP request failed on page: ${await alert.innerText()}`)
  }
  return codeInput
}

test.describe('EQ Saved Cards Flow (T3-04)', () => {
  test('đăng nhập OTP -> mở trang thẻ -> lưu -> /tai-khoan thấy thẻ -> xóa -> biến mất', async ({
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
    const cardCode = `EQ-SAVE-${suffix}`
    const qrSlug = `test-saved-card-${suffix}`
    const keywordEn = `Gratitude ${suffix}`
    const message = `Lắng nghe và ôm ấp cảm xúc với lòng biết ơn (${suffix})`
    const customerEmail = `khach-saved-${suffix}@example.test`

    // IP riêng cho khách: giới hạn tần suất OTP không đụng các e2e khác
    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const guestPage = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // 1. Tạo thẻ EQ Buddy qua REST /api/eqCards (đủ từ khóa, thông điệp, 3 câu hỏi)
      const cardRes = await page.request.post('/api/eqCards', {
        data: {
          code: cardCode,
          keywordEn,
          qrSlug,
          message,
          promptRecall: `Gợi nhớ về một khoảnh khắc biết ơn (${suffix})`,
          promptPack: `Gói ghém bài học hôm nay (${suffix})`,
          promptAcknowledge: `Ghi nhận chính mình (${suffix})`,
          order: 9950,
          _status: 'published',
        },
      })
      expect(cardRes.ok()).toBe(true)
      const cardData = await cardRes.json()
      createdCardId = cardData.doc?.id

      // 2. Mở trang thẻ khi chưa đăng nhập -> thấy link Đăng nhập để lưu
      await guestPage.goto(`/eq-buddy/the/${qrSlug}`)
      const loginLink = guestPage.locator('a', { hasText: /Đăng nhập để lưu/i })
      await expect(loginLink).toBeVisible({ timeout: 15000 })
      await loginLink.click()

      // Chuyển hướng tới trang đăng nhập OTP
      await expect(guestPage).toHaveURL(new RegExp(`/tai-khoan/dang-nhap\\?next=.*${qrSlug}$`))

      // 3. Thực hiện đăng nhập OTP
      await guestPage.locator('input[name="email"]').fill(customerEmail)
      await guestPage.locator('input[name="consentPolicy"]').check()
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guestPage.locator('button[type="submit"]').click()

      const codeInput = await expectCodeStep(guestPage)
      const code = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(code)
      await guestPage.locator('button[type="submit"]').click()

      // 4. Quay lại đúng trang thẻ sau khi đăng nhập thành công
      await expect(guestPage).toHaveURL(new RegExp(`/eq-buddy/the/${qrSlug}$`), { timeout: 15000 })

      // 5. Nút "Lưu thẻ" xuất hiện và bấm lưu
      const saveCardBtn = guestPage.locator('button', { hasText: /^Lưu thẻ$/i })
      await expect(saveCardBtn).toBeVisible({ timeout: 10000 })

      await expect(async () => {
        await saveCardBtn.click({ timeout: 5000 })
        await expect(guestPage.locator('button', { hasText: /Đã lưu/i })).toBeVisible({
          timeout: 3000,
        })
      }).toPass({ timeout: 30000 })

      // 6. Vào /tai-khoan -> thấy khối "Thẻ đã lưu" chứa thẻ vừa lưu
      await guestPage.goto('/tai-khoan')
      await expect(guestPage).toHaveURL(/\/tai-khoan\/?$/)

      const savedCardItem = guestPage.locator(`[data-testid="saved-card-item-${cardCode}"]`)
      await expect(savedCardItem).toBeVisible({ timeout: 15000 })
      await expect(savedCardItem).toContainText(keywordEn)

      // 7. Bấm xóa thẻ -> hiện xác nhận -> bấm xác nhận xóa -> thẻ biến mất
      const deleteBtn = savedCardItem.locator('button', { hasText: /^Xóa$/i })
      await deleteBtn.click()

      const confirmDeleteBtn = savedCardItem.locator('button', { hasText: /Xác nhận xóa/i })
      await expect(confirmDeleteBtn).toBeVisible()
      await confirmDeleteBtn.click()

      await expect(savedCardItem).not.toBeVisible({ timeout: 15000 })
    } finally {
      if (createdCardId) {
        try {
          await page.request.delete(`/api/eqCards/${createdCardId}`)
        } catch {}
      }

      if (adminId) {
        try {
          await page.request.delete(`/api/users/${adminId}`)
        } catch {}
      }

      await visitor.close()
    }
  })
})
