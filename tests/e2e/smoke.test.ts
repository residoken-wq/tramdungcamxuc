import { expect, test } from '@playwright/test'

test.describe('Admin Smoke Test (Real DB Check)', () => {
  test('GET /api/users/init trả về 200 và xác nhận DB đã sẵn sàng', async ({ request }) => {
    const res = await request.get('/api/users/init')
    expect(res.status(), `Expected /api/users/init to return 200 but got ${res.status()}`).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('initialized')
    expect(typeof data.initialized).toBe('boolean')
  })

  test('mở /admin thấy form tạo user đầu tiên và không có lỗi 5xx từ /api/*', async ({ page }) => {
    const init = await page.request.get('/api/users/init')
    expect(init.ok()).toBe(true)
    const { initialized } = await init.json()
    test.skip(
      !process.env.CI && initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    const serverErrors: { url: string; status: number }[] = []

    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('/api/') && response.status() >= 500) {
        serverErrors.push({ url, status: response.status() })
      }
    })

    const response = await page.goto('/admin')
    expect(response, 'Response should not be null').not.toBeNull()
    expect(response!.status()).toBeLessThan(400)
    await expect(page).toHaveURL(/\/admin/)

    // Đợi form "Create first user" render ô nhập Email thực tế
    const emailInput = page.locator('input[name="email"], input#field-email')
    await expect(emailInput).toBeVisible({ timeout: 20000 })

    // Đảm bảo không có bất kỳ endpoint API nào bị lỗi 5xx
    expect(serverErrors, `Unexpected 5xx errors from API: ${JSON.stringify(serverErrors)}`).toEqual(
      [],
    )
  })
})
