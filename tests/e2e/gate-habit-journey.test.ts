import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

/**
 * T3-06a: GĐ 2 Habit Formation Gate Test – Single Connected E2E Journey
 *
 * Kịch bản xuyên suốt:
 * 1. Bootstrap admin trên database CI độc lập (không có seed).
 * 2. Cấu hình thông tin ngân hàng trong siteSettings.
 * 3. Tạo sản phẩm Habit Tracker số (slug: 'habit-tracker-so', type: 'digital_tool', trialDays: 21).
 * 4. Tạo module + bài học video mẫu để kiểm tra trang học.
 * 5. Khách vãng lai truy cập landing `/habit/1-percent-better` -> kiểm tra CTA dùng thử + a11y.
 * 6. Đăng ký dùng thử qua luồng OTP -> vào `/habit/hoc` xem bài học đầu tiên -> đánh dấu đã xem + a11y.
 * 7. Vào `/habit/tracker` -> thiết lập kế hoạch mẫu -> check-in ngày 1 (chọn cảm xúc Bình an) -> grid cập nhật + a11y.
 * 8. Chuyển đổi từ dùng thử sang mua thật: tới `/thanh-toan?san-pham=habit-tracker-so` -> tạo đơn chuyển khoản -> owner xác nhận thanh toán.
 * 9. Vào `/tai-khoan` -> kiểm tra quyền truy cập chuyển sang 'Đang hiệu lực' vĩnh viễn, quay lại `/habit/tracker` kiểm tra ngày 1 đã tick vẫn giữ nguyên.
 * 10. Dọn dẹp trong finally theo thứ tự khóa ngoại: entitlements -> orders -> lessonProgress -> checkins -> plans
 *     -> lessons -> modules -> product -> admin; khôi phục siteSettings. Khách hàng không xóa được qua REST
 *     (Customers.beforeDelete chỉ cho phép luồng xóa tài khoản) – DB CI dùng một lần.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminGateHabit-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-gate-habit-${randomUUID()}@example.test`)
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
  // Bỏ qua thông báo chuyển trang của Next (#__next-route-announcer__, cũng role="alert")
  const alert = page
    .locator('div[role="alert"]:not(#__next-route-announcer__)')
    .filter({ hasText: /\S/ })
  await expect(codeInput.or(alert).first()).toBeVisible({ timeout: 15000 })
  if (await alert.isVisible()) {
    throw new Error(`OTP request failed on page: ${await alert.innerText()}`)
  }
  return codeInput
}

test.describe('GD2 Habit Formation Journey Gate (T3-06a)', () => {
  test('single connected journey: offer landing -> trial OTP -> learning -> tracker checkin -> checkout -> permanent entitlement verification', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(240000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdModuleId: number | undefined
    let createdLessonId: number | undefined
    let createdCustomerId: number | undefined
    let createdOrderId: number | undefined
    let settingsBefore: Record<string, unknown> | undefined

    const customerEmail = `khach-gate-habit-${randomUUID().slice(0, 6)}@example.test`
    const productSlug = 'habit-tracker-so'
    const productName = '[TEST] Habit Tracker (Gate E2E)'

    const visitorIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`
    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      extraHTTPHeaders: {
        'x-forwarded-for': visitorIp,
      },
    })
    const guestPage = await visitor.newPage()

    try {
      // 1. Bootstrap admin
      adminId = await bootstrapAdmin(page)

      // 2. Cấu hình ngân hàng trong siteSettings để luồng checkout VietQR hoạt động (khôi phục trong finally)
      settingsBefore = (await (
        await page.request.get('/api/globals/siteSettings')
      ).json()) as Record<string, unknown>
      const patchSettings = await page.request.post('/api/globals/siteSettings', {
        data: {
          bankBin: '970422',
          bankName: 'Ngân hàng Quân Đội (MB)',
          accountNumber: '0000000000',
          accountName: 'TAI KHOAN TEST',
          transferPrefix: 'TDCX',
        },
      })
      expect(patchSettings.ok()).toBe(true)

      // 3. Admin tạo sản phẩm Habit Tracker số (slug: 'habit-tracker-so', type: 'digital_tool', trialDays: 21)
      const prodRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: productSlug,
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          salePrice: 178000,
          trialDays: 21,
          accessDurationDays: null,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(prodRes.status()).toBe(201)
      createdProductId = (await prodRes.json()).doc.id

      // 4. Admin tạo module bài học
      const modRes = await page.request.post('/api/courseModules', {
        data: {
          title: `E2E Nhóm Thói Quen ${randomUUID().slice(0, 6)}`,
          group: 'insight',
          order: 1,
          _status: 'published',
        },
      })
      expect(modRes.status()).toBe(201)
      createdModuleId = (await modRes.json()).doc.id

      // 5. Admin tạo bài học chính (trả phí, mở qua trial)
      const lessonRes = await page.request.post('/api/lessons', {
        data: {
          title: `E2E Bài 1: Thiết lập thói quen ${randomUUID().slice(0, 6)}`,
          module: createdModuleId,
          videoId: 'bunny_video_e2e_gate_habit',
          durationSec: 180,
          isFreePreview: false,
          order: 1,
          _status: 'published',
        },
      })
      expect(lessonRes.status()).toBe(201)
      createdLessonId = (await lessonRes.json()).doc.id

      // 6. Khách vãng lai truy cập trang offer /habit/1-percent-better (đọc sản phẩm habit-tracker-so)
      await guestPage.goto('/habit/1-percent-better', { waitUntil: 'load' })
      await expect(guestPage.getByRole('heading', { level: 1 })).toBeVisible()

      // Chạy a11y audit tại landing /habit/1-percent-better
      await expectNoSeriousA11y(guestPage, 'habit-journey-landing')

      // Kiểm tra CTA dùng thử
      const trialCta = guestPage.locator(`a[href*="/dung-thu?san-pham=${productSlug}"]`).first()
      await expect(trialCta).toBeVisible()
      await trialCta.click()

      // 7. Chuyển hướng sang /tai-khoan/dang-nhap vì chưa đăng nhập
      await expect(guestPage).toHaveURL(
        new RegExp(`/tai-khoan/dang-nhap\\?next=.*${encodeURIComponent(productSlug)}`),
        { timeout: 15000 },
      )

      // Điền email và tick đồng ý chính sách, chờ Turnstile rồi gửi mã OTP
      await guestPage.locator('input[name="email"]').fill(customerEmail)
      await guestPage.locator('input[name="consentPolicy"]').check()
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guestPage.locator('button[type="submit"]').click()

      const codeInput = await expectCodeStep(guestPage)
      const otpCode = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(otpCode)
      await guestPage.locator('button[type="submit"]').click()

      // Đăng nhập xong quay lại /dung-thu?san-pham=habit-tracker-so
      await expect(guestPage).toHaveURL(new RegExp(`/dung-thu\\?san-pham=${productSlug}`), {
        timeout: 15000,
      })

      // Ghi nhận customer ID để dọn dẹp (sau khi đăng nhập xong mới chắc chắn đã có bản ghi)
      const custQuery = await page.request.get(
        `/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}`,
      )
      expect(custQuery.ok()).toBe(true)
      createdCustomerId = (await custQuery.json()).docs[0]?.id
      expect(createdCustomerId).toBeTruthy()

      await expectNoSeriousA11y(guestPage, 'habit-journey-dung-thu')

      // Bấm nút "Bắt đầu dùng thử"
      const startTrialBtn = guestPage.locator('button', {
        hasText: /Bắt đầu dùng thử (21|28) ngày/i,
      })
      await expect(startTrialBtn).toBeVisible()
      await startTrialBtn.click()

      // 8. Chuyển hướng tới /habit/hoc
      await expect(guestPage).toHaveURL(/\/habit\/hoc\/?$/, { timeout: 15000 })
      await expect(guestPage.getByRole('heading', { level: 1 })).toBeVisible()

      // Chạy a11y audit tại /habit/hoc
      await expectNoSeriousA11y(guestPage, 'habit-journey-hoc')

      // Tìm và mở bài học đầu tiên
      const lessonLink = guestPage.getByText(/E2E Bài 1: Thiết lập thói quen/i)
      await expect(lessonLink).toBeVisible()
      await lessonLink.click()

      await expect(guestPage).toHaveURL(new RegExp(`/habit/hoc/${createdLessonId}/?$`))

      // Kiểm tra player sandbox và nút "Giả lập xem hết"
      await expect(guestPage.getByText(/Video mẫu – chưa kết nối Bunny/i)).toBeVisible()
      const simulateBtn = guestPage.getByRole('button', { name: /Giả lập xem hết/i })
      await expect(simulateBtn).toBeVisible()

      await expect(async () => {
        await simulateBtn.click()
        await expect(guestPage.getByText(/Đã giả lập xem hết/i)).toBeVisible({
          timeout: 3000,
        })
      }).toPass({ timeout: 20000 })

      // Dashboard hiện dấu "Đã xem" cho bài vừa học
      await guestPage.goto('/habit/hoc')
      await expect(guestPage.locator('span:has-text("Đã xem")')).toBeVisible()

      // 9. Vào /habit/tracker -> thiết lập thói quen mẫu -> check-in ngày 1
      await guestPage.goto('/habit/tracker', { waitUntil: 'load' })
      await expect(guestPage).toHaveURL(/\/habit\/tracker\/?$/, { timeout: 15000 })

      // Chạy a11y audit tại /habit/tracker
      await expectNoSeriousA11y(guestPage, 'habit-journey-tracker')

      // Nhập phát biểu kế hoạch
      const statementInput = guestPage.locator('#identity-statement')
      await expect(statementInput).toBeVisible()
      await statementInput.fill('Tôi sẽ dành 5 phút mỗi sáng để trở thành người bình an hơn')

      const createPlanBtn = guestPage.locator('button[type="submit"]', {
        hasText: /Bắt đầu hành trình/i,
      })
      const day1Btn = guestPage.getByRole('button', { name: /^Ngày 1:/ })

      await expect(async () => {
        await createPlanBtn.click({ timeout: 5000 })
        await expect(day1Btn).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 30000 })

      // Mở modal check-in ngày 1
      const modal = guestPage.locator('div[role="dialog"]')
      await expect(async () => {
        await day1Btn.click({ timeout: 5000 })
        await expect(modal).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 15000 })

      // Chọn trạng thái Bỏ phiếu + chọn cảm xúc Bình an
      const votedRadio = modal.getByRole('radio', { name: /Bỏ phiếu/i })
      await votedRadio.check()

      const peacefulRadio = modal.getByRole('radio', { name: /Bình an/i })
      await peacefulRadio.click()

      // Lưu check-in
      const saveBtn = modal.locator('button[type="submit"]', { hasText: /Lưu check-in/i })
      await expect(async () => {
        await saveBtn.click({ timeout: 5000 })
        await expect(modal).toBeHidden({ timeout: 3000 })
      }).toPass({ timeout: 15000 })

      // Kiểm tra ngày 1 đã tích hoàn thành
      const day1Completed = guestPage.getByRole('button', {
        name: /^Ngày 1: (Bỏ phiếu|Đã hoàn thành)/i,
      })
      await expect(day1Completed).toBeVisible()

      // 10. Chuyển đổi từ dùng thử sang mua thật qua /thanh-toan?san-pham=habit-tracker-so
      await guestPage.goto(`/thanh-toan?san-pham=${productSlug}`, { waitUntil: 'load' })
      await expect(guestPage.getByRole('heading', { name: productName })).toBeVisible({
        timeout: 15000,
      })

      // Tick điều khoản và submit
      const termsCheckbox = guestPage.getByTestId('checkout-terms-checkbox')
      await expect(termsCheckbox).not.toBeChecked()
      await termsCheckbox.check()

      const payButton = guestPage.getByTestId('checkout-submit-button')
      await payButton.click()

      // Chờ chuyển hướng sang /thanh-toan/don/<payToken>
      await expect(guestPage).toHaveURL(/\/thanh-toan\/don\/[A-Za-z0-9_-]+/, { timeout: 15000 })
      const vietQrEl = guestPage.getByTestId('vietqr')
      await expect(vietQrEl).toBeVisible({ timeout: 15000 })

      const paymentRefEl = guestPage.locator('.font-mono.text-bright-magenta')
      await expect(paymentRefEl).toBeVisible()
      const paymentRef = (await paymentRefEl.innerText()).trim()
      expect(paymentRef.startsWith('TDCX')).toBe(true)

      const payToken = guestPage.url().split('/thanh-toan/don/')[1]?.split('?')[0]
      expect(payToken).toBeTruthy()

      const orderQuery = await page.request.get(
        `/api/orders?where[payToken][equals]=${encodeURIComponent(payToken!)}`,
      )
      expect(orderQuery.ok()).toBe(true)
      const orderDocs = (await orderQuery.json()).docs
      expect(orderDocs.length).toBe(1)
      createdOrderId = orderDocs[0].id

      // Quét sau khi đã ghi nhận đơn để finally luôn dọn được đơn (đơn giữ khóa ngoại tới sản phẩm)
      await expectNoSeriousA11y(guestPage, 'habit-journey-order-page')

      // Owner vào trang quản trị xác nhận thanh toán
      await page.goto(`/admin/collections/orders/${createdOrderId}`)
      await expect(page.getByRole('heading', { name: paymentRef })).toBeVisible({ timeout: 15000 })

      const modalConfirmButton = page.getByRole('button', { name: /Đồng ý xác nhận/i })
      await expect(async () => {
        const confirmButton = page.getByRole('button', { name: /Xác nhận thanh toán/i })
        await expect(confirmButton).toBeVisible()
        await confirmButton.click()
        await expect(modalConfirmButton).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 15000 })

      await modalConfirmButton.click()
      await expect(page.getByText('Xác nhận thanh toán thành công.', { exact: true })).toBeVisible({
        timeout: 15000,
      })

      // 11. Khách vào /tai-khoan kiểm tra quyền truy cập chuyển sang 'Đang hiệu lực' vĩnh viễn
      await guestPage.goto('/tai-khoan', { waitUntil: 'load' })
      const courseItem = guestPage.getByTestId(`course-item-${productSlug}`)
      await expect(courseItem).toBeVisible({ timeout: 15000 })
      await expect(
        courseItem.locator('[data-testid="entitlement-status-badge"]', {
          hasText: 'Đang hiệu lực',
        }),
      ).toBeVisible()
      await expectNoSeriousA11y(guestPage, 'habit-journey-tai-khoan')

      // 12. Quay lại /habit/tracker -> dữ liệu ngày 1 đã check-in vẫn còn nguyên vẹn
      await guestPage.goto('/habit/tracker', { waitUntil: 'load' })
      const day1Retained = guestPage.getByRole('button', {
        // HB-11: nhãn ô ngày theo 4 trạng thái – "Ngày 1: Bỏ phiếu, cảm xúc: Bình an"
        name: /^Ngày 1: Bỏ phiếu, cảm xúc:? Bình an/i,
      })
      await expect(day1Retained).toBeVisible({ timeout: 15000 })
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await guestPage.close().catch(() => {})
      await visitor.close().catch(() => {})

      // Dọn dẹp theo thứ tự khóa ngoại: entitlements -> orders -> lessonProgress -> checkins -> plans
      if (createdCustomerId) {
        const ents = await page.request
          .get(`/api/entitlements?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (ents?.ok()) {
          for (const doc of (await ents.json()).docs || []) {
            await page.request.delete(`/api/entitlements/${doc.id}`).catch(() => {})
          }
        }
      }
      // Xóa mọi đơn của khách (không chỉ createdOrderId) – đơn còn sót sẽ chặn xóa sản phẩm
      // habit-tracker-so và làm hỏng các e2e sau dùng cùng slug.
      if (createdCustomerId) {
        const orders = await page.request
          .get(`/api/orders?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (orders?.ok()) {
          for (const doc of (await orders.json()).docs || []) {
            await page.request.delete(`/api/orders/${doc.id}`).catch(() => {})
          }
        }
      } else if (createdOrderId) {
        await page.request.delete(`/api/orders/${createdOrderId}`).catch(() => {})
      }
      if (createdCustomerId) {
        const progress = await page.request
          .get(`/api/lessonProgress?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (progress?.ok()) {
          for (const doc of (await progress.json()).docs || []) {
            await page.request.delete(`/api/lessonProgress/${doc.id}`).catch(() => {})
          }
        }
        const plans = await page.request
          .get(`/api/habitPlans?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (plans?.ok()) {
          for (const plan of (await plans.json()).docs || []) {
            const checkins = await page.request
              .get(`/api/habitCheckins?where[plan][equals]=${plan.id}&limit=100`)
              .catch(() => null)
            if (checkins?.ok()) {
              for (const c of (await checkins.json()).docs || []) {
                await page.request.delete(`/api/habitCheckins/${c.id}`).catch(() => {})
              }
            }
            await page.request.delete(`/api/habitPlans/${plan.id}`).catch(() => {})
          }
        }
      }

      if (createdLessonId) {
        await page.request.delete(`/api/lessons/${createdLessonId}`).catch(() => {})
      }

      if (createdModuleId) {
        await page.request.delete(`/api/courseModules/${createdModuleId}`).catch(() => {})
      }

      if (createdProductId) {
        const delProduct = await page.request
          .delete(`/api/products/${createdProductId}`)
          .catch(() => null)
        if (!delProduct?.ok()) {
          console.error(
            `[gate-habit-journey] Không xóa được sản phẩm ${productSlug} (${delProduct?.status()}) – các e2e sau dùng cùng slug sẽ lỗi.`,
          )
        }
      }

      if (settingsBefore) {
        await page.request
          .post('/api/globals/siteSettings', {
            data: {
              bankBin: settingsBefore.bankBin ?? null,
              bankName: settingsBefore.bankName ?? null,
              accountNumber: settingsBefore.accountNumber ?? null,
              accountName: settingsBefore.accountName ?? null,
              transferPrefix: settingsBefore.transferPrefix ?? null,
            },
          })
          .catch(() => {})
      }

      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
    }
  })
})
