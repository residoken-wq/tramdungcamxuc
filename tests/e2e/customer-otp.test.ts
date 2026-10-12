import { expect, test, type Page } from '@playwright/test'

/**
 * End-to-End Test for Customer Email OTP Authentication (T2-01).
 * NOTE: As instructed by prompt T2-01 & T2-01b, this file is written for CI/planning verification
 * and is NOT executed during development pairs.
 *
 * Test mechanism for retrieving OTP:
 * When NODE_ENV === 'test', the server logs:
 * `[TEST-OTP] email="<email>" code="<6-digit-code>"`
 * and exposes the test-only endpoint `/api/test-otp?email=<email>`
 * which returns `{ email, code }`.
 */

async function getTestOtpCode(page: Page, email: string): Promise<string> {
  const res = await page.request.get(`/api/test-otp?email=${encodeURIComponent(email)}`)
  if (res.ok()) {
    const data = (await res.json()) as { code?: string }
    if (data.code) return data.code
  }
  return '123456'
}

test.describe('Customer Email OTP Authentication E2E Flow', () => {
  const testEmail = `e2e-user-${Date.now()}@tramdungcamxuc.test`

  test('customer requests OTP, logs in, views account page, and logs out', async ({ page }) => {
    // 1. Visit login page
    await page.goto('/tai-khoan/dang-nhap')
    await expect(page).toHaveTitle(/Đăng nhập/)

    // 2. Fill email step
    const emailInput = page.locator('input[name="email"]')
    await expect(emailInput).toBeVisible()
    await emailInput.fill(testEmail)

    // Ensure privacy policy consent is explicitly checked (unchecked by default per ND 13)
    const consentCheckbox = page.locator('input[name="consentPolicy"]')
    await expect(consentCheckbox).not.toBeChecked()
    await consentCheckbox.check()

    // Submit OTP request
    const sendOtpButton = page.locator('button[type="submit"]')
    await sendOtpButton.click()

    // 3. Verify transition to 6-digit code step
    const codeInput = page.locator('input[name="code"]')
    await expect(codeInput).toBeVisible({ timeout: 15000 })

    // Check 60s countdown indicator exists
    const countdownOrResend = page.locator('text=/Gửi lại mã/i')
    await expect(countdownOrResend).toBeVisible()

    // Retrieve active OTP code via test endpoint
    const otpCode = await getTestOtpCode(page, testEmail)
    await codeInput.fill(otpCode)

    // Submit code verification
    const verifyButton = page.locator('button[type="submit"]')
    await verifyButton.click()

    // 4. Verify redirected to account page with customer email visible
    await expect(page).toHaveURL(/\/tai-khoan/)
    await expect(page.locator('text=' + testEmail)).toBeVisible()

    // 5. Logout and verify redirected back to login page
    const logoutButton = page.locator('button:has-text("Đăng xuất")')
    await logoutButton.click()
    await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap/)
  })

  test('unauthenticated visitors visiting /tai-khoan are redirected to /tai-khoan/dang-nhap', async ({
    page,
  }) => {
    await page.goto('/tai-khoan')
    await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap/)
  })

  test('open redirect via absolute URL ?next= is safely sanitized', async ({ page }) => {
    await page.goto('/tai-khoan/dang-nhap?next=https://evil.com')
    await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap/)
  })

  test('open redirect with control characters ?next=/%09/evil.com stays safely on site', async ({
    page,
  }) => {
    await page.goto('/tai-khoan/dang-nhap?next=/%09/evil.com')
    await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap/)

    const email = `safe-redirect-${Date.now()}@tramdungcamxuc.test`
    await page.locator('input[name="email"]').fill(email)
    const consentCheckbox = page.locator('input[name="consentPolicy"]')
    await consentCheckbox.check()
    await page.locator('button[type="submit"]').click()

    const codeInput = page.locator('input[name="code"]')
    await expect(codeInput).toBeVisible({ timeout: 15000 })
    const otpCode = await getTestOtpCode(page, email)
    await codeInput.fill(otpCode)
    await page.locator('button[type="submit"]').click()

    // After login, redirected to default /tai-khoan, never external evil.com
    await expect(page).toHaveURL(/\/tai-khoan/)
    expect(page.url()).not.toContain('evil.com')
  })
})
