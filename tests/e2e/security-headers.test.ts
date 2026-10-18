import { expect, test } from '@playwright/test'

test.describe('Security Headers and SEO End-to-End Tests', () => {
  test('trang chủ / trả về các security headers mong muốn', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status(), 'Trang chủ phải trả về mã 200 OK').toBe(200)

    const headers = res.headers()

    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(headers['permissions-policy']).toBeDefined()
    expect(headers['permissions-policy']).toContain('camera=()')

    expect(headers['content-security-policy-report-only']).toBeDefined()
    expect(headers['content-security-policy-report-only']).toContain("default-src 'self'")
    expect(headers['content-security-policy-report-only']).toContain("frame-ancestors 'self'")
  })

  test('/admin không bị chặn bởi restrictive headers và vẫn mở được bình thường', async ({
    page,
  }) => {
    const response = await page.goto('/admin')
    expect(response, 'Phản hồi /admin không được null').not.toBeNull()
    expect(response!.status(), 'Phản hồi /admin không được lỗi').toBeLessThan(400)
    await expect(page).toHaveURL(/\/admin/)
  })

  test('/sitemap.xml trả về 200 và có chứa URL /tai-nguyen', async ({ request }) => {
    const res = await request.get('/sitemap.xml')
    expect(res.status(), 'Sitemap XML phải trả về 200').toBe(200)

    const xml = await res.text()
    expect(xml).toContain('/tai-nguyen')
  })
})
