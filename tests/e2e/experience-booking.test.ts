import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

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
          accountNumber: '0000000000',
          accountName: 'TAI KHOAN TEST',
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
          isSample: true,
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
        .getByLabel(/Bạn đang trăn trở điều gì/)
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
      await expect(transferCard.getByText('0000000000')).toBeVisible()
      await expect(transferCard.getByText('TAI KHOAN TEST')).toBeVisible()

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
      await expect(page.getByRole('heading', { name: paymentRef })).toBeVisible()

      // Bấm nút "Xác nhận thanh toán" của component OrderActions
      const confirmButton = page.getByRole('button', { name: /Xác nhận thanh toán/i })
      await expect(confirmButton).toBeVisible()
      await confirmButton.click()

      // Xác nhận trong hộp thoại modal
      const modalConfirmButton = page.getByRole('button', { name: /Đồng ý xác nhận/i })
      await expect(modalConfirmButton).toBeVisible()
      await modalConfirmButton.click()

      // Chờ thông báo thành công. Exact match: the order form's field description also contains
      // "xác nhận thanh toán thành công", which made a substring wait pass before the action
      // finished and the guest reload below race the DB update (T1-17b root cause).
      await expect(page.getByText('Xác nhận thanh toán thành công.', { exact: true })).toBeVisible({
        timeout: 15000,
      })

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

  test('BX-06: Nút đặt lịch không dẫn tới 404 khi sản phẩm unbookable, fallback sang sản phẩm đang bán hoặc trang 200 tạm ngưng', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')

    let adminId: number | undefined
    let unbookableProductId: number | undefined
    let bookableProductId: number | undefined
    let pageId: number | undefined

    const suffix = randomUUID().slice(0, 8)
    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // 1. Tạo sản phẩm unbookable (loại coaching_trial, saleStatus = 'consult')
      const createUnbookable = await page.request.post('/api/products', {
        data: {
          name: `[MẪU] Phiên trải nghiệm Consult ${suffix}`,
          slug: `phien-trai-nghiem-consult-${suffix}`,
          web: 'site',
          type: 'coaching_trial',
          saleStatus: 'consult',
          price: 149000,
          isSample: true,
          _status: 'published',
        },
      })
      expect(createUnbookable.ok()).toBe(true)
      unbookableProductId = (await createUnbookable.json()).doc.id

      // 2. Tạo trang test có khối BookingCTA gắn với unbookableProductId
      const createPage = await page.request.post('/api/pages', {
        data: {
          title: `Test Page BX-06 ${suffix}`,
          slug: `test-bx06-${suffix}`,
          _status: 'published',
          puckData: {
            root: { props: { title: `Test Page BX-06 ${suffix}` } },
            content: [
              {
                type: 'BookingCTA',
                props: {
                  id: `booking-${suffix}`,
                  productId: unbookableProductId,
                  title: 'Đặt phiên trải nghiệm test',
                  buttonLabel: 'Đặt phiên ngay',
                },
              },
            ],
          },
        },
      })
      expect(createPage.ok()).toBe(true)
      pageId = (await createPage.json()).doc.id

      // Khi chưa có sản phẩm nào khác mở bán:
      // - Trang công khai: không có nút link tới sản phẩm consult đó
      await guest.goto(`/test-bx06-${suffix}`)
      const deadLink = guest.locator(
        `a[href*="/dat-phien-trai-nghiem?san-pham=${unbookableProductId}"]`,
      )
      await expect(deadLink).toHaveCount(0)

      // - Mở trực tiếp link cũ tới sản phẩm consult -> render trang tạm ngưng 200 (không 404)
      const pausedRes = await guest.goto(`/dat-phien-trai-nghiem?san-pham=${unbookableProductId}`)
      expect(pausedRes?.status()).toBe(200)
      await expect(guest.getByRole('heading', { name: /TẠM NGƯNG/i })).toBeVisible()
      await expect(
        guest.getByText(/Phiên trải nghiệm đang tạm ngưng nhận lịch/i).first(),
      ).toBeVisible()

      // Kiểm tra responsive 375px và a11y trên trang tạm ngưng
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 },
        baseURL: testInfo.project.use.baseURL,
      })
      const mobileGuest = await mobileContext.newPage()
      await mobileGuest.goto(`/dat-phien-trai-nghiem?san-pham=${unbookableProductId}`)
      const hasHorizontalScroll = await mobileGuest.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(hasHorizontalScroll).toBe(false)
      await expectNoSeriousA11y(mobileGuest, 'trang tạm ngưng nhận lịch 375px')
      await mobileContext.close()

      // 3. Tạo thêm 1 sản phẩm coaching_trial bookable (on_sale, giá > 0)
      const createBookable = await page.request.post('/api/products', {
        data: {
          name: `[MẪU] Phiên trải nghiệm Đang bán ${suffix}`,
          slug: `phien-trai-nghiem-on-sale-${suffix}`,
          web: 'site',
          type: 'coaching_trial',
          saleStatus: 'on_sale',
          price: 149000,
          isSample: true,
          _status: 'published',
        },
      })
      expect(createBookable.ok()).toBe(true)
      bookableProductId = (await createBookable.json()).doc.id

      // 4. Mở lại trang test: nút tự động xuất hiện và liên kết tới sản phẩm bookable mới
      await guest.goto(`/test-bx06-${suffix}`)
      const activeLink = guest.locator(
        `a[href*="/dat-phien-trai-nghiem?san-pham=${bookableProductId}"]`,
      )
      await expect(activeLink).toBeVisible()

      // 5. Mở lại link cũ của sản phẩm consult: tự chuyển hướng (307) sang sản phẩm bookable
      await guest.goto(`/dat-phien-trai-nghiem?san-pham=${unbookableProductId}`)
      await expect(guest).toHaveURL(
        new RegExp(`/dat-phien-trai-nghiem\\?san-pham=${bookableProductId}`),
      )
      await expect(
        guest.getByRole('heading', { name: `[MẪU] Phiên trải nghiệm Đang bán ${suffix}` }),
      ).toBeVisible()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await visitor.close()

      // Dọn dẹp dữ liệu
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`)
      }
      if (unbookableProductId) {
        await page.request.delete(`/api/products/${unbookableProductId}`)
      }
      if (bookableProductId) {
        await page.request.delete(`/api/products/${bookableProductId}`)
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`)
      }
    }
  })
})
