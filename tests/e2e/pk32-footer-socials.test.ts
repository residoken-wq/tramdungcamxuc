import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk32-${randomUUID()}@example.test`)
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

test.describe('PK-32: Footer icon mạng xã hội đọc từ Cài đặt Website + thêm TikTok', () => {
  test('public footer renders Facebook, TikTok, YouTube icons from siteSettings, responsive at 375px without scroll, axe clean', async ({
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

    let previousSettings: Record<string, unknown> | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      await bootstrapAdmin(page)

      // 1. Read previous siteSettings
      const prevRes = await page.request.get('/api/globals/siteSettings?depth=0')
      expect(prevRes.ok()).toBe(true)
      previousSettings = await prevRes.json()

      // 2. Update siteSettings with Facebook, TikTok, YouTube links
      const patchRes = await page.request.post('/api/globals/siteSettings', {
        data: {
          facebookUrl: 'https://example.com/mau-facebook',
          tiktokUrl: 'https://example.com/mau-tiktok',
          youtubeUrl: 'https://example.com/mau-youtube',
        },
      })
      expect(patchRes.ok(), 'Cập nhật siteSettings phải thành công').toBe(true)

      // 3. Open '/' as guest at 1440px
      await guest.setViewportSize({ width: 1440, height: 900 })
      await guest.goto('/', { waitUntil: 'domcontentloaded' })

      const footer = guest.locator('footer')
      await expect(footer).toBeVisible()

      // Verify links with aria-label containing network names
      const fbLink = footer.locator('a[aria-label*="Facebook"]')
      const ttLink = footer.locator('a[aria-label*="TikTok"]')
      const ytLink = footer.locator('a[aria-label*="YouTube"]')

      await expect(fbLink).toBeVisible()
      await expect(ttLink).toBeVisible()
      await expect(ytLink).toBeVisible()

      await expect(fbLink).toHaveAttribute('href', 'https://example.com/mau-facebook')
      await expect(ttLink).toHaveAttribute('href', 'https://example.com/mau-tiktok')
      await expect(ytLink).toHaveAttribute('href', 'https://example.com/mau-youtube')

      // Verify buttons are 40x40 and round
      const ttBox = await ttLink.boundingBox()
      expect(ttBox).not.toBeNull()
      if (ttBox) {
        expect(Math.round(ttBox.width)).toBeGreaterThanOrEqual(40)
        expect(Math.round(ttBox.height)).toBeGreaterThanOrEqual(40)
      }

      // 4. Test on mobile 375px
      await guest.setViewportSize({ width: 375, height: 667 })
      await guest.waitForTimeout(300)

      const hasHorizontalScroll = await guest.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      )
      expect(hasHorizontalScroll, 'Trang không được cuộn ngang ở 375px').toBe(false)

      // 5. Check axe accessibility
      await expectNoSeriousA11y(guest)
    } finally {
      if (previousSettings) {
        await page.request
          .post('/api/globals/siteSettings', {
            data: previousSettings,
          })
          .catch(() => {})
      }
      await visitor.close()
    }
  })
})

