import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * End-to-End Test cho Cấp & Xác minh Chứng nhận 21 ngày (T2-07).
 *
 * Kịch bản:
 * 1. Bootstrap admin trên database CI độc lập (không có seed).
 * 2. Admin tạo sản phẩm digital_tool `habit-tracker-so`.
 * 3. Admin tạo khách hàng (chưa có tên, mô phỏng đăng ký qua OTP) và cấp quyền dùng thử.
 * 4. Admin tạo kế hoạch habitPlans với startDate 22 ngày trước (đạt ngày 22 >= 21) và tạo 16 check-in hoàn thành.
 * 5. Khách đăng nhập qua mã OTP tại /tai-khoan/dang-nhap?next=/habit/tracker.
 * 6. Khách mở /habit/tracker, thấy khối tổng kết và form nhập "Họ và tên".
 * 7. Nhập "Học viên Test 01" rồi bấm "Nhận chứng nhận" -> tạo chứng nhận thành công, xuất hiện ảnh xem trước và nút chia sẻ.
 * 8. Trích xuất mã chứng nhận (code) hoặc bấm link "Xem trang chứng nhận" -> mở /chung-nhan/[code].
 * 9. Trang công khai hiển thị đúng tên học viên và câu cam kết định danh trong vùng #noi-dung.
 * 10. Chủ sở hữu bấm nút "Tắt link công khai".
 * 11. Khách vãng lai (context trình duyệt khác, IP khác) mở /chung-nhan/[code] -> nhận mã phản hồi 404 (Không tìm thấy trang).
 * 12. Dọn dẹp toàn bộ dữ liệu trong khối finally (checkins -> habitPlans -> certificates -> entitlements -> customer -> product -> admin) và đóng browser context.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t2-07-${randomUUID()}@example.test`)
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

test.describe('21-Day Certificate Flow (T2-07)', () => {
  test('nhận chứng nhận 21 ngày -> xem trang công khai -> tắt link công khai -> khách vãng lai nhận 404', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdCustomerId: number | undefined
    let createdPlanId: number | undefined
    let issuedCertCode: string | undefined

    const customerName = 'Học viên Test 01'
    const identityStatement = 'Tôi sẽ dành 5 phút mỗi sáng để thấu hiểu cảm xúc của chính mình.'
    const customerEmail = `khach-cert-${randomUUID().slice(0, 6)}@example.test`

    // Context cho chủ sở hữu
    const ownerContext = await browser.newContext({
      extraHTTPHeaders: {
        'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
      },
    })
    const ownerPage = await ownerContext.newPage()

    // Context cho khách vãng lai (IP khác)
    const strangerContext = await browser.newContext({
      extraHTTPHeaders: {
        'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
      },
    })
    const strangerPage = await strangerContext.newPage()

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

      // 3. Admin tạo customer KHÔNG CÓ NAME (mô phỏng đăng ký dùng thử qua OTP)
      const custRes = await page.request.post('/api/customers', {
        data: {
          email: customerEmail,
        },
      })
      expect(custRes.ok()).toBe(true)
      const createdCust = await custRes.json()
      createdCustomerId = createdCust.doc.id

      // 4. Admin cấp quyền dùng thử
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

      // 5. Admin tạo sẵn kế hoạch bắt đầu từ 29 ngày trước (đạt Ngày 29 >= 28)
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 29)
      const startDate = pastDate.toISOString().split('T')[0]

      const planRes = await page.request.post('/api/habitPlans', {
        data: {
          customer: createdCustomerId,
          startDate,
          identityStatement,
        },
      })
      expect(planRes.ok()).toBe(true)
      const createdPlan = await planRes.json()
      createdPlanId = createdPlan.doc.id

      // 6. Admin tạo 26 check-in hoàn thành (đạt >= 26 ngày quy định cho 28 ngày: ceil(28 * 90%) = 26)
      for (let day = 1; day <= 26; day++) {
        const checkinRes = await page.request.post('/api/habitCheckins', {
          data: {
            plan: createdPlanId,
            day,
            done: true,
            emotion: 'peaceful',
            note: `Check-in ngày ${day}`,
          },
        })
        expect(checkinRes.ok()).toBe(true)
      }

      // 7. Khách truy cập /habit/tracker -> chuyển hướng đăng nhập
      await ownerPage.goto('/habit/tracker')
      await expect(ownerPage).toHaveURL(/\/tai-khoan\/dang-nhap\?next=\/habit\/tracker$/)

      // 8. Đăng nhập qua OTP
      await ownerPage.locator('input[name="email"]').fill(customerEmail)
      await ownerPage.locator('input[name="consentPolicy"]').check()
      await expect(ownerPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await ownerPage.locator('button[type="submit"]').click()

      const codeInput = await expectCodeStep(ownerPage)
      const otpCode = await getTestOtpCode(ownerPage, customerEmail)
      await codeInput.fill(otpCode)
      await ownerPage.locator('button[type="submit"]').click()

      // 9. Chuyển hướng về /habit/tracker
      await expect(ownerPage).toHaveURL(/\/habit\/tracker\/?$/, { timeout: 15000 })

      // 10. Tìm ô nhập họ và tên và nút "Nhận chứng nhận" trong khối tổng kết
      const nameInput = ownerPage.locator('input[name="name"]')
      await expect(nameInput).toBeVisible({ timeout: 15000 })
      await nameInput.fill(customerName)

      const claimCertBtn = ownerPage.getByRole('button', { name: /Nhận chứng nhận/i })
      await expect(claimCertBtn).toBeVisible()

      // 11. Bấm nhận chứng nhận -> xuất hiện ảnh xem trước & các nút thao tác
      const viewCertLink = ownerPage.getByRole('link', { name: /Xem trang chứng nhận/i })
      await expect(async () => {
        // Lần bấm trước có thể đã thành công nhưng link hiện chậm → chỉ bấm khi nút còn trên trang
        if (await claimCertBtn.isVisible()) {
          await claimCertBtn.click({ timeout: 5000 })
        }
        await expect(viewCertLink).toBeVisible({ timeout: 5000 })
      }).toPass({ timeout: 30000 })

      // Lấy link xem trang chứng nhận
      const viewPublicLink = ownerPage.getByRole('link', { name: /Xem trang chứng nhận/i })
      const href = await viewPublicLink.getAttribute('href')
      expect(href).toMatch(/^\/chung-nhan\/[a-zA-Z0-9_-]+$/)
      issuedCertCode = href!.split('/').pop()!

      // 12. Bấm vào link để chuyển sang trang chứng nhận /chung-nhan/[code]
      await viewPublicLink.click()
      await expect(ownerPage).toHaveURL(new RegExp(`/chung-nhan/${issuedCertCode}$`))

      // 13. Xác minh trang chứng nhận hiển thị tên học viên và câu định danh trong vùng #noi-dung
      await expect(ownerPage.locator('#noi-dung').getByText(customerName)).toBeVisible()
      await expect(ownerPage.locator('#noi-dung').getByText(identityStatement)).toBeVisible()

      // 14. Chủ sở hữu bấm nút "Tắt link công khai"
      const togglePrivateBtn = ownerPage.getByRole('button', { name: /Tắt link công khai/i })
      await expect(togglePrivateBtn).toBeVisible()
      await togglePrivateBtn.click()

      // Nút đổi sang "Bật link công khai"
      await expect(ownerPage.getByRole('button', { name: /Bật link công khai/i })).toBeVisible({
        timeout: 10000,
      })

      // 15. Khách vãng lai truy cập cùng link /chung-nhan/[code] -> đúng 404 (Không tìm thấy trang)
      const strangerRes = await strangerPage.goto(`/chung-nhan/${issuedCertCode}`)
      expect(strangerRes?.status()).toBe(404)
      await expect(strangerPage.locator('#noi-dung').getByText(/Không tìm thấy/i)).toBeVisible()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)

      // Đóng contexts của browser
      if (ownerContext) await ownerContext.close().catch(() => {})
      if (strangerContext) await strangerContext.close().catch(() => {})

      if (createdCustomerId) {
        // 1. Xóa habitCheckins
        if (createdPlanId) {
          const checkinsRes = await page.request
            .get(`/api/habitCheckins?where[plan][equals]=${createdPlanId}&limit=100`)
            .catch(() => null)
          if (checkinsRes && checkinsRes.ok()) {
            const checkinsData = await checkinsRes.json().catch(() => ({ docs: [] }))
            for (const ch of checkinsData.docs || []) {
              await page.request.delete(`/api/habitCheckins/${ch.id}`).catch(() => {})
            }
          }
        }

        // 2. Xóa habitPlans
        if (createdPlanId) {
          await page.request.delete(`/api/habitPlans/${createdPlanId}`).catch(() => {})
        }
        const extraPlansRes = await page.request
          .get(`/api/habitPlans?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (extraPlansRes && extraPlansRes.ok()) {
          const extraPlansData = await extraPlansRes.json().catch(() => ({ docs: [] }))
          for (const p of extraPlansData.docs || []) {
            await page.request.delete(`/api/habitPlans/${p.id}`).catch(() => {})
          }
        }

        // 3. Xóa certificates
        const certsRes = await page.request
          .get(`/api/certificates?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (certsRes && certsRes.ok()) {
          const certsData = await certsRes.json().catch(() => ({ docs: [] }))
          for (const c of certsData.docs || []) {
            await page.request.delete(`/api/certificates/${c.id}`).catch(() => {})
          }
        }

        // 4. Xóa entitlements
        const entRes = await page.request
          .get(`/api/entitlements?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (entRes && entRes.ok()) {
          const entData = await entRes.json().catch(() => ({ docs: [] }))
          for (const ent of entData.docs || []) {
            await page.request.delete(`/api/entitlements/${ent.id}`).catch(() => {})
          }
        }

        // 5. Xóa customer
        await page.request.delete(`/api/customers/${createdCustomerId}`).catch(() => {})
      }

      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }

      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
    }
  })

  test('hoàn thành 25/28 ngày -> tải lại tracker thấy thẻ kết quả "Đã trải nghiệm", KHÔNG có nút nhận chứng nhận', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdCustomerId: number | undefined
    let createdPlanId: number | undefined

    const identityStatement = 'Tôi sẽ dành 5 phút mỗi sáng để thấu hiểu cảm xúc của chính mình.'
    const customerEmail = `khach-experienced-${randomUUID().slice(0, 6)}@example.test`

    const ownerContext = await browser.newContext({
      extraHTTPHeaders: {
        'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}`,
      },
    })
    const ownerPage = await ownerContext.newPage()

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

      // 3. Admin tạo customer KHÔNG CÓ NAME
      const custRes = await page.request.post('/api/customers', {
        data: {
          email: customerEmail,
        },
      })
      expect(custRes.ok()).toBe(true)
      const createdCust = await custRes.json()
      createdCustomerId = createdCust.doc.id

      // 4. Admin cấp quyền dùng thử
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

      // 5. Admin tạo sẵn kế hoạch bắt đầu từ 29 ngày trước (đạt Ngày 29 >= 28)
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 29)
      const startDate = pastDate.toISOString().split('T')[0]

      const planRes = await page.request.post('/api/habitPlans', {
        data: {
          customer: createdCustomerId,
          startDate,
          identityStatement,
        },
      })
      expect(planRes.ok()).toBe(true)
      const createdPlan = await planRes.json()
      createdPlanId = createdPlan.doc.id

      // 6. Admin tạo 25 check-in hoàn thành (25/28 = 89.2% < 90% -> outcome 'experienced')
      for (let day = 1; day <= 25; day++) {
        const checkinRes = await page.request.post('/api/habitCheckins', {
          data: {
            plan: createdPlanId,
            day,
            done: true,
            emotion: 'peaceful',
            note: `Check-in ngày ${day}`,
          },
        })
        expect(checkinRes.ok()).toBe(true)
      }

      // 7. Khách truy cập /habit/tracker -> chuyển hướng đăng nhập
      await ownerPage.goto('/habit/tracker')
      await expect(ownerPage).toHaveURL(/\/tai-khoan\/dang-nhap\?next=\/habit\/tracker$/)

      // 8. Đăng nhập qua OTP
      await ownerPage.locator('input[name="email"]').fill(customerEmail)
      await ownerPage.locator('input[name="consentPolicy"]').check()
      await expect(ownerPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await ownerPage.locator('button[type="submit"]').click()

      const codeInput = await expectCodeStep(ownerPage)
      const otpCode = await getTestOtpCode(ownerPage, customerEmail)
      await codeInput.fill(otpCode)
      await ownerPage.locator('button[type="submit"]').click()

      // 9. Chuyển hướng về /habit/tracker
      await expect(ownerPage).toHaveURL(/\/habit\/tracker\/?$/, { timeout: 15000 })

      // 10. Xác nhận thẻ kết quả "Đã trải nghiệm" hiển thị
      await expect(ownerPage.getByText(/Đã trải nghiệm/i)).toBeVisible({ timeout: 15000 })
      await expect(
        ownerPage.getByRole('heading', { name: /Hành trình đã khép lại/i }),
      ).toBeVisible()

      // 11. Xác nhận KHÔNG có nút nhận chứng nhận hay link xem chứng nhận
      const claimCertBtn = ownerPage.getByRole('button', { name: /Nhận chứng nhận/i })
      await expect(claimCertBtn).toBeHidden()
      const viewCertLink = ownerPage.getByRole('link', { name: /Xem trang chứng nhận/i })
      await expect(viewCertLink).toBeHidden()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)

      if (ownerContext) await ownerContext.close().catch(() => {})

      if (createdCustomerId) {
        if (createdPlanId) {
          const checkinsRes = await page.request
            .get(`/api/habitCheckins?where[plan][equals]=${createdPlanId}&limit=100`)
            .catch(() => null)
          if (checkinsRes && checkinsRes.ok()) {
            const checkinsData = await checkinsRes.json().catch(() => ({ docs: [] }))
            for (const ch of checkinsData.docs || []) {
              await page.request.delete(`/api/habitCheckins/${ch.id}`).catch(() => {})
            }
          }
          await page.request.delete(`/api/habitPlans/${createdPlanId}`).catch(() => {})
        }

        const certsRes = await page.request
          .get(`/api/certificates?where[customer][equals]=${createdCustomerId}&limit=100`)
          .catch(() => null)
        if (certsRes && certsRes.ok()) {
          const certsData = await certsRes.json().catch(() => ({ docs: [] }))
          for (const c of certsData.docs || []) {
            await page.request.delete(`/api/certificates/${c.id}`).catch(() => {})
          }
        }

        const entRes = await page.request
          .get(`/api/entitlements?where[customer][equals]=${createdCustomerId}&limit=100`)
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
    }
  })
})
