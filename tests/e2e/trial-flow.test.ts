import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test cho Luồng dùng thử 21 ngày (T2-04).
 *
 * Kịch bản:
 * 1. Bootstrap admin trên database CI độc lập (không có seed).
 * 2. Admin tạo sản phẩm digital_tool `habit-tracker-so` với trialDays: 21.
 * 3. Khách truy cập /dung-thu?san-pham=habit-tracker-so khi chưa đăng nhập
 *    -> chuyển hướng sang /tai-khoan/dang-nhap?next=...
 * 4. Khách yêu cầu mã OTP, nhận qua /api/test-otp (E2E_TEST_HOOKS=1), nhập mã và đăng nhập.
 * 5. Được đưa trở lại trang /dung-thu?san-pham=habit-tracker-so, bấm nút "Bắt đầu dùng thử 21 ngày".
 * 6. Trình duyệt chuyển hướng tới /habit/hoc (kiểm tra URL, không kiểm tra nội dung trang học).
 * 7. Mở lại /dung-thu?san-pham=habit-tracker-so -> thấy nút "Vào công cụ".
 * 8. Dọn dẹp dữ liệu trong khối finally (xóa admin cuối cùng).
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t2-04-${randomUUID()}@example.test`)
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
  const alert = page.locator('div[role="alert"]').filter({ hasText: /\S/ })
  await expect(codeInput.or(alert).first()).toBeVisible({ timeout: 15000 })
  if (await alert.isVisible()) {
    throw new Error(`OTP request failed on page: ${await alert.innerText()}`)
  }
  return codeInput
}

test.describe('Trial Flow (T2-04)', () => {
  test('khách chưa đăng nhập vào /dung-thu -> đăng nhập OTP -> bắt đầu dùng thử -> vào công cụ', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdCustomerId: number | undefined

    const customerEmail = `khach-trial-${randomUUID().slice(0, 6)}@example.test`

    // Mỗi lượt chạy một IP giả riêng (203.0.113.0/24) để không chạm rate limit
    const visitor = await browser.newContext({
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const guestPage = await visitor.newPage()

    try {
      // 1. Bootstrap admin
      adminId = await bootstrapAdmin(page)

      // 2. Admin tạo sản phẩm habit-tracker-so với trialDays = 21
      const prodRes = await page.request.post('/api/products', {
        data: {
          name: 'Habit Tracker Số',
          slug: 'habit-tracker-so',
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          salePrice: 178000,
          trialDays: 21,
          saleStatus: 'on_sale',
          _status: 'published',
        },
      })
      expect(prodRes.ok()).toBe(true)
      const createdProd = await prodRes.json()
      createdProductId = createdProd.doc.id

      // 3. Khách chưa đăng nhập mở /dung-thu?san-pham=habit-tracker-so -> chuyển hướng sang /tai-khoan/dang-nhap
      await guestPage.goto('/dung-thu?san-pham=habit-tracker-so')
      await expect(guestPage).toHaveURL(/\/tai-khoan\/dang-nhap/)

      // 4. Nhập email để xin OTP
      await guestPage.locator('input[type="email"]').fill(customerEmail)
      await guestPage.locator('button[type="submit"]').click()

      // Chờ form chuyển sang bước nhập OTP
      const codeInput = await expectCodeStep(guestPage)

      // 5. Lấy OTP từ /api/test-otp và đăng nhập
      const code = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(code)
      await guestPage.locator('button[type="submit"]').click()

      // 6. Sau khi đăng nhập thành công, chờ quay lại trang /dung-thu?san-pham=habit-tracker-so
      await expect(guestPage).toHaveURL(/\/dung-thu\?san-pham=habit-tracker-so/)

      // 7. Bấm nút "Bắt đầu dùng thử 21 ngày"
      const startButton = guestPage.locator('button', { hasText: /Bắt đầu dùng thử 21 ngày/i })
      await expect(startButton).toBeVisible()
      await startButton.click()

      // 8. Chờ chuyển hướng tới /habit/hoc (chỉ kiểm tra URL, không kiểm tra nội dung trang học)
      await expect(guestPage).toHaveURL(/\/habit\/hoc\/?$/)

      // 9. Mở lại /dung-thu?san-pham=habit-tracker-so -> thấy nút "Vào công cụ"
      await guestPage.goto('/dung-thu?san-pham=habit-tracker-so')
      const openToolLink = guestPage.locator('a', { hasText: /Vào công cụ/i })
      await expect(openToolLink).toBeVisible()

      // Ghi nhận ID khách để dọn dẹp
      const custLookup = await page.request.get(
        `/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}`,
      )
      if (custLookup.ok()) {
        const custData = await custLookup.json()
        if (custData.docs && custData.docs[0]) {
          createdCustomerId = custData.docs[0].id
        }
      }
    } finally {
      test.setTimeout(testInfo.timeout + 30000)

      if (createdCustomerId) {
        // Xóa entitlements của customer trước
        const entRes = await page.request
          .get(`/api/entitlements?where[customer][equals]=${createdCustomerId}`)
          .catch(() => null)
        if (entRes && entRes.ok()) {
          const entData = await entRes.json().catch(() => ({ docs: [] }))
          for (const ent of entData.docs || []) {
            await page.request.delete(`/api/entitlements/${ent.id}`).catch(() => {})
          }
        }
        await page.request.delete(`/api/customers/${createdCustomerId}`).catch(() => {})
      }

      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }

      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }

      await guestPage.close().catch(() => {})
      await visitor.close().catch(() => {})
    }
  })
})
