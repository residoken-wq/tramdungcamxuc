import { randomUUID } from 'node:crypto'
import { expect, test, type Response } from './fixtures'

test('first administrator sees all six admin groups (CM-01)', async ({ page }, testInfo) => {
  // Bootstrap once: projects share the same database. Mobile is verified below.
  test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
  test.setTimeout(180000)
  page.setDefaultTimeout(20000)
  const email = `t0-06-${randomUUID()}@example.test`
  const password = randomUUID()
  let userId: number | undefined
  let packageId: number | undefined
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 500) {
      errors.push(`${response.status()} ${response.url()}`)
    }
  })

  try {
    const init = await page.request.get('/api/users/init')
    expect(init.ok()).toBe(true)
    const initData = await init.json()
    test.skip(
      !process.env.CI && initData.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(initData, 'Run this bootstrap test on a migrated DB without admin users.').toMatchObject(
      { initialized: false },
    )
    // Wait for the admin bundle to hydrate; a click before hydration is silently dropped.
    await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
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
    const registered = await response.json()
    // T0-07: the very first admin becomes owner.
    expect(registered.user?.role ?? registered.doc?.role).toBe('owner')
    userId = registered.user?.id || registered.doc?.id
    await expect(page).toHaveURL(/\/admin\/?$/)
    if (!userId) userId = (await (await page.request.get('/api/users/me')).json()).user.id

    // CM-01: menu grouped by Hana's jobs; owner also sees the system group.
    const groups = [
      'Trang web',
      'Sản phẩm & bán hàng',
      'Khóa Habit',
      'EQ Buddy',
      'Học viên & khách',
      'Hệ thống',
    ]
    await page.setViewportSize({ width: 1440, height: 1200 })
    const openMenu = page.locator('button.nav-toggler:visible').first()
    if (await openMenu.count()) await openMenu.click()
    const nav = page.locator('.nav')
    for (const group of groups) {
      await nav.getByText(group, { exact: true }).scrollIntoViewIfNeeded()
      await expect(nav.getByText(group, { exact: true })).toBeInViewport()
    }
    for (const [slug, label] of [
      ['products', 'Sản phẩm'],
      ['services', 'Dịch vụ đồng hành'],
      ['programs', 'Chương trình doanh nghiệp'],
      ['posts', 'Bài viết và video'],
      ['testimonials', 'Lời chia sẻ'],
      ['eqCards', 'Thẻ EQ Buddy'],
      ['courseModules', 'Nhóm bài học'],
      ['lessons', 'Bài học'],
      ['diagnosticQuestions', 'Câu hỏi chẩn đoán'],
      ['techniques', 'Kỹ thuật thực hành'],
      ['legalPages', 'Trang pháp lý'],
      ['workshops', 'Lịch workshop'],
      ['pages', 'Trang nội dung'],
      ['media', 'Thư viện ảnh và tài liệu'],
    ])
      await expect(page.locator(`#nav-${slug}`)).toHaveText(label)
    await expect(page.locator('#nav-global-siteSettings')).toHaveText('Cài đặt website')
    await expect(page.locator('#nav-global-navigation')).toHaveText('Menu điều hướng')
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.screenshot({ path: testInfo.outputPath('admin-six-groups.png'), fullPage: true })
    await testInfo.attach('Sidebar admin — 6 nhóm', {
      path: testInfo.outputPath('admin-six-groups.png'),
      contentType: 'image/png',
    })

    // CM-03: package value fields only show for type = package, in the "Gói & quyền" tab.
    const pkgRes = await page.request.post('/api/products?draft=true', {
      data: {
        name: '[MẪU] Gói kiểm thử CM-01',
        slug: `goi-kiem-thu-${Date.now()}`,
        web: 'site',
        type: 'package',
        saleStatus: 'coming_soon',
        _status: 'draft',
      },
    })
    expect(pkgRes.ok(), await pkgRes.text()).toBe(true)
    packageId = (await pkgRes.json()).doc.id
    await page.goto(`/admin/collections/products/${packageId}`)
    await page.getByRole('button', { name: 'Gói & quyền' }).click()
    await expect(page.locator('#field-totalValue')).toBeDisabled()
    await expect(page.locator('#field-discountPercent')).toBeDisabled()

    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin')
    if (await openMenu.count()) await openMenu.click()
    for (const group of groups) {
      await nav.getByText(group, { exact: true }).scrollIntoViewIfNeeded()
      await expect(nav.getByText(group, { exact: true })).toBeInViewport()
    }
    await page.screenshot({ path: testInfo.outputPath('admin-mobile.png'), fullPage: true })
    expect(errors).toEqual([])
  } finally {
    if (packageId) await page.request.delete(`/api/products/${packageId}`).catch(() => {})
    test.setTimeout(testInfo.timeout + 30000)
    // Remove only the test account created above, leaving the first-user flow repeatable.
    if (userId) {
      const response = await page.request.delete(`/api/users/${userId}`)
      expect(response.ok(), 'The temporary test account must be removed.').toBe(true)
    }
  }
})
