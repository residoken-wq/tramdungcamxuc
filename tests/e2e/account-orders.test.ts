import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test cho Tài khoản: "Đơn hàng của tôi" (T2-17).
 *
 * Kịch bản:
 * 1. Bootstrap admin trên database CI độc lập (không có seed).
 * 2. Admin tạo sản phẩm và khách hàng "Học viên Test 01" (@example.test).
 * 3. Admin tạo đơn hàng pending với createdByAdmin: true (tự sinh payToken).
 * 4. Khách truy cập /tai-khoan -> chuyển hướng sang /tai-khoan/dang-nhap?next=/tai-khoan
 * 5. Khách xin mã OTP (tick đồng ý, chờ Turnstile, bấm trong toPass), nhận mã và đăng nhập.
 * 6. Được chuyển hướng về /tai-khoan$, thấy đơn hàng pending + trạng thái "Chờ thanh toán".
 * 7. Bấm nút "Xem cách thanh toán" -> chuyển tới đúng /thanh-toan/don/<payToken>$.
 * 8. Dọn dẹp dữ liệu trong khối finally (order -> customer -> product -> admin user cuối cùng).
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t2-17-${randomUUID()}@example.test`)
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

test.describe('Account Orders Flow (T2-17)', () => {
  test('đăng nhập OTP -> thấy đơn pending -> bấm "Xem cách thanh toán" tới đúng trang', async ({
    page,
    browser,
  }) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdCustomerId: number | undefined
    let createdOrderId: number | undefined

    const customerEmail = `hoc-vien-01-${randomUUID().slice(0, 6)}@example.test`
    const customerName = 'Học viên Test 01'
    const productName = `Gói Trải Nghiệm E2E ${randomUUID().slice(0, 6)}`

    // IP giả lập riêng (203.0.113.0/24) tránh rate-limit
    const visitor = await browser.newContext({
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const guestPage = await visitor.newPage()

    try {
      // 1. Bootstrap admin
      adminId = await bootstrapAdmin(page)

      // 2. Admin tạo sản phẩm
      const prodRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: `goi-trai-nghiem-${randomUUID().slice(0, 6)}`,
          web: 'site',
          type: 'package',
          price: 1750000,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(prodRes.ok()).toBe(true)
      const createdProd = await prodRes.json()
      createdProductId = createdProd.doc.id

      // 3. Admin tạo customer
      const custRes = await page.request.post('/api/customers', {
        data: {
          email: customerEmail,
          name: customerName,
        },
      })
      expect(custRes.ok()).toBe(true)
      const createdCust = await custRes.json()
      createdCustomerId = createdCust.doc.id

      // 4. Admin tạo đơn hàng pending với createdByAdmin: true để sinh payToken
      const orderRes = await page.request.post('/api/orders', {
        data: {
          customer: createdCustomerId,
          items: [{ product: createdProductId, price: 1750000 }],
          subtotal: 1750000,
          total: 1750000,
          createdByAdmin: true,
        },
      })
      expect(orderRes.ok()).toBe(true)
      const createdOrder = await orderRes.json()
      createdOrderId = createdOrder.doc.id
      const payToken = createdOrder.doc.payToken
      expect(payToken).toBeDefined()

      // 5. Khách truy cập /tai-khoan -> chuyển hướng đăng nhập
      await guestPage.goto('/tai-khoan')
      await expect(guestPage).toHaveURL(/\/tai-khoan\/dang-nhap\?next=\/tai-khoan$/)

      // 6. Nhập email, tick đồng ý, chờ Turnstile rồi xin OTP
      await guestPage.locator('input[name="email"]').fill(customerEmail)
      await guestPage.locator('input[name="consentPolicy"]').check()
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })

      const submitBtn = guestPage.locator('button[type="submit"]')
      await expect(async () => {
        await submitBtn.click({ timeout: 5000 })
        const codeInput = guestPage.locator('input[name="code"]')
        await expect(codeInput).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 30000 })

      // Chờ form sang bước nhập mã OTP
      const codeInput = await expectCodeStep(guestPage)

      // 7. Lấy mã OTP và submit
      const code = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(code)
      await guestPage.locator('button[type="submit"]').click()

      // 8. Chờ chuyển hướng về /tai-khoan$
      await expect(guestPage).toHaveURL(/\/tai-khoan\/?$/, { timeout: 15000 })

      // 9. Thấy khối đơn hàng của tôi với đơn hàng vừa tạo
      const orderCard = guestPage.locator('[data-testid="customer-order-item"]').first()
      await expect(orderCard).toBeVisible()
      await expect(orderCard.getByText(productName)).toBeVisible()
      await expect(orderCard.getByText('Chờ thanh toán')).toBeVisible()

      // 10. Bấm "Xem cách thanh toán" -> chuyển tới /thanh-toan/don/<payToken>$
      const viewPaymentBtn = orderCard.getByRole('link', { name: /Xem cách thanh toán/i })
      await expect(viewPaymentBtn).toBeVisible()
      await viewPaymentBtn.click()

      // URL khớp với trang thanh toán đơn hàng
      const expectedUrlPattern = new RegExp(`/thanh-toan/don/${payToken}\\/?$`)
      await expect(guestPage).toHaveURL(expectedUrlPattern, { timeout: 15000 })
    } finally {
      // Dọn dẹp dữ liệu theo thứ tự ngược: orders -> customers -> products -> users
      if (createdOrderId) {
        await page.request.delete(`/api/orders/${createdOrderId}`).catch(() => {})
      }

      if (createdCustomerId) {
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
