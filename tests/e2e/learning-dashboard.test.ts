import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test for Learning Dashboard & Protected Video Interface (T2-05a).
 * NOTE: As instructed by prompt T2-05a, this file is written for CI verification
 * and is NOT executed during local dev runs.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t2-05a-admin-${randomUUID()}@example.test`)
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

test.describe('Learning Dashboard & Protected Video Interface Flow (T2-05a)', () => {
  test('quản trị viên cấu hình -> khách đăng nhập OTP -> xem lộ trình -> học bài thường -> giả lập xem hết -> đánh dấu đã xem', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let adminUserId: number | undefined
    let productId: number | undefined
    let createdProduct = false
    let moduleId: number | undefined
    let freeLessonId: number | undefined
    let paidLessonId: number | undefined
    let customerId: number | undefined
    let entitlementId: number | undefined

    const customerEmail = `khach-hoc-${randomUUID().slice(0, 8)}@example.test`
    const fakeIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`

    // Browser context cho khách có IP giả riêng để không bị đụng rate limit OTP
    const customerContext = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      extraHTTPHeaders: {
        'x-forwarded-for': fakeIp,
      },
    })
    const guestPage = await customerContext.newPage()

    try {
      // 1. Tạo admin
      adminUserId = await bootstrapAdmin(page)

      // 2. Tìm hoặc tạo sản phẩm habit-tracker-so qua REST admin
      const findProdRes = await page.request.get(
        '/api/products?where[slug][equals]=habit-tracker-so',
      )
      const existingProds = (await findProdRes.json()).docs
      if (existingProds.length > 0) {
        productId = existingProds[0].id
      } else {
        const createProdRes = await page.request.post('/api/products', {
          data: {
            name: 'Habit Tracker Số (E2E Test)',
            slug: 'habit-tracker-so',
            web: 'habit',
            type: 'digital_tool',
            saleStatus: 'on_sale',
            price: 250000,
            salePrice: 178000,
            trialDays: 21,
            _status: 'published',
          },
        })
        expect(createProdRes.status()).toBe(201)
        productId = (await createProdRes.json()).doc.id
        createdProduct = true
      }

      // 3. Tạo nhóm bài học (courseModules) qua REST
      const modRes = await page.request.post('/api/courseModules', {
        data: {
          title: `E2E Nhóm Hiểu Mình ${randomUUID().slice(0, 6)}`,
          group: 'insight',
          order: 1,
          _status: 'published',
        },
      })
      expect(modRes.status()).toBe(201)
      moduleId = (await modRes.json()).doc.id

      // 4. Tạo 1 bài xem thử + 1 bài thường qua REST
      const freeLessonRes = await page.request.post('/api/lessons', {
        data: {
          title: `E2E Bài Xem Thử Miễn Phí ${randomUUID().slice(0, 6)}`,
          module: moduleId,
          videoId: 'bunny_video_free_preview_e2e',
          durationSec: 180,
          isFreePreview: true,
          order: 1,
          _status: 'published',
        },
      })
      expect(freeLessonRes.status()).toBe(201)
      freeLessonId = (await freeLessonRes.json()).doc.id

      const paidLessonRes = await page.request.post('/api/lessons', {
        data: {
          title: `E2E Bài Học Trả Phí Chính ${randomUUID().slice(0, 6)}`,
          module: moduleId,
          videoId: 'bunny_video_paid_protected_e2e',
          durationSec: 420,
          isFreePreview: false,
          order: 2,
          _status: 'published',
        },
      })
      expect(paidLessonRes.status()).toBe(201)
      paidLessonId = (await paidLessonRes.json()).doc.id

      // 5. Tạo khách hàng qua REST
      const custRes = await page.request.post('/api/customers', {
        data: {
          email: customerEmail,
          name: 'Khách Hàng E2E Learning',
          consentAt: new Date().toISOString(),
        },
      })
      expect(custRes.status()).toBe(201)
      customerId = (await custRes.json()).doc.id

      // 6. Cấp quyền dùng thử cho khách qua REST admin
      const expiresAt = new Date(Date.now() + 21 * 86400000).toISOString()
      const entRes = await page.request.post('/api/entitlements', {
        data: {
          customer: customerId,
          product: productId,
          source: 'manual',
          status: 'trial',
          grantedAt: new Date().toISOString(),
          expiresAt,
          trialKey: `${customerId}:${productId}`,
        },
      })
      expect(entRes.status()).toBe(201)
      entitlementId = (await entRes.json()).doc.id

      // 7. Khách truy cập /habit/hoc -> bị chuyển hướng đăng nhập
      await guestPage.goto('/habit/hoc')
      await expect(guestPage).toHaveURL(/\/tai-khoan\/dang-nhap\?next=\/habit\/hoc$/)

      // 8. Đăng nhập OTP
      await guestPage.locator('input[name="email"]').fill(customerEmail)
      const consentCheckbox = guestPage.locator('input[name="consentPolicy"]')
      await consentCheckbox.check()

      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guestPage.locator('button[type="submit"]').click()

      // Chờ ô nhập mã code
      const codeInput = guestPage.locator('input[name="code"]')
      await expect(codeInput).toBeVisible({ timeout: 15000 })

      const otpCode = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(otpCode)
      await guestPage.locator('button[type="submit"]').click()

      // Đăng nhập thành công và được chuyển hướng về /habit/hoc (neo cuối chuỗi)
      await expect(guestPage).toHaveURL(/\/habit\/hoc\/?$/, { timeout: 15000 })
      await expect(guestPage.getByRole('heading', { level: 1 })).toBeVisible()

      // Thấy cả 2 bài học
      await expect(guestPage.getByText(/E2E Bài Xem Thử Miễn Phí/i)).toBeVisible()
      const paidLessonLink = guestPage.getByText(/E2E Bài Học Trả Phí Chính/i)
      await expect(paidLessonLink).toBeVisible()

      // 9. Mở bài thường -> kiểm tra giao diện phát video sandbox
      await paidLessonLink.click()
      await expect(guestPage).toHaveURL(new RegExp(`/habit/hoc/${paidLessonId}/?$`))

      // Kiểm tra khung sandbox và nút "Giả lập xem hết"
      await expect(guestPage.getByText(/Video mẫu – chưa kết nối Bunny/i)).toBeVisible()
      const simulateBtn = guestPage.getByRole('button', { name: /Giả lập xem hết/i })
      await expect(simulateBtn).toBeVisible()

      // Bấm "Giả lập xem hết" – bấm lại trong toPass vì cú bấm trước khi hydrate không có tác dụng
      await expect(async () => {
        await simulateBtn.click()
        await expect(guestPage.getByText(/Đã xem|hoàn thành/i).first()).toBeVisible({
          timeout: 3000,
        })
      }).toPass({ timeout: 20000 })

      // 10. Quay lại dashboard /habit/hoc -> thấy dấu "Đã xem"
      await guestPage.goto('/habit/hoc')
      await expect(guestPage).toHaveURL(/\/habit\/hoc\/?$/)

      // Bài thường giờ đã có dấu "Đã xem"
      const completedBadge = guestPage.locator('span:has-text("Đã xem")')
      await expect(completedBadge).toBeVisible()

      // 11. Khách vãng lai chưa đăng nhập:
      const unauthContext = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        extraHTTPHeaders: {
          'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 200) + 10}`,
        },
      })
      const unauthPage = await unauthContext.newPage()

      try {
        // Mở bài xem thử -> xem được trực tiếp
        await unauthPage.goto(`/habit/hoc/${freeLessonId}`)
        await expect(unauthPage.getByText(/E2E Bài Xem Thử Miễn Phí/i)).toBeVisible()
        await expect(unauthPage.getByText(/Video mẫu – chưa kết nối Bunny/i)).toBeVisible()

        // Mở bài thường -> thấy khối khóa
        await unauthPage.goto(`/habit/hoc/${paidLessonId}`)
        await expect(unauthPage.getByText(/Nội dung này chưa được mở khóa/i)).toBeVisible()
        await expect(unauthPage.getByRole('button', { name: /Giả lập xem hết/i })).not.toBeVisible()
      } finally {
        await unauthContext.close().catch(() => {})
      }
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await guestPage.close().catch(() => {})
      await customerContext.close().catch(() => {})

      // Dọn dẹp dữ liệu
      if (entitlementId) {
        await page.request.delete(`/api/entitlements/${entitlementId}`).catch(() => {})
      }

      if (customerId) {
        // Xóa tiến độ bài học của khách
        const progressRes = await page.request
          .get(`/api/lessonProgress?where[customer][equals]=${customerId}`)
          .catch(() => null)
        if (progressRes && progressRes.ok()) {
          const docs =
            ((await progressRes.json().catch(() => ({}))) as { docs?: Array<{ id: number }> })
              .docs ?? []
          for (const d of docs) {
            await page.request.delete(`/api/lessonProgress/${d.id}`).catch(() => {})
          }
        }
        await page.request.delete(`/api/customers/${customerId}`).catch(() => {})
      }

      if (paidLessonId) {
        await page.request.delete(`/api/lessons/${paidLessonId}`).catch(() => {})
      }
      if (freeLessonId) {
        await page.request.delete(`/api/lessons/${freeLessonId}`).catch(() => {})
      }
      if (moduleId) {
        await page.request.delete(`/api/courseModules/${moduleId}`).catch(() => {})
      }
      if (createdProduct && productId) {
        await page.request.delete(`/api/products/${productId}`).catch(() => {})
      }

      if (adminUserId) {
        await page.request.delete(`/api/users/${adminUserId}`).catch(() => {})
      }
    }
  })
})
