import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response, type APIRequestContext } from './fixtures'
import { vi } from '../../src/lib/i18n/vi'

async function createFirstUser(page: Page, email: string, password: string): Promise<number> {
  await page.goto('/admin/create-first-user')
  await page.locator('#field-email').fill(email)
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

async function getGlobal(request: APIRequestContext, slug: string) {
  const res = await request.get(`/api/globals/${slug}?depth=0`)
  expect(res.ok()).toBe(true)
  return res.json()
}

test.describe('CF-01: Floating coffee widget with MoMo QR modal', () => {
  test('admin activates coffee widget, public sees it at 1440 and 375, modal opens and closes with Esc, hidden on /eq-buddy/rut-the', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const adminEmail = `cf01-${randomUUID()}@example.test`
    const adminPassword = randomUUID()
    const mediaAlt = `[MẪU] QR MoMo CF-01 - ${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let mediaId: string | number | undefined
    let settingsBefore: Record<string, unknown> | undefined

    try {
      // 1. First admin on clean DB or login
      const init = await (await page.request.get('/api/users/init')).json()
      if (init.initialized === false) {
        userId = await createFirstUser(page, adminEmail, adminPassword)
      } else {
        // Authenticate as existing admin if available
        const meRes = await page.request.get('/api/users/me')
        if (!meRes.ok() || !(await meRes.json()).user) {
          test.skip(true, 'DB dev đã có admin nhưng chưa có phiên đăng nhập.')
        }
      }

      // Save initial siteSettings
      settingsBefore = await getGlobal(page.request, 'siteSettings')

      // 2. Upload sample QR media via REST
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lN8AAAAASUVORK5CYII=',
        'base64',
      )
      const uploadRes = await page.request.post('/api/media', {
        multipart: {
          _payload: JSON.stringify({ alt: mediaAlt }),
          file: {
            name: `cf01-qr-${randomUUID().slice(0, 8)}.png`,
            mimeType: 'image/png',
            buffer: pngBuffer,
          },
        },
      })
      expect(uploadRes.ok()).toBe(true)
      const uploadData = await uploadRes.json()
      mediaId = uploadData.doc?.id || uploadData.id
      expect(mediaId).toBeDefined()

      // 3. Update siteSettings to enable coffee donation widget
      const updateRes = await page.request.post('/api/globals/siteSettings', {
        data: {
          coffeeDonation: {
            enabled: true,
            qrImage: mediaId,
            title: '[MẪU] Mời Trạm một ly cà phê',
            message: '[MẪU] Cảm ơn sự đồng hành ấm áp của bạn.',
            momoUrl: 'https://me.momo.vn/tramdungcamxuc',
          },
        },
      })
      expect(updateRes.ok()).toBe(true)

      // 4. Test public UI on desktop (1440px) and mobile (375px)
      for (const width of [1440, 375]) {
        const ctx = await browser.newContext({
          baseURL: testInfo.project.use.baseURL,
          viewport: { width, height: width === 375 ? 667 : 900 },
        })
        const pub = await ctx.newPage()
        try {
          // Open home page
          await pub.goto('/')

          // Locate floating coffee button
          const coffeeBtn = pub.getByRole('button', {
            name: vi.cf01.floatingCoffee.ariaLabel,
          })
          await expect(coffeeBtn, `coffee button visible at ${width}px`).toBeVisible()

          // Click coffee button to open modal
          await coffeeBtn.click()

          // Modal should display QR image with alt text
          const qrImg = pub.getByAltText(mediaAlt)
          await expect(qrImg).toBeVisible()

          // "Mở MoMo" button should be visible
          const momoLink = pub.getByRole('link', {
            name: vi.cf01.floatingCoffee.openMomo,
          })
          await expect(momoLink).toBeVisible()
          await expect(momoLink).toHaveAttribute('href', 'https://me.momo.vn/tramdungcamxuc')
          await expect(momoLink).toHaveAttribute('target', '_blank')

          // Close modal with Escape key
          await pub.keyboard.press('Escape')
          await expect(qrImg).not.toBeVisible()

          // Focus must be returned to the coffee button
          await expect(coffeeBtn).toBeFocused()

          // Verify widget is hidden on /eq-buddy/rut-the
          await pub.goto('/eq-buddy/rut-the')
          await expect(
            pub.getByRole('button', { name: vi.cf01.floatingCoffee.ariaLabel }),
          ).not.toBeVisible()
        } finally {
          await ctx.close()
        }
      }
    } finally {
      // 5. Cleanup test artifacts
      if (settingsBefore) {
        await page.request
          .post('/api/globals/siteSettings', {
            data: {
              coffeeDonation: settingsBefore.coffeeDonation ?? {
                enabled: false,
                qrImage: null,
                title: null,
                message: null,
                momoUrl: null,
              },
            },
          })
          .catch(() => {})
      }
      if (mediaId) {
        await page.request.delete(`/api/media/${mediaId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
