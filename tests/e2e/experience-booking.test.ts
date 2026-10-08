import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

// E2E Test cho luồng đặt phiên trải nghiệm 149k, sinh mã VietQR và owner duyệt trong admin (T1-12b)
// Tự tạo dữ liệu (admin, cấu hình ngân hàng, sản phẩm coaching_trial) và dọn dẹp sạch sẽ sau test.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t1-12b-${randomUUID()}@example.test`)
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

test.describe('Experience booking & VietQR payment confirmation (T1-12b)', () => {
  test('khách đặt phiên trải nghiệm -> thấy QR và paymentRef -> owner xác nhận trong admin -> đơn đổi trạng thái', async ({
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

    let userId: number | undefined
    let productId: number | undefined
    let createdOrderId: number | undefined
    let customerId: number | undefined
    const slug = `e2e-phien-trai-nghiem-${randomUUID().slice(0, 8)}`
    const productName = `E2E Phiên trải nghiệm 1:1 ${randomUUID().slice(0, 6)}`
    const guestEmail = `khach-${randomUUID().slice(0, 6)}@example.test`

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      userId = await bootstrapAdmin(page)

      // 1. Owner cấu hình ngân hàng trong siteSettings qua REST API
      const patchSettings = await page.request.post('/api/globals/siteSettings', {
        data: {
          bankBin: '970422',
          bankName: 'Ngân hàng Quân Đội (MB)',
          accountNumber: '0023457923442',
          accountName: 'LUONG THI MAI HOA',
          experienceBookingUrl: 'https://cal.com/hana-luong/trai-nghiem',
        },
      })
      expect(patchSettings.ok(), 'Cấu hình ngân hàng trong siteSettings phải thành công').toBe(true)

      // 2. Tạo sản phẩm coaching_trial (149.000đ) đang mở bán
      const createProduct = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug,
          web: 'site',
          type: 'coaching_trial',
          saleStatus: 'on_sale',
          price: 250000,
          salePrice: 149000,
          _status: 'published',
        },
      })
      expect(createProduct.status(), await createProduct.text()).toBe(201)
      const productDoc = (await createProduct.json()).doc
      productId = productDoc.id

      // 3. Khách mở trang đặt phiên
      await guest.goto(`/dat-phien-trai-nghiem?san-pham=${productId}`)
      await expect(guest.getByRole('heading', { name: productName })).toBeVisible()
      await expect(guest.locator('span.text-bright-magenta', { hasText: '149.000đ' })).toBeVisible()

      // Điền thông tin đăng ký
      await guest.getByLabel(/Họ và tên/).fill('Trần Hoàng An')
      await guest.getByLabel(/Địa chỉ email/).fill(guestEmail)
      await guest.getByLabel(/Số điện thoại/).fill('0912345678')
      await guest
        .getByLabel(/Nhu cầu hoặc mục tiêu/)
        .fill('Mong muốn hiểu rõ cảm xúc bế tắc công việc')

      // Tick ô đồng ý điều khoản bắt buộc
      await guest.locator('input[type="checkbox"]').first().check()

      // Chờ token Turnstile (không dùng networkidle)
      await expect(guest.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })

      // Bấm nút tiếp tục thanh toán
      await guest.getByRole('button', { name: /Tiếp tục thanh toán VietQR/i }).click()

      // Chờ chuyển hướng tới trang đơn hàng công khai /thanh-toan/don/[token]
      await expect(guest).toHaveURL(/\/thanh-toan\/don\/[a-zA-Z0-9_-]+/, { timeout: 30000 })

      // Kiểm tra các thành phần trên trang đơn bằng heading và scoped transfer card
      await expect(
        guest.getByRole('heading', { name: /Thông tin chuyển khoản thanh toán/i }),
      ).toBeVisible()
      const transferCard = guest
        .getByRole('heading', { name: /Chi tiết chuyển khoản thủ công/i })
        .locator('..')
      await expect(transferCard.getByText('149.000đ')).toBeVisible()
      await expect(transferCard.getByText('0023457923442')).toBeVisible()
      await expect(transferCard.getByText('LUONG THI MAI HOA')).toBeVisible()

      // Kiểm tra có mã SVG VietQR qua data-testid="vietqr"
      const vietQrEl = guest.getByTestId('vietqr')
      await expect(vietQrEl).toBeVisible()
      await expect(vietQrEl.locator('svg')).toBeVisible()

      // Lấy mã paymentRef từ trang
      const paymentRefEl = guest.locator('.font-mono.text-bright-magenta')
      await expect(paymentRefEl).toBeVisible()
      const paymentRef = (await paymentRefEl.innerText()).trim()
      expect(paymentRef.startsWith('TDCX')).toBe(true)

      // 4. Lấy ID đơn hàng từ REST API qua paymentRef
      const orderQuery = await page.request.get(
        `/api/orders?where[paymentRef][equals]=${paymentRef}`,
      )
      expect(orderQuery.ok()).toBe(true)
      const orderDocs = (await orderQuery.json()).docs
      expect(orderDocs.length).toBe(1)
      const order = orderDocs[0]
      createdOrderId = order.id
      customerId = typeof order.customer === 'object' ? order.customer.id : order.customer
      expect(order.paymentStatus).toBe('pending')

      // 5. Owner vào trang chi tiết đơn hàng trong admin CMS
      await page.goto(`/admin/collections/orders/${createdOrderId}`)
      await expect(page.getByText(paymentRef)).toBeVisible()

      // Bấm nút "Xác nhận thanh toán" của component OrderActions
      const confirmButton = page.getByRole('button', { name: /Xác nhận thanh toán/i })
      await expect(confirmButton).toBeVisible()
      await confirmButton.click()

      // Xác nhận trong hộp thoại modal
      const modalConfirmButton = page.getByRole('button', { name: /Đồng ý xác nhận/i })
      await expect(modalConfirmButton).toBeVisible()
      await modalConfirmButton.click()

      // Chờ thông báo thành công
      await expect(page.getByText('Xác nhận thanh toán thành công')).toBeVisible({ timeout: 15000 })

      // 6. Khách tải lại trang đơn công khai: trạng thái chuyển sang "Đã thanh toán thành công"
      await guest.reload()
      await expect(guest.getByText(/Đã thanh toán thành công/i)).toBeVisible({ timeout: 15000 })
      await expect(
        guest.getByRole('heading', { name: /Cảm ơn bạn! Đơn hàng đã được xác nhận/i }),
      ).toBeVisible()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await visitor.close()

      // Dọn dẹp dữ liệu đúng thứ tự khóa ngoại: orders -> auditLogs -> customers -> products -> users
      if (createdOrderId) {
        await page.request.delete(`/api/orders/${createdOrderId}`)
      }
      if (customerId) {
        await page.request.delete(`/api/customers/${customerId}`)
      }
      if (productId) {
        await page.request.delete(`/api/products/${productId}`)
      }
      if (userId) {
        const deleted = await page.request.delete(`/api/users/${userId}`)
        expect(deleted.ok(), 'Temporary admin user must be deleted.').toBe(true)
      }
    }
  })
})
