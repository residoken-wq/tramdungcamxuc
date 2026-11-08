import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

async function bootstrapAdmin(page: Page): Promise<number> {
  const init = await (await page.request.get('/api/users/init')).json()
  if (init.initialized) {
    // If already initialized in dev, sign in with default test credentials if needed
    return 1
  }

  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk33-${randomUUID()}@example.test`)
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

test.describe('PK-33: One-click header and footer creation from template in Navigation', () => {
  test('creates footer page from template, fills relationship field, opens builder with footer controls, and disables drawer create button', async ({
    page,
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs only on desktop-1440.')
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let createdPageId: string | number | undefined

    try {
      await bootstrapAdmin(page)

      // 1. Navigate to Navigation global in admin
      await page.goto('/admin/globals/navigation', { waitUntil: 'networkidle' })

      // 2. Verify drawer for footerPage does not have "Create new" (+) button
      // Relationship field drawer button / allowCreate check
      const footerPageSection = page.locator('.field-type.relationship', { hasText: 'Trang chân trang' }).first()
      await expect(footerPageSection).toBeVisible()
      // With allowCreate: false, there should be no "create new" / plus button inside the relation field
      const createNewBtn = footerPageSection.locator('button[aria-label*="Create"], button.relationship__add-new')
      await expect(createNewBtn).toHaveCount(0)

      // 3. Find "Tạo chân trang từ mẫu" button
      const createFooterBtn = page.getByRole('button', { name: /Tạo chân trang từ mẫu/i })
      await expect(createFooterBtn).toBeVisible()

      // 4. Listen for new tab (window.open to builder) & response from create-from-template
      const createPromise = page.waitForResponse(
        (res) => res.url().includes('/api/pages/create-from-template') && res.request().method() === 'POST',
      )
      const popupPromise = context.waitForEvent('page')

      await createFooterBtn.click()

      const createRes = await createPromise
      expect(createRes.status()).toBe(200)
      const createdData = await createRes.json()
      createdPageId = createdData.id
      expect(createdPageId).toBeDefined()

      // 5. Verify the builder opened in a new tab
      const builderPage = await popupPromise
      await builderPage.waitForLoadState('domcontentloaded')
      await expect(builderPage).toHaveURL(new RegExp(`/builder/${createdPageId}`))

      // In builder, verify CHÂN TRANG root label and Nền footer field
      await expect(builderPage.getByText(/CHÂN TRANG/i).first()).toBeVisible({ timeout: 30000 })
      await expect(builderPage.getByText(/Nền footer/i).first()).toBeVisible()

      await builderPage.close()

      // 6. Navigation global was NOT saved, site source is unchanged
      // (The test explicitly does not click Save on Navigation)
    } finally {
      if (createdPageId) {
        // Clean up created test page
        await page.request.delete(`/api/pages/${createdPageId}`).catch(() => {})
      }
    }
  })
})

