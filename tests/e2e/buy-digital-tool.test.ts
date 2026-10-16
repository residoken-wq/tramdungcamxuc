import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

// E2E Test cho luồng Mua công cụ số với xác nhận thủ công (T2-08)
// 1. Tự tạo admin (bootstrapAdmin), sản phẩm digital_tool, thông tin ngân hàng giả (TAI KHOAN TEST)
// 2. Khách dùng IP giả riêng (x-forwarded-for: 203.0.113.x) đăng nhập OTP
// 3. Khách vào /thanh-toan?san-pham=<slug> -> tick điều khoản -> thấy QR tại /thanh-toan/don/<payToken>
// 4. Owner bấm "Xác nhận thanh toán" trong admin
// 5. Khách thấy "Đang hiệu lực" ở /tai-khoan
// 6. Xóa dữ liệu và admin trong finally (không mật khẩu cứng, không test.skip)

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminP@ss!${randomUUID()}`
  await page.locator('#field-email').fill(`t2-08-admin-${randomUUID()}@example.test`)
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

test.describe('Buy Digital Tool Flow (T2-08)', () => {
  test('khách đăng nhập OTP -> mua công cụ số -> owner xác nhận -> khách thấy Đang hiệu lực trong /tai-khoan', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let userId: number | undefined
    let productId: number | undefined
    let customerId: number | undefined
    let createdOrderId: number | undefined

    const toolName = `E2E Habit Tracker Số ${randomUUID().slice(0, 6)}`
    const toolSlug = `e2e-habit-tool-${randomUUID().slice(0, 8)}`
    const guestEmail = `khach-tool-${randomUUID().slice(0, 6)}@example.test`

    // Context của khách có IP giả riêng để tránh giới hạn rate limit 5 lần / IP trên CI
    const visitorIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`
    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      extraHTTPHeaders: {
        'x-forwarded-for': visitorIp,
      },
    })
    const guest = await visitor.newPage()

    try {
      userId = await bootstrapAdmin(page)

      // 1. Cấu hình thông tin ngân hàng giả (TAI KHOAN TEST)
      const patchSettings = await page.request.post('/api/globals/siteSettings', {
        data: {
          bankBin: '970422',
          bankName: 'Ngân hàng Quân Đội (MB)',
          accountNumber: '0000000000',
          accountName: 'TAI KHOAN TEST',
          transferPrefix: 'TDCX',
        },
      })
      expect(patchSettings.ok(), 'Cấu hình ngân hàng trong siteSettings phải thành công').toBe(true)

      // 2. Tạo sản phẩm digital_tool (REST)
      const resTool = await page.request.post('/api/products', {
        data: {
          name: toolName,
          slug: toolSlug,
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          price: 250000,
          salePrice: 178000,
          accessDurationDays: null, // Vĩnh viễn
          trialDays: 21,
          isSample: true,
          _status: 'published',
        },
      })
      expect(resTool.status()).toBe(201)
      productId = (await resTool.json()).doc.id

      // 3. Khách đăng nhập qua OTP tại /tai-khoan/dang-nhap
      await guest.goto('/tai-khoan/dang-nhap')
      const emailInput = guest.locator('input[name="email"]')
      await expect(emailInput).toBeVisible()
      await emailInput.fill(guestEmail)

      const consentCheckbox = guest.locator('input[name="consentPolicy"]')
      await consentCheckbox.check()

      await expect(guest.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      const sendOtpButton = guest.locator('button[type="submit"]')
      await sendOtpButton.click()

      const codeInput = await expectCodeStep(guest)
      const otpCode = await getTestOtpCode(guest, guestEmail)
      await codeInput.fill(otpCode)

      const verifyButton = guest.locator('button[type="submit"]')
      await verifyButton.click()

      await expect(guest).toHaveURL(/\/tai-khoan\/?$/, { timeout: 15000 })
      await expect(guest.getByText(guestEmail).first()).toBeVisible()

      // Lấy customerId đã được tạo sau khi đăng nhập OTP
      const custQuery = await page.request.get(
        `/api/customers?where[email][equals]=${encodeURIComponent(guestEmail)}`,
      )
      if (custQuery.ok()) {
        const custDocs = (await custQuery.json()).docs
        if (custDocs.length > 0) {
          customerId = custDocs[0].id
        }
      }

      // 4. Khách truy cập /thanh-toan?san-pham=<slug>
      await guest.goto(`/thanh-toan?san-pham=${toolSlug}`)
      await expect(guest.getByRole('heading', { name: toolName })).toBeVisible()
      await expect(guest.getByText('Dùng vĩnh viễn')).toBeVisible()

      // Ô điều khoản không tick sẵn
      const termsCheckbox = guest.getByTestId('checkout-terms-checkbox')
      await expect(termsCheckbox).not.toBeChecked()
      await termsCheckbox.check()

      // Bấm "Thanh toán"
      const payButton = guest.getByTestId('checkout-submit-button')
      await payButton.click()

      // Chuyển hướng sang /thanh-toan/don/<payToken>
      await expect(guest).toHaveURL(/\/thanh-toan\/don\/[A-Za-z0-9_-]+/, { timeout: 15000 })
      const vietQrEl = guest.getByTestId('vietqr')
      await expect(vietQrEl).toBeVisible({ timeout: 15000 })
      await expect(vietQrEl.locator('svg')).toBeVisible()

      const paymentRefEl = guest.locator('.font-mono.text-bright-magenta')
      await expect(paymentRefEl).toBeVisible()
      const paymentRef = (await paymentRefEl.innerText()).trim()
      expect(paymentRef.startsWith('TDCX')).toBe(true)

      // Tìm ID của đơn hàng vừa tạo qua REST
      const currentUrl = guest.url()
      const payToken = currentUrl.split('/thanh-toan/don/')[1]?.split('?')[0]
      expect(payToken).toBeTruthy()

      const orderQuery = await page.request.get(
        `/api/orders?where[payToken][equals]=${encodeURIComponent(payToken!)}`,
      )
      expect(orderQuery.ok()).toBe(true)
      const orderDocs = (await orderQuery.json()).docs
      expect(orderDocs.length).toBe(1)
      createdOrderId = orderDocs[0].id

      // 5. Owner vào admin xác nhận thanh toán thủ công
      await page.goto(`/admin/collections/orders/${createdOrderId}`)
      // Chờ trang admin hiện mã đơn hàng
      await expect(page.getByRole('heading', { name: paymentRef })).toBeVisible({ timeout: 15000 })

      // Bấm nút "Xác nhận thanh toán" (bấm lại trong toPass nếu hộp xác nhận chưa mở)
      const modalConfirmButton = page.getByRole('button', { name: /Đồng ý xác nhận/i })
      await expect(async () => {
        const confirmButton = page.getByRole('button', { name: /Xác nhận thanh toán/i })
        await expect(confirmButton).toBeVisible()
        await confirmButton.click()
        await expect(modalConfirmButton).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 15000 })

      await modalConfirmButton.click()

      // Chờ thông báo thành công
      await expect(page.getByText('Xác nhận thanh toán thành công.', { exact: true })).toBeVisible({
        timeout: 15000,
      })

      // 6. Khách mở lại /tai-khoan và thấy "Đang hiệu lực"
      await guest.goto('/tai-khoan')
      const courseItem = guest.getByTestId(`course-item-${toolSlug}`)
      await expect(courseItem).toBeVisible({ timeout: 15000 })
      await expect(courseItem.getByRole('heading', { name: toolName })).toBeVisible()
      await expect(
        courseItem.locator('[data-testid="entitlement-status-badge"]', {
          hasText: 'Đang hiệu lực',
        }),
      ).toBeVisible()
      await expect(courseItem.getByRole('link', { name: /Vào học \/ Mở công cụ/i })).toBeVisible()
    } finally {
      // Đặt timeout thêm 30s đầu khối finally như yêu cầu
      test.setTimeout(testInfo.timeout + 30000)
      await visitor.close()

      // Dọn dẹp dữ liệu theo thứ tự FK: entitlements -> orders -> customers -> products -> users
      if (createdOrderId) {
        const entsToDelete = await page.request.get(
          `/api/entitlements?where[order][equals]=${createdOrderId}`,
        )
        if (entsToDelete.ok()) {
          const docs = (await entsToDelete.json()).docs
          for (const doc of docs) {
            await page.request.delete(`/api/entitlements/${doc.id}`).catch(() => {})
          }
        }
        await page.request.delete(`/api/orders/${createdOrderId}`).catch(() => {})
      }

      if (customerId) {
        // Xóa bất kỳ entitlement nào còn sót lại của customer
        const custEnts = await page.request.get(
          `/api/entitlements?where[customer][equals]=${customerId}`,
        )
        if (custEnts.ok()) {
          const docs = (await custEnts.json()).docs
          for (const doc of docs) {
            await page.request.delete(`/api/entitlements/${doc.id}`).catch(() => {})
          }
        }
        await page.request.delete(`/api/customers/${customerId}`).catch(() => {})
      }

      if (productId) {
        await page.request.delete(`/api/products/${productId}`).catch(() => {})
      }

      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
