import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

// E2E Test cho luồng link thanh toán gói Growth Mirror do Hana tạo + cấp quyền (T1-13)
// 1. Owner cấu hình ngân hàng + tạo 2 sản phẩm digital_tool + 1 gói package có 2 grantsProduct (REST)
// 2. Owner tạo đơn gói trong admin, sao chép link
// 3. Khách mở link -> thấy tóm tắt gói, KHÔNG thấy QR -> tick điều khoản -> thấy QR + paymentRef
// 4. Owner bấm "Xác nhận thanh toán" -> trang đơn chuyển sang "Đã thanh toán"
// 5. REST entitlements có đúng 2 bản ghi source = package

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t1-13-${randomUUID()}@example.test`)
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

test.describe('Package Payment Link & Entitlements Flow (T1-13)', () => {
  test('owner tạo đơn gói -> khách mở link thấy tóm tắt, tick điều khoản mới hiện QR -> owner duyệt -> cấp 2 entitlements', async ({
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
    let tool1Id: number | undefined
    let tool2Id: number | undefined
    let packageId: number | undefined
    let createdOrderId: number | undefined
    let customerId: number | undefined

    const pkgName = `E2E Gói BUILD Growth Mirror ${randomUUID().slice(0, 6)}`
    const guestEmail = `khach-goi-${randomUUID().slice(0, 6)}@example.test`

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
          transferPrefix: 'TDCX',
          experienceBookingUrl: 'https://cal.com/hana-luong/trai-nghiem',
        },
      })
      expect(patchSettings.ok(), 'Cấu hình ngân hàng trong siteSettings phải thành công').toBe(true)

      // 2. Tạo 2 sản phẩm digital_tool (REST)
      const resTool1 = await page.request.post('/api/products', {
        data: {
          name: 'E2E Habit Tracker Số',
          slug: `e2e-habit-tracker-${randomUUID().slice(0, 8)}`,
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          price: 250000,
          accessDurationDays: 365,
          _status: 'published',
        },
      })
      expect(resTool1.status()).toBe(201)
      tool1Id = (await resTool1.json()).doc.id

      const resTool2 = await page.request.post('/api/products', {
        data: {
          name: 'E2E EQ Buddy Số',
          slug: `e2e-eq-buddy-${randomUUID().slice(0, 8)}`,
          web: 'eq',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          price: 250000,
          accessDurationDays: null,
          _status: 'published',
        },
      })
      expect(resTool2.status()).toBe(201)
      tool2Id = (await resTool2.json()).doc.id

      // 3. Tạo 1 gói package có 2 grantsProduct (REST)
      const resPkg = await page.request.post('/api/products', {
        data: {
          name: pkgName,
          slug: `e2e-goi-build-${randomUUID().slice(0, 8)}`,
          web: 'site',
          type: 'package',
          saleStatus: 'on_sale',
          price: 2900000,
          _status: 'published',
          components: [
            {
              label: 'Habit Tracker Số 1 Năm',
              quantity: 1,
              unitValue: 250000,
              grantsProduct: tool1Id,
            },
            {
              label: 'EQ Buddy Số Vĩnh Viễn',
              quantity: 1,
              unitValue: 250000,
              grantsProduct: tool2Id,
            },
          ],
        },
      })
      expect(resPkg.status()).toBe(201)
      packageId = (await resPkg.json()).doc.id

      // 4. Tạo khách hàng qua REST
      const resCustomer = await page.request.post('/api/customers', {
        data: {
          name: 'Học viên Test 01',
          email: guestEmail,
        },
      })
      expect(resCustomer.status()).toBe(201)
      customerId = (await resCustomer.json()).doc.id

      // 5. Owner tạo đơn hàng gói đồng hành trong admin
      const resOrder = await page.request.post('/api/orders', {
        data: {
          customer: customerId,
          items: [{ product: packageId, price: 2900000 }],
          createdByAdmin: true,
        },
      })
      expect(resOrder.status()).toBe(201)
      const orderDoc = (await resOrder.json()).doc
      createdOrderId = orderDoc.id
      const payToken = orderDoc.payToken
      expect(payToken).toBeTruthy()
      expect(orderDoc.paymentStatus).toBe('pending')

      // 6. Khách mở link thanh toán gói /thanh-toan/don/[token]
      await guest.goto(`/thanh-toan/don/${payToken}`)

      // Thấy tóm tắt gói
      await expect(guest.getByRole('heading', { name: pkgName })).toBeVisible()
      await expect(guest.getByText('Habit Tracker Số 1 Năm')).toBeVisible()
      await expect(guest.getByText('EQ Buddy Số Vĩnh Viễn')).toBeVisible()
      await expect(
        guest.locator('span.text-bright-magenta', { hasText: '2.900.000đ' }),
      ).toBeVisible()

      // KHÔNG thấy mã QR trước khi đồng ý điều khoản
      await expect(guest.getByTestId('vietqr')).not.toBeVisible()

      // Tick ô đồng ý điều khoản
      const termsCheckbox = guest.getByTestId('terms-checkbox')
      await expect(termsCheckbox).toBeVisible()
      await termsCheckbox.check()

      // Sau khi tick -> hiển thị mã QR VietQR và paymentRef
      const vietQrEl = guest.getByTestId('vietqr')
      await expect(vietQrEl).toBeVisible({ timeout: 15000 })
      await expect(vietQrEl.locator('svg')).toBeVisible()

      const paymentRefEl = guest.locator('.font-mono.text-bright-magenta')
      await expect(paymentRefEl).toBeVisible()
      const paymentRef = (await paymentRefEl.innerText()).trim()
      expect(paymentRef.startsWith('TDCX')).toBe(true)

      // 7. Owner vào trang chi tiết đơn hàng trong CMS và bấm "Xác nhận thanh toán"
      await page.goto(`/admin/collections/orders/${createdOrderId}`)
      await expect(page.getByRole('heading', { name: paymentRef })).toBeVisible()

      const confirmButton = page.getByRole('button', { name: /Xác nhận thanh toán/i })
      await expect(confirmButton).toBeVisible()
      await confirmButton.click()

      // Xác nhận trong hộp thoại modal
      const modalConfirmButton = page.getByRole('button', { name: /Đồng ý xác nhận/i })
      await expect(modalConfirmButton).toBeVisible()
      await modalConfirmButton.click()

      // Chờ thông báo thành công
      await expect(page.getByText('Xác nhận thanh toán thành công.', { exact: true })).toBeVisible({
        timeout: 15000,
      })

      // 8. Khách tải lại trang đơn công khai -> trạng thái chuyển sang "Đã thanh toán thành công"
      await guest.reload()
      await expect(guest.getByText(/Đã thanh toán thành công/i)).toBeVisible({ timeout: 15000 })
      await expect(
        guest.getByRole('heading', { name: /Cảm ơn bạn! Đơn hàng đã được xác nhận/i }),
      ).toBeVisible()

      // 9. Kiểm tra REST API: entitlements có đúng 2 bản ghi source = package cho đơn này
      const entsQuery = await page.request.get(
        `/api/entitlements?where[order][equals]=${createdOrderId}&where[source][equals]=package`,
      )
      expect(entsQuery.ok()).toBe(true)
      const entsDocs = (await entsQuery.json()).docs
      expect(entsDocs.length).toBe(2)

      const grantedProducts = entsDocs.map((e: { product: number | { id: number } }) =>
        typeof e.product === 'object' ? e.product.id : e.product,
      )
      expect(grantedProducts).toContain(tool1Id)
      expect(grantedProducts).toContain(tool2Id)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await visitor.close()

      // Dọn dẹp dữ liệu theo thứ tự: entitlements -> orders -> customers -> products -> users
      if (createdOrderId) {
        const entsToDelete = await page.request.get(
          `/api/entitlements?where[order][equals]=${createdOrderId}`,
        )
        if (entsToDelete.ok()) {
          const docs = (await entsToDelete.json()).docs
          for (const doc of docs) {
            await page.request.delete(`/api/entitlements/${doc.id}`)
          }
        }
        await page.request.delete(`/api/orders/${createdOrderId}`)
      }

      if (customerId) {
        await page.request.delete(`/api/customers/${customerId}`)
      }

      if (packageId) {
        await page.request.delete(`/api/products/${packageId}`)
      }
      if (tool1Id) {
        await page.request.delete(`/api/products/${tool1Id}`)
      }
      if (tool2Id) {
        await page.request.delete(`/api/products/${tool2Id}`)
      }

      if (userId) {
        const deleted = await page.request.delete(`/api/users/${userId}`)
        expect(deleted.ok(), 'Temporary admin user must be deleted.').toBe(true)
      }
    }
  })
})
