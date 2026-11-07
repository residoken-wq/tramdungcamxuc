import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('SM-07: Sitemap v2 Page Templates (Contact Template E2E)', () => {
  test('creates a page with template "contact", verifies blocks in builder, publishes, and validates public 375px responsiveness', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `sm07-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-contact-${randomUUID()}`

    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      // 1. Authenticate / Bootstrap Admin User if not already initialized
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()

      test.skip(
        !process.env.CI && initData.initialized === true,
        'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
      )

      expect(initData, 'Run on a migrated DB without admin users.').toMatchObject({
        initialized: false,
      })

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
      userId = registered.user?.id || registered.doc?.id
      await expect(page).toHaveURL(/\/admin\/?$/)
      if (!userId) userId = (await (await page.request.get('/api/users/me')).json()).user.id

      // 2. Admin creates a new page with template: 'contact' via REST API
      const createRes = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] Trang Liên Hệ E2E',
          slug: pageSlug,
          template: 'contact',
          _status: 'draft',
        },
      })
      expect(createRes.ok()).toBe(true)
      const createdJson = await createRes.json()
      pageId = createdJson.doc.id
      expect(pageId).toBeDefined()

      // Verify that beforeChange hook populated puckData with contact template content
      expect(Array.isArray(createdJson.doc.puckData?.content)).toBe(true)
      expect(createdJson.doc.puckData.content.length).toBeGreaterThanOrEqual(4)

      // 3. Open Puck editor for the newly created page
      await page.goto(`/builder/${pageId}`, { waitUntil: 'load' })

      // Wait for Puck iframe canvas to load and show contact template blocks
      const canvas = page.frameLocator('iframe')
      const heroBlock = canvas
        .locator('[data-puck-component="contact-hero-cols"], [data-puck-component="contact-hero"]')
        .first()
      await expect(heroBlock).toBeVisible({ timeout: 15000 })

      // Verify ContactInfo and ContactForms blocks are present
      await expect(canvas.locator('[data-puck-component="contact-info"]').first()).toBeVisible()
      await expect(canvas.locator('[data-puck-component="contact-forms"]').first()).toBeVisible()

      // 4. Publish the page from builder UI
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByText(/Đã xuất bản thành công/)).toBeVisible({ timeout: 15000 })

      // 5. Open public page on mobile viewport (375px)
      await publicPage.setViewportSize({ width: 375, height: 667 })
      // No networkidle: the contact forms load Turnstile, which keeps the network busy on CI.
      const publicRes = await publicPage.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      expect(publicRes?.status()).toBe(200)
      await expect(publicPage.locator('form').first()).toBeVisible()

      // Verify no horizontal scrolling / overflow at 375px
      const isOverflowing = await publicPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(isOverflowing).toBe(false)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()
      // Cleanup temporary page and user
      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'The temporary test page must be removed.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'The temporary test admin account must be removed.').toBe(true)
        }
      }
    }
  })

  test('creates a page with template "home-v2", verifies blocks in builder, publishes, and validates public 375px responsiveness and screenshots', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `pk22-home-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-home-v2-${randomUUID()}`

    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      // 1. Authenticate / Bootstrap Admin User
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()

      test.skip(
        !process.env.CI && initData.initialized === true,
        'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
      )

      if (initData.initialized === false) {
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
        userId = registered.user?.id || registered.doc?.id
        await expect(page).toHaveURL(/\/admin\/?$/)
        if (!userId) userId = (await (await page.request.get('/api/users/me')).json()).user.id
      }

      // 2. Admin creates a new page with template: 'home-v2' via REST API
      const createRes = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] Trang Chủ V2 E2E',
          slug: pageSlug,
          template: 'home-v2',
          _status: 'draft',
        },
      })
      expect(createRes.ok()).toBe(true)
      const createdJson = await createRes.json()
      pageId = createdJson.doc.id
      expect(pageId).toBeDefined()

      // Verify that beforeChange hook populated puckData with home-v2 template content
      expect(Array.isArray(createdJson.doc.puckData?.content)).toBe(true)
      expect(createdJson.doc.puckData.content.length).toBeGreaterThanOrEqual(10)

      // 3. Open Puck editor for the newly created page
      await page.goto(`/builder/${pageId}`, { waitUntil: 'load' })

      // Wait for Puck iframe canvas to load and show home-v2 hero block
      const canvas = page.frameLocator('iframe')
      const heroBlock = canvas.locator('[data-puck-component="home-v2-hero"]').first()
      await expect(heroBlock).toBeVisible({ timeout: 15000 })

      // 4. Publish the page from builder UI
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByText(/Đã xuất bản thành công/)).toBeVisible({ timeout: 15000 })

      // 5. Open public page on desktop viewport (1440px)
      await publicPage.setViewportSize({ width: 1440, height: 900 })
      const publicRes1440 = await publicPage.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      expect(publicRes1440?.status()).toBe(200)

      // Verify hero title exists on page
      await expect(publicPage.getByText('Hiểu mình rõ. Hành động bền bỉ.').first()).toBeVisible({
        timeout: 10000,
      })

      if (process.env.PK22_SCREENSHOTS === '1') {
        const fs = await import('node:fs')
        const path = await import('node:path')
        const shotDir = path.resolve(process.cwd(), 'docs/screenshots/pk22')
        fs.mkdirSync(shotDir, { recursive: true })
        await publicPage.screenshot({
          path: path.join(shotDir, 'home-v2-1440.png'),
          fullPage: true,
        })
      }

      // 6. Open public page on mobile viewport (375px)
      await publicPage.setViewportSize({ width: 375, height: 667 })
      await publicPage.reload({ waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByText('Hiểu mình rõ. Hành động bền bỉ.').first()).toBeVisible({
        timeout: 10000,
      })

      // Verify no horizontal scrolling / overflow at 375px
      const isOverflowing = await publicPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(isOverflowing).toBe(false)

      if (process.env.PK22_SCREENSHOTS === '1') {
        const path = await import('node:path')
        const shotDir = path.resolve(process.cwd(), 'docs/screenshots/pk22')
        await publicPage.screenshot({
          path: path.join(shotDir, 'home-v2-375.png'),
          fullPage: true,
        })
      }
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()
      // Cleanup temporary page and user
      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'The temporary test page must be removed.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'The temporary test admin account must be removed.').toBe(true)
        }
      }
    }
  })
})
