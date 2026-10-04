import { expect, test } from '@playwright/test'

test.describe('Admin Smoke Test', () => {
  test('mở /admin trả 200', async ({ page }) => {
    const response = await page.goto('/admin')
    expect(response).not.toBeNull()
    expect(response?.status()).toBe(200)
    await expect(page).toHaveURL(/\/admin/)
  })
})
