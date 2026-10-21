import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * End-to-End Test cho Tracker 21 ngày + Luồng tạo kế hoạch & check-in (T2-06).
 *
 * Kịch bản:
 * 1. Bootstrap admin trên database CI độc lập (không có seed).
 * 2. Admin tạo sản phẩm digital_tool `habit-tracker-so`.
 * 3. Admin tạo khách và cấp quyền dùng thử qua REST admin (status: trial, có expiresAt).
 * 4. Khách truy cập /habit/tracker -> chuyển hướng sang /tai-khoan/dang-nhap?next=...
 * 5. Khách xin mã OTP, nhận qua /api/test-otp (E2E_TEST_HOOKS=1), nhập mã và đăng nhập.
 * 6. Được chuyển hướng về /habit/tracker, thấy form tạo kế hoạch -> nhập "Tôi sẽ ... để trở thành ..." và tạo.
 * 7. Lưới 21 ngày xuất hiện: bấm ngày 1 -> mở modal check-in -> tick hoàn thành + chọn cảm xúc "Bình an" -> lưu.
 * 8. Tải lại trang (reload) -> ngày 1 vẫn còn hoàn thành.
 * 9. Ô ngày 2 không bấm được (disabled).
 * 10. Dọn dẹp dữ liệu trong khối finally (xóa admin cuối cùng).
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t2-06-${randomUUID()}@example.test`)
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

test.describe('Habit Tracker Flow (T2-06)', () => {
  test('cấp quyền trial -> đăng nhập OTP -> tạo kế hoạch -> check-in ngày 1 có cảm xúc -> reload vẫn còn -> ngày 2 disabled', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdCustomerId: number | undefined

    const customerEmail = `khach-tracker-${randomUUID().slice(0, 6)}@example.test`

    // IP giả lập riêng (203.0.113.0/24) tránh rate-limit
    const visitor = await browser.newContext({
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const guestPage = await visitor.newPage()

    try {
      // 1. Bootstrap admin
      adminId = await bootstrapAdmin(page)

      // 2. Admin tạo sản phẩm habit-tracker-so
      const prodRes = await page.request.post('/api/products', {
        data: {
          name: 'Habit Tracker Số',
          slug: 'habit-tracker-so',
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          salePrice: 178000,
          trialDays: 28,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(prodRes.ok()).toBe(true)
      const createdProd = await prodRes.json()
      createdProductId = createdProd.doc.id

      // 3. Admin tạo trước customer
      const custRes = await page.request.post('/api/customers', {
        data: {
          email: customerEmail,
          name: 'Khách Hàng Tracker E2E',
        },
      })
      expect(custRes.ok()).toBe(true)
      const createdCust = await custRes.json()
      createdCustomerId = createdCust.doc.id

      // 4. Admin cấp quyền dùng thử qua REST admin (status: trial, có expiresAt)
      const entRes = await page.request.post('/api/entitlements', {
        data: {
          customer: createdCustomerId,
          product: createdProductId,
          status: 'trial',
          source: 'trial',
          expiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })
      expect(entRes.ok()).toBe(true)

      // 5. Khách truy cập /habit/tracker -> chuyển hướng đăng nhập
      await guestPage.goto('/habit/tracker')
      await expect(guestPage).toHaveURL(/\/tai-khoan\/dang-nhap\?next=\/habit\/tracker$/)

      // 6. Nhập email, tick đồng ý, chờ Turnstile rồi xin OTP
      await guestPage.locator('input[name="email"]').fill(customerEmail)
      await guestPage.locator('input[name="consentPolicy"]').check()
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guestPage.locator('button[type="submit"]').click()

      // Chờ form sang bước nhập mã OTP
      const codeInput = await expectCodeStep(guestPage)

      // 7. Lấy mã OTP và submit
      const code = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(code)
      await guestPage.locator('button[type="submit"]').click()

      // 8. Chờ chuyển hướng về /habit/tracker
      await expect(guestPage).toHaveURL(/\/habit\/tracker\/?$/, { timeout: 15000 })

      // 9. Khách thấy form tạo kế hoạch vì chưa có kế hoạch
      const statementInput = guestPage.locator('#identity-statement')
      await expect(statementInput).toBeVisible()
      await statementInput.fill('Tôi sẽ tập thở 5 phút mỗi sáng để trở thành người bình an hơn')

      const createPlanBtn = guestPage.locator('button[type="submit"]', {
        hasText: /Bắt đầu hành trình 28 ngày/i,
      })
      const day1Btn = guestPage.getByRole('button', { name: /^Ngày 1:/ })
      const day28Btn = guestPage.getByRole('button', { name: /^Ngày 28:/ })

      // Bấm tạo kế hoạch trong toPass cho tới khi lưới tracker 28 ngày xuất hiện
      await expect(async () => {
        await createPlanBtn.click({ timeout: 5000 })
        await expect(day1Btn).toBeVisible({ timeout: 3000 })
        await expect(day28Btn).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 30000 })

      // 11. Bấm vào Ngày 1 để mở modal check-in (bấm lại trong toPass nếu modal chưa mở)
      const modal = guestPage.locator('div[role="dialog"]')
      await expect(async () => {
        await day1Btn.click({ timeout: 5000 })
        await expect(modal).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 15000 })

      // Tick hoàn thành
      const doneCheckbox = modal.locator('input[type="checkbox"]')
      await doneCheckbox.check()

      // Chọn cảm xúc: Bình an (peaceful)
      const peacefulRadio = modal.getByRole('radio', { name: /Bình an/i })
      await peacefulRadio.click()

      // Bấm Lưu check-in (bấm lại trong toPass nếu modal chưa đóng)
      const saveBtn = modal.locator('button[type="submit"]', { hasText: /Lưu check-in/i })
      await expect(async () => {
        await saveBtn.click({ timeout: 5000 })
        await expect(modal).toBeHidden({ timeout: 3000 })
      }).toPass({ timeout: 15000 })

      // 12. Tải lại trang -> Ngày 1 vẫn còn trạng thái hoàn thành với cảm xúc
      await guestPage.reload()
      const day1AfterReload = guestPage.getByRole('button', { name: /^Ngày 1: Đã hoàn thành/i })
      await expect(day1AfterReload).toBeVisible()

      // 13. Ô Ngày 2 không bấm được (chưa tới, disabled)
      const day2Btn = guestPage.getByRole('button', { name: /^Ngày 2: Chưa tới/i })
      await expect(day2Btn).toBeDisabled()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)

      if (createdCustomerId) {
        // Dọn dẹp checkins và habitPlans của customer
        const plansRes = await page.request
          .get(`/api/habitPlans?where[customer][equals]=${createdCustomerId}`)
          .catch(() => null)
        if (plansRes && plansRes.ok()) {
          const plansData = await plansRes.json().catch(() => ({ docs: [] }))
          for (const plan of plansData.docs || []) {
            const checkinsRes = await page.request
              .get(`/api/habitCheckins?where[plan][equals]=${plan.id}`)
              .catch(() => null)
            if (checkinsRes && checkinsRes.ok()) {
              const checkinsData = await checkinsRes.json().catch(() => ({ docs: [] }))
              for (const ch of checkinsData.docs || []) {
                await page.request.delete(`/api/habitCheckins/${ch.id}`).catch(() => {})
              }
            }
            await page.request.delete(`/api/habitPlans/${plan.id}`).catch(() => {})
          }
        }

        // Xóa entitlements của customer
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
