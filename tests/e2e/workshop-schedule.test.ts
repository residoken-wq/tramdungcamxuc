import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test cho Lịch workshop của tôi trong /tai-khoan (T2-10).
 *
 * Kịch bản:
 * 1. Bootstrap admin trên database CI độc lập (không có seed).
 * 2. Admin tạo sản phẩm gói Growth Mirror và tạo workshop "Tập thương cảm xúc"
 *    với audienceProducts liên kết tới gói đó.
 * 3. Tạo khách hàng và đơn gói do owner tạo (REST luôn ép `pending`), khách đồng ý điều khoản
 *    trên link thanh toán, owner bấm "Xác nhận thanh toán" trong CMS -> đơn `paid`.
 * 4. Khách hàng truy cập /tai-khoan/dang-nhap, yêu cầu mã OTP, nhận OTP qua /api/test-otp
 *    (với E2E_TEST_HOOKS=1 đã kích hoạt trên CI), và đăng nhập thành công.
 * 5. Tại /tai-khoan, kiểm tra khối "Lịch workshop của tôi" hiển thị đúng tên workshop,
 *    thời gian và huy hiệu trạng thái.
 * 6. Dọn dẹp dữ liệu (kể cả admin đầu tiên) trong khối finally: các test khác cần DB chưa có admin.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t2-10-${randomUUID()}@example.test`)
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

test.describe('Workshop Schedule in Account Page Flow (T2-10)', () => {
  test('khách mua gói đăng nhập OTP -> thấy lịch workshop trong trang /tai-khoan', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let adminId: number | undefined
    let createdPackageId: number | undefined
    let createdWorkshopId: number | undefined
    let createdCustomerId: number | undefined
    let createdOrderId: number | undefined

    const pkgName = `Gói BUILD E2E ${randomUUID().slice(0, 6)}`
    const workshopTitle = `Workshop E2E Tập thương cảm xúc ${randomUUID().slice(0, 6)}`
    const customerEmail = `khach-workshop-${randomUUID().slice(0, 6)}@example.test`

    // Mỗi lượt chạy một IP giả riêng (dải tài liệu 203.0.113.0/24): giới hạn 5 lần xin OTP / IP / 10 phút
    // được chia cho mọi test trên CI (cùng 127.0.0.1). Server lấy IP từ x-forwarded-for (sau proxy).
    const visitor = await browser.newContext({
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const guestPage = await visitor.newPage()

    try {
      // 1. Bootstrap admin
      adminId = await bootstrapAdmin(page)

      // Thông tin chuyển khoản GIẢ để trang thanh toán hiện QR
      const settingsRes = await page.request.post('/api/globals/siteSettings', {
        data: {
          bankBin: '970422',
          bankName: 'Ngân hàng Test',
          accountNumber: '0000000000',
          accountName: 'TAI KHOAN TEST',
          transferPrefix: 'TDCX',
        },
      })
      expect(settingsRes.ok()).toBe(true)

      // 2. Tạo sản phẩm gói Growth Mirror qua REST API
      const pkgRes = await page.request.post('/api/products', {
        data: {
          name: pkgName,
          slug: `goi-build-e2e-${randomUUID().slice(0, 8)}`,
          web: 'site',
          type: 'package',
          saleStatus: 'on_sale',
          price: 2900000,
          _status: 'published',
        },
      })
      expect(pkgRes.status(), 'Tạo sản phẩm gói phải thành công').toBe(201)
      createdPackageId = (await pkgRes.json()).doc.id

      // 3. Tạo workshop với audienceProducts chứa gói vừa tạo
      const futureStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      const futureEnd = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()

      const wsRes = await page.request.post('/api/workshops', {
        data: {
          title: workshopTitle,
          audienceProducts: [createdPackageId],
          startsAt: futureStart,
          endsAt: futureEnd,
          joinUrl: 'https://zoom.us/j/e2e-meeting-room',
          _status: 'published',
        },
      })
      expect(wsRes.status(), 'Tạo workshop phải thành công').toBe(201)
      createdWorkshopId = (await wsRes.json()).doc.id

      // 4. Tạo khách hàng qua REST API
      const custRes = await page.request.post('/api/customers', {
        data: {
          email: customerEmail,
          name: 'Khách Hàng E2E',
          consentAt: new Date().toISOString(),
        },
      })
      expect(custRes.status(), 'Tạo khách hàng phải thành công').toBe(201)
      createdCustomerId = (await custRes.json()).doc.id

      // 5. Đơn gói do owner tạo (REST luôn ép `pending`), khách đồng ý điều khoản, owner xác nhận
      const orderRes = await page.request.post('/api/orders', {
        data: {
          customer: createdCustomerId,
          items: [{ product: createdPackageId, price: 2900000 }],
          createdByAdmin: true,
        },
      })
      expect(orderRes.status(), 'Tạo đơn hàng phải thành công').toBe(201)
      const orderDoc = (await orderRes.json()).doc
      createdOrderId = orderDoc.id
      expect(orderDoc.paymentStatus).toBe('pending')

      await guestPage.goto(`/thanh-toan/don/${orderDoc.payToken}`)
      await guestPage.getByTestId('terms-checkbox').check()
      await expect(guestPage.getByTestId('vietqr')).toBeVisible({ timeout: 15000 })

      await page.goto(`/admin/collections/orders/${createdOrderId}`)
      await expect(page.getByRole('heading', { name: orderDoc.paymentRef })).toBeVisible({
        timeout: 15000,
      })
      // Bấm lại nếu lần đầu rơi vào lúc trang admin chưa hydrate (hộp xác nhận không mở).
      const modalConfirm = page.getByRole('button', { name: /Đồng ý xác nhận/i })
      await expect(async () => {
        await page.getByRole('button', { name: /Xác nhận thanh toán/i }).click({ timeout: 5000 })
        await expect(modalConfirm).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 30000 })
      await modalConfirm.click()
      await expect(page.getByText('Xác nhận thanh toán thành công.', { exact: true })).toBeVisible({
        timeout: 15000,
      })

      // 6. Khách hàng truy cập trang đăng nhập /tai-khoan/dang-nhap
      await guestPage.goto('/tai-khoan/dang-nhap')
      await expect(guestPage).toHaveTitle(/Đăng nhập/)

      // Nhập email
      const emailInput = guestPage.locator('input[name="email"]')
      await expect(emailInput).toBeVisible()
      await emailInput.fill(customerEmail)

      // Đồng ý điều khoản
      const consentCheckbox = guestPage.locator('input[name="consentPolicy"]')
      await expect(consentCheckbox).not.toBeChecked()
      await consentCheckbox.check()

      // Chờ Turnstile và gửi yêu cầu OTP
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      const sendOtpButton = guestPage.locator('button[type="submit"]')
      await sendOtpButton.click()

      // Chờ bước nhập OTP
      const codeInput = await expectCodeStep(guestPage)

      // Lấy OTP từ endpoint kiểm thử test-otp
      const otpCode = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(otpCode)

      // Xác nhận OTP
      const verifyButton = guestPage.locator('button[type="submit"]')
      await verifyButton.click()

      // 7. Chuyển hướng thành công tới /tai-khoan
      await expect(guestPage).toHaveURL(/\/tai-khoan\/?$/, { timeout: 15000 })
      await expect(guestPage.getByText(customerEmail).first()).toBeVisible()

      // 8. Kiểm tra khối "Lịch workshop của tôi" hiển thị workshop
      const workshopSection = guestPage.locator('text=Lịch workshop của tôi')
      await expect(workshopSection).toBeVisible()

      // Tên workshop hiển thị
      const workshopCard = guestPage.locator(`text=${workshopTitle}`)
      await expect(workshopCard).toBeVisible()

      // Thông báo link mở trước 60 phút
      await expect(guestPage.locator('text=Link sẽ mở 60 phút trước giờ học')).toBeVisible()
    } finally {
      // Đủ thời gian dọn dẹp kể cả khi phần thân đã dùng hết thời gian test
      test.setTimeout(testInfo.timeout + 30000)
      // Dọn dẹp dữ liệu
      await guestPage.close()
      await visitor.close()

      if (createdOrderId) {
        const ents = await page.request.get(
          `/api/entitlements?where[order][equals]=${createdOrderId}`,
        )
        if (ents.ok()) {
          for (const doc of (await ents.json()).docs as { id: number }[]) {
            await page.request.delete(`/api/entitlements/${doc.id}`).catch(() => {})
          }
        }
        await page.request.delete(`/api/orders/${createdOrderId}`).catch(() => {})
      }
      if (createdCustomerId) {
        await page.request.delete(`/api/customers/${createdCustomerId}`).catch(() => {})
      }
      if (createdWorkshopId) {
        await page.request.delete(`/api/workshops/${createdWorkshopId}`).catch(() => {})
      }
      if (createdPackageId) {
        await page.request.delete(`/api/products/${createdPackageId}`).catch(() => {})
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
    }
  })
})
