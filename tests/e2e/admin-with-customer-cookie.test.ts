import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * End-to-End Test cho Phiên khách không đè phiên admin (T2-20).
 *
 * Kịch bản:
 * 1. Khởi tạo tài khoản admin trên database CI nếu chưa có người dùng.
 * 2. Khách hàng đăng nhập OTP (IP riêng x-forwarded-for, tick consentPolicy, chờ Turnstile).
 * 3. Trình duyệt hiện có cookie khách `tdcx_customer_token` và đang ở /tai-khoan.
 *    (T2-20d) Chỉ có phiên khách -> mở /admin về trang đăng nhập admin, không kẹt ở /admin/unauthorized.
 * 4. Cùng trình duyệt đăng nhập admin -> cookie có cả `tdcx_customer_token` và `payload-token`.
 * 5. Mở /admin -> mở được trang danh sách quản trị (không bị phiên khách đè thành collection customers).
 * 6. Quay lại /tai-khoan, bấm Đăng xuất khách -> chuyển hướng về /tai-khoan/dang-nhap.
 * 7. Truy cập lại /tai-khoan -> đòi đăng nhập lại.
 */

async function bootstrapAdmin(
  page: Page,
): Promise<{ id: number; email: string; password: string }> {
  const init = await (await page.request.get('/api/users/init')).json()
  const email = `admin-t2-20-${randomUUID()}@example.test`
  const password = `AdminPass-${randomUUID()}`

  if (init.initialized === false) {
    await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
    await page.locator('#field-email').fill(email)
    await page.locator('#field-password').fill(password)
    await page.locator('#field-confirm-password').fill(password)

    let response: Response | undefined
    await expect(async () => {
      const registration = page.waitForResponse(
        (res) =>
          res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
        { timeout: 5000 },
      )
      await page.locator('button[type="submit"]').click()
      response = await registration
    }).toPass({ timeout: 60000 })

    if (!response) throw new Error('First-user registration request was never sent.')
    expect(response.ok()).toBe(true)
    await expect(page).toHaveURL(/\/admin\/?$/)
    const user = (await (await page.request.get('/api/users/me')).json()).user
    return { id: user.id, email, password }
  }
  throw new Error('DB e2e đã có quản trị viên – test này cần DB chưa có admin (tự tạo rồi tự xóa).')
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

test.describe('Admin Isolation with Customer Cookie (T2-20)', () => {
  test('khách đăng nhập OTP -> cùng trình duyệt đăng nhập admin -> /admin mở được danh sách -> đăng xuất khách -> /tai-khoan đòi đăng nhập', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let adminInfo: { id: number; email: string; password: string } | undefined
    const suffix = randomUUID().slice(0, 8)
    const customerEmail = `khach-session-${suffix}@example.test`

    // Context trình duyệt dùng chung cho cả khách và admin, IP riêng chống đụng giới hạn OTP
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const sharedPage = await context.newPage()

    try {
      // 1. Tạo tài khoản admin đầu tiên
      adminInfo = await bootstrapAdmin(page)

      // 2. Khách thực hiện đăng nhập OTP trên sharedPage
      await sharedPage.goto('/tai-khoan/dang-nhap')
      await sharedPage.locator('input[name="email"]').fill(customerEmail)
      await sharedPage.locator('input[name="consentPolicy"]').check()
      await expect(sharedPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })

      await expect(async () => {
        await sharedPage.locator('button[type="submit"]').click()
        const codeInput = await expectCodeStep(sharedPage)
        const code = await getTestOtpCode(sharedPage, customerEmail)
        await codeInput.fill(code)
        await sharedPage.locator('button[type="submit"]').click()
      }).toPass({ timeout: 45000 })

      // Khách chuyển về /tai-khoan thành công
      await expect(sharedPage).toHaveURL(/\/tai-khoan\/?$/, { timeout: 15000 })

      // 2b. (T2-20d) Chỉ có phiên khách, chưa có phiên admin: mở /admin không được kẹt ở
      // "/admin/unauthorized" – cookie khách bị bỏ và trình duyệt về trang đăng nhập admin.
      const customerCookie = (await context.cookies()).find((c) => c.name === 'tdcx_customer_token')
      expect(customerCookie).toBeTruthy()
      await sharedPage.goto('/admin', { waitUntil: 'domcontentloaded' })
      await expect(sharedPage).toHaveURL(/\/admin\/login/, { timeout: 15000 })
      await expect(sharedPage.locator('input[name="email"]')).toBeVisible({ timeout: 15000 })
      expect((await context.cookies()).some((c) => c.name === 'tdcx_customer_token')).toBe(false)
      // Khôi phục phiên khách cho các bước sau
      await context.addCookies([customerCookie!])

      // 3. Cùng trình duyệt, đăng nhập admin qua REST login hoặc form login
      const loginRes = await context.request.post('/api/users/login', {
        data: {
          email: adminInfo.email,
          password: adminInfo.password,
        },
      })
      expect(loginRes.ok()).toBe(true)

      // 4. Mở danh sách quản trị viên trong /admin -> không bị đá về trang đăng nhập / báo không có quyền,
      // thấy đúng email admin trong danh sách (chỉ admin mới đọc được collection users)
      await sharedPage.goto('/admin/collections/users', { waitUntil: 'domcontentloaded' })
      await expect(sharedPage).toHaveURL(/\/admin\/collections\/users/)
      await expect(sharedPage.getByText(adminInfo.email).first()).toBeVisible({ timeout: 20000 })

      // Gọi REST API /api/users/me -> người dùng trả về phải là admin, không bị phiên khách đè
      const meRes = await context.request.get('/api/users/me')
      expect(meRes.ok()).toBe(true)
      const meData = await meRes.json()
      expect(meData.user?.collection).toBe('users')
      expect(meData.user?.email).toBe(adminInfo.email)

      // 5. Quay lại /tai-khoan của khách
      await sharedPage.goto('/tai-khoan', { waitUntil: 'domcontentloaded' })
      await expect(sharedPage).toHaveURL(/\/tai-khoan\/?$/)

      // Bấm nút đăng xuất khách
      const logoutBtn = sharedPage.locator('button', { hasText: /Đăng xuất/i })
      await expect(logoutBtn).toBeVisible({ timeout: 10000 })
      await logoutBtn.click()

      // Chuyển hướng về /tai-khoan/dang-nhap
      await expect(sharedPage).toHaveURL(/\/tai-khoan\/dang-nhap\/?$/, { timeout: 15000 })

      // 6. Truy cập lại /tai-khoan -> bị từ chối và đòi đăng nhập
      // (trang chuyển về /tai-khoan/dang-nhap?next=/tai-khoan)
      await sharedPage.goto('/tai-khoan', { waitUntil: 'domcontentloaded' })
      await expect(sharedPage).toHaveURL(
        /\/tai-khoan\/dang-nhap\?next=%2Ftai-khoan$|\/tai-khoan\/dang-nhap\?next=\/tai-khoan$/,
        {
          timeout: 15000,
        },
      )
    } finally {
      // Xóa admin tự tạo (page vẫn giữ phiên admin) để test sau / project sau chạy trên DB chưa có admin
      if (adminInfo?.id) {
        await page.request.delete(`/api/users/${adminInfo.id}`).catch(() => {})
      }
      await context.close()
    }
  })
})
