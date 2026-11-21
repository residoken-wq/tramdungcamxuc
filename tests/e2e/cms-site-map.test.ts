import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

// CMS site map (/admin/so-do-website): admin only, menu tree + searchable cards with edit links.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`sitemap-${randomUUID()}@example.test`)
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

test.describe('CMS site map', () => {
  test('admin sees the site map, finds a page and opens its edit form; 375 fits', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')
    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    // Visitors are sent to the login page
    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()
    await guest.goto('/admin/so-do-website', { waitUntil: 'domcontentloaded' })
    await expect(guest).toHaveURL(/\/admin\/(login|create-first-user)/)
    await visitor.close()

    let adminId: number | undefined
    try {
      adminId = await bootstrapAdmin(page)
      await expect(page.getByTestId('cms-guide-siteMap')).toBeVisible({ timeout: 30000 })
      await page.getByTestId('cms-guide-siteMap').click()
      await expect(page).toHaveURL(/\/admin\/so-do-website/)
      await expect(page.getByTestId('site-map')).toBeVisible({ timeout: 30000 })
      await expect(page.getByRole('heading', { name: 'Menu khách đang thấy' })).toBeVisible()

      // Typing before hydration is lost: retry until the filter is applied
      await expect(async () => {
        await page.getByTestId('site-map-search').fill('')
        await page.getByTestId('site-map-search').fill('rut the')
        await expect(page.getByTestId('site-map-card-habit-5')).toHaveCount(0, { timeout: 1000 })
      }).toPass({ timeout: 30000 })
      await expect(page.getByTestId('site-map-card-eq-draw')).toBeVisible()

      await page.getByTestId('site-map-search').fill('5 phut')
      const card = page.getByTestId('site-map-card-habit-5')
      await expect(card).toBeVisible()
      await card.getByRole('link', { name: /Kỹ thuật thực hành/ }).click()
      await expect(page).toHaveURL(/\/admin\/collections\/techniques/)

      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/admin/so-do-website', { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('site-map')).toBeVisible({ timeout: 30000 })
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
      await expectNoSeriousA11y(page, '/admin/so-do-website', {
        include: ['[data-testid="site-map"]'],
      })
    } finally {
      if (adminId) await page.request.delete(`/api/users/${adminId}`).catch(() => {})
    }
  })
})
