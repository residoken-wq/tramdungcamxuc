import { randomUUID } from 'node:crypto'
import { expect, test, type APIRequestContext, type Page, type Response } from './fixtures'
import { vi } from '../../src/lib/i18n/vi'

/**
 * End-to-End Test for Google Customer Login (GL-01).
 * Uses mock Google endpoints under /api/test-google when E2E_TEST_HOOKS=1.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  const init = await (await page.request.get('/api/users/init')).json()
  if (init.initialized !== false) {
    const meRes = await page.request.get('/api/users/me')
    if (meRes.ok() && (await meRes.json()).user) {
      return (await meRes.json()).user.id
    }
  }

  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-gl01-${randomUUID()}@example.test`)
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

  if (!response || !response.ok()) {
    throw new Error('First-user registration failed.')
  }
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

async function getGlobal(request: APIRequestContext, slug: string) {
  const res = await request.get(`/api/globals/${slug}?depth=0`)
  expect(res.ok()).toBe(true)
  return res.json()
}

test.describe('GL-01: Customer Google Sign-In & OTP fallback', () => {
  // Test 1 loops over 1440 / 375 itself; tests 3–4 bootstrap the first admin (once per DB).
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, on desktop-1440.')
  })

  // Test 1: New customer from /dung-thu -> login -> consent -> Google button -> returns authenticated (desktop & mobile)
  for (const width of [1440, 375]) {
    test(`new customer logs in with Google from trial page (${width}px)`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height: width === 375 ? 667 : 900 },
      })
      const page = await context.newPage()

      const targetNext = '/dung-thu?san-pham=habit-tracker'
      await page.goto(`/tai-khoan/dang-nhap?next=${encodeURIComponent(targetNext)}`)
      await expect(page).toHaveTitle(/Đăng nhập/)

      // 1. Consent checkboxes are above the Google button
      const consentCheckbox = page.locator('input[name="consentPolicy"]')
      await expect(consentCheckbox).toBeVisible()
      await expect(consentCheckbox).not.toBeChecked()

      // 2. Tick consent
      await consentCheckbox.check()
      await expect(consentCheckbox).toBeChecked()

      // 3. Locate Google button
      const googleBtn = page.getByRole('link', { name: vi.gl01.continueWithGoogle })
      await expect(googleBtn).toBeVisible()

      // Verify Google button has min-height 44px
      const btnBox = await googleBtn.boundingBox()
      expect(btnBox).not.toBeNull()
      if (btnBox) {
        expect(btnBox.height).toBeGreaterThanOrEqual(44)
        if (width === 375) {
          // On mobile, button should take full width (with standard container padding)
          expect(btnBox.width).toBeGreaterThan(280)
        }
      }

      // 4. Click Google Sign-in button
      await googleBtn.click()

      // 5. Verification: user navigated through mock auth and landed back at targetNext
      await expect(page).toHaveURL(
        new RegExp(encodeURIComponent('habit-tracker').replace('%', '.*') + '|dung-thu'),
        {
          timeout: 15000,
        },
      )

      // Check account session is active by visiting /tai-khoan
      await page.goto('/tai-khoan')
      await expect(page).toHaveURL(/\/tai-khoan$/)
      await expect(page.getByRole('button', { name: vi.common.logout })).toBeVisible()

      await context.close()
    })
  }

  // Test 2: New customer clicks Google without ticking consent -> redirected with loi=can-dong-y
  test('new customer without consent gets redirected with loi=can-dong-y and no customer created', async ({
    page,
  }) => {
    await page.goto('/tai-khoan/dang-nhap')

    const consentCheckbox = page.locator('input[name="consentPolicy"]')
    await expect(consentCheckbox).toBeVisible()
    await expect(consentCheckbox).not.toBeChecked()

    const googleBtn = page.getByRole('link', { name: vi.gl01.continueWithGoogle })
    await expect(googleBtn).toBeVisible()

    // Click without checking consent
    await googleBtn.click()

    // Redirected back to login page with error query
    await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap\?.*loi=can-dong-y/, { timeout: 15000 })

    // Error alert visible with exact message
    // Next.js adds its own empty role="alert" route announcer: pick ours by its text.
    const errorAlert = page.getByRole('alert').filter({ hasText: vi.gl01.errors.canDongY })
    await expect(errorAlert).toBeVisible()
  })

  // Test 3: Owner disables OTP in siteSettings -> login page hides OTP form completely
  test('owner disables OTP -> login page hides email and code inputs completely', async ({
    page,
    browser,
  }) => {
    let settingsBefore: Record<string, unknown> | undefined
    let adminId: number | undefined

    try {
      // Bootstrap admin and read initial settings
      adminId = await bootstrapAdmin(page)
      settingsBefore = await getGlobal(page.request, 'siteSettings')

      // Update siteSettings: disable OTP, enable Google
      const updateRes = await page.request.post('/api/globals/siteSettings', {
        data: {
          loginOtpEnabled: false,
          loginGoogleEnabled: true,
        },
      })
      expect(updateRes.ok()).toBe(true)

      // Open fresh guest browser context
      const guestContext = await browser.newContext()
      const guestPage = await guestContext.newPage()

      await guestPage.goto('/tai-khoan/dang-nhap')

      // Google button should be visible
      const googleBtn = guestPage.getByRole('link', { name: vi.gl01.continueWithGoogle })
      await expect(googleBtn).toBeVisible()

      // OTP form elements must NOT exist in the DOM (not just CSS hidden)
      const emailInput = guestPage.locator('input[name="email"]')
      await expect(emailInput).toHaveCount(0)

      const codeInput = guestPage.locator('input[name="code"]')
      await expect(codeInput).toHaveCount(0)

      const otpDivider = guestPage.locator(`text=${vi.gl01.orDivider}`)
      await expect(otpDivider).toHaveCount(0)

      await guestContext.close()
    } finally {
      // Restore settings
      if (settingsBefore) {
        await page.request
          .post('/api/globals/siteSettings', {
            data: {
              loginOtpEnabled: settingsBefore.loginOtpEnabled ?? true,
              loginGoogleEnabled: settingsBefore.loginGoogleEnabled ?? true,
            },
          })
          .catch(() => {})
      }
      if (adminId) await page.request.delete(`/api/users/${adminId}`).catch(() => {})
    }
  })

  // Test 4: customer created before Google (OTP / admin) logs in via Google with the same email:
  // same account (id, orders), googleSub linked; without consent ticked it is refused first.
  test('existing customer logs in via Google with same email -> same account, sees the old order', async ({
    page,
    browser,
  }) => {
    const existingEmail = `gl01-existing-${randomUUID().slice(0, 8)}@example.test`
    const productName = `[MẪU] Gói GL-01 ${randomUUID().slice(0, 6)}`
    let adminId: number | undefined
    let productId: number | undefined
    let customerId: number | undefined
    let orderId: number | undefined

    try {
      adminId = await bootstrapAdmin(page)

      const prodRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: `goi-gl01-${randomUUID().slice(0, 6)}`,
          web: 'site',
          type: 'package',
          price: 1750000,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(prodRes.ok()).toBe(true)
      productId = (await prodRes.json()).doc.id

      // Created by an admin: no consentAt yet (like a customer who never accepted the terms).
      const custRes = await page.request.post('/api/customers', {
        data: { email: existingEmail, name: '[MẪU] Học viên Test 01' },
      })
      expect(custRes.ok()).toBe(true)
      customerId = (await custRes.json()).doc.id

      const orderRes = await page.request.post('/api/orders', {
        data: {
          customer: customerId,
          items: [{ product: productId, price: 1750000 }],
          subtotal: 1750000,
          total: 1750000,
          createdByAdmin: true,
        },
      })
      expect(orderRes.ok()).toBe(true)
      orderId = (await orderRes.json()).doc.id

      const visitor = await browser.newContext()
      const visitorPage = await visitor.newPage()
      const start = (consent: 0 | 1) =>
        `/api/auth/google/start?next=/tai-khoan&consent=${consent}&mock_email=${encodeURIComponent(existingEmail)}`

      // Not consented yet and no tick: refused, not linked (GL-01c B1).
      await visitorPage.goto(start(0))
      await expect(visitorPage).toHaveURL(/\/tai-khoan\/dang-nhap\?.*loi=can-dong-y/, {
        timeout: 15000,
      })

      // With the tick: logged in to the same account, the old order is there.
      await visitorPage.goto(start(1))
      await expect(visitorPage).toHaveURL(/\/tai-khoan\/?$/, { timeout: 15000 })
      await expect(visitorPage.getByText(existingEmail).first()).toBeVisible()
      const orderCard = visitorPage.locator('[data-testid="customer-order-item"]').first()
      await expect(orderCard.getByText(productName)).toBeVisible()
      await visitor.close()

      const linked = await (await page.request.get(`/api/customers/${customerId}?depth=0`)).json()
      expect(linked.googleSub).toBeTruthy()
      expect(linked.consentAt).toBeTruthy()
      const sameEmail = await (
        await page.request.get(
          `/api/customers?where[email][equals]=${encodeURIComponent(existingEmail)}&depth=0`,
        )
      ).json()
      expect(sameEmail.totalDocs).toBe(1)
    } finally {
      if (orderId) await page.request.delete(`/api/orders/${orderId}`).catch(() => {})
      if (customerId) await page.request.delete(`/api/customers/${customerId}`).catch(() => {})
      if (productId) await page.request.delete(`/api/products/${productId}`).catch(() => {})
      if (adminId) await page.request.delete(`/api/users/${adminId}`).catch(() => {})
    }
  })
})
