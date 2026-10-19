import { expect, test } from './fixtures'

// SM-02: navbar submenus (styleguide demo data, no DB needed) and legacy path redirects.

test.describe('Navbar submenu (SM-02)', () => {
  test('desktop: opens by mouse and by keyboard, Esc returns focus', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop only.')
    await page.goto('/styleguide')
    const nav = page.getByRole('navigation', { name: 'Điều hướng chính' }).first()
    const trigger = nav.getByRole('button', { name: '[MẪU] Sản phẩm' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.hover()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(nav.getByRole('link', { name: /\[MẪU\] EQ Buddy/ })).toBeVisible()
    await expect(nav.getByText('[MẪU] Dành cho Doanh nghiệp')).toBeVisible()

    await page.mouse.move(0, 600)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Tab')
    await expect(nav.getByRole('link', { name: /\[MẪU\] Lộ trình/ })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('mobile: accordion inside the drawer reaches a submenu link', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only.')
    await page.goto('/styleguide')
    await page.locator('#mobile-nav-toggle').first().click()
    const drawer = page.locator('#mobile-nav-drawer').first()
    const trigger = drawer.getByRole('button', { name: '[MẪU] Sản phẩm' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const link = drawer.getByRole('link', { name: /\[MẪU\] EQ Buddy/ })
    await expect(link).toBeVisible()
    const box = await link.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize()!.width)
  })
})

test.describe('Legacy paths (SM-02)', () => {
  for (const [from, to] of [
    ['/thu-vien?tab=noi-dung&topic=eq', '/tai-nguyen?tab=noi-dung&topic=eq'],
    ['/ve-hana', '/ve-tram'],
    ['/coaching/growth-mirror', '/lo-trinh-chuyen-minh'],
  ] as const) {
    test(`${from} redirects permanently to ${to}`, async ({ request }) => {
      const res = await request.get(from, { maxRedirects: 0 })
      expect(res.status()).toBe(308)
      expect(res.headers()['location']).toBe(to)
    })
  }
})
