import { expect, test } from '@playwright/test'

// E2E Test (T2-13): Owner xác nhận đơn đã hết hạn (status = 'failed')
// Kịch bản: Đơn hết hạn (failed), owner truy cập trang chi tiết đơn trong admin,
// thấy banner cảnh báo "Đơn đã quá hạn – chỉ xác nhận khi đã thấy tiền về",
// bấm "Xác nhận thanh toán", hộp thoại xác nhận nhắc lại cảnh báo,
// sau khi xác nhận, trang đơn của khách hàng cập nhật sang "Đã thanh toán".

test.describe('Owner confirms expired order (T2-13)', () => {
  test('đơn bị đẩy sang failed -> owner thấy cảnh báo và bấm xác nhận -> trang đơn của khách hiện đã thanh toán', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Chỉ chạy trên desktop-1440.')
    test.setTimeout(180000)

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    let orderId: number | undefined
    let payToken: string | undefined

    try {
      // 1. Đăng nhập tài khoản quản trị (owner)
      await page.goto('/admin', { waitUntil: 'domcontentloaded' })
      // Nếu chưa đăng nhập, thực hiện đăng nhập owner
      const emailField = page.locator('#field-email')
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailField.fill('owner@tramdungcamxuc.com')
        await page.locator('#field-password').fill(process.env.ADMIN_PASSWORD || 'secret123')
        await page.locator('button[type="submit"]').click()
        await expect(page).toHaveURL(/\/admin\/?$/)
      }

      // 2. Tạo đơn mẫu hoặc cập nhật một đơn sang trạng thái 'failed' qua REST API
      const orderRes = await page.request.post('/api/orders', {
        data: {
          items: [{ price: 149000 }],
          subtotal: 149000,
          total: 149000,
          paymentStatus: 'failed',
          termsAcceptedAt: new Date().toISOString(),
        },
      })

      if (orderRes.ok()) {
        const orderData = await orderRes.json()
        orderId = orderData.doc?.id
        payToken = orderData.doc?.payToken
      }

      test.skip(!orderId || !payToken, 'Cần đơn hàng mẫu để kiểm thử giao diện.')

      // 3. Khách mở trang thanh toán của đơn (lúc này đơn đã hết hạn)
      await guest.goto(`/thanh-toan/don/${payToken}`, { waitUntil: 'networkidle' })

      // 4. Owner mở trang chi tiết đơn hàng trong admin
      await page.goto(`/admin/collections/orders/${orderId}`, { waitUntil: 'networkidle' })

      // 5. Kiểm tra owner nhìn thấy cảnh báo đơn đã quá hạn
      const warningBanner = page.locator('[data-testid="order-expired-warning"]')
      await expect(warningBanner).toBeVisible()
      await expect(warningBanner).toContainText('Đơn đã quá hạn – chỉ xác nhận khi đã thấy tiền về')

      // 6. Kiểm tra nút "Xác nhận thanh toán" xuất hiện nhưng KHÔNG có nút "Hủy đơn hàng"
      const confirmBtn = page.locator('[data-testid="order-confirm-button"]')
      await expect(confirmBtn).toBeVisible()
      const cancelBtn = page.locator('[data-testid="order-cancel-button"]')
      await expect(cancelBtn).toHaveCount(0)

      // 7. Owner bấm nút Xác nhận thanh toán -> modal mở ra với lời nhắc cảnh báo
      await confirmBtn.click()
      const modal = page.locator('div[style*="z-index: 9999"]')
      await expect(modal).toBeVisible()
      await expect(modal).toContainText('Đơn đã quá hạn – chỉ xác nhận khi đã thấy tiền về')

      // 8. Bấm đồng ý xác nhận trong modal
      const agreeBtn = modal.locator('button', { hasText: 'Đồng ý xác nhận' })
      await agreeBtn.click()

      // 9. Kiểm tra phản hồi thành công trong admin
      await expect(page.locator('text=Xác nhận thanh toán thành công')).toBeVisible({
        timeout: 10000,
      })

      // 10. Khách tải lại trang đơn -> trạng thái cập nhật sang "Đã thanh toán"
      await guest.reload({ waitUntil: 'networkidle' })
      await expect(guest.locator('body')).toContainText('Đã thanh toán')
    } finally {
      await guest.close()
      await visitor.close()
    }
  })
})
