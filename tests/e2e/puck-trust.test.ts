import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('T1-02b: Puck Trust Blocks – TestimonialGrid publication & consent privacy', () => {
  test('creates 2 testimonials (1 consented, 1 unconsented), creates page with TestimonialGrid referencing both, publishes page, and verifies only consented testimonial appears in HTML and UI', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `t1-02b-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-trust-${randomUUID()}`

    const t1Name = `Người Đã Đồng Ý ${randomUUID().slice(0, 8)}`
    const t1Quote = `Trải nghiệm tại Trạm Dừng Cảm Xúc đã thay đổi tôi tích cực ${randomUUID()}`

    const t2Name = `Người Chưa Đồng Ý ${randomUUID().slice(0, 8)}`
    const t2Quote = `Bí mật riêng tư tuyệt đối không được lộ ${randomUUID()}`

    let userId: number | undefined
    let pageId: number | undefined
    let t1Id: number | undefined
    let t2Id: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      // 1. Authenticate or create first admin user
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

      // 2. Create Testimonial 1 (consent = true, published)
      const t1Res = await page.request.post('/api/testimonials', {
        data: {
          name: t1Name,
          quote: t1Quote,
          role: 'Khách hàng thân thiết',
          language: 'vi',
          consent: true,
          _status: 'published',
        },
      })
      expect(t1Res.ok()).toBe(true)
      const t1Doc = await t1Res.json()
      t1Id = t1Doc.doc?.id || t1Doc.id
      expect(t1Id).toEqual(expect.any(Number))

      // 3. Create Testimonial 2 (consent = false, draft)
      // Note: Testimonials hook prevents publishing when consent !== true, so this stays in draft
      const t2Res = await page.request.post('/api/testimonials?draft=true', {
        data: {
          name: t2Name,
          quote: t2Quote,
          role: 'Người ẩn danh',
          language: 'vi',
          consent: false,
          _status: 'draft',
        },
      })
      expect(t2Res.ok()).toBe(true)
      const t2Doc = await t2Res.json()
      t2Id = t2Doc.doc?.id || t2Doc.id
      expect(t2Id).toEqual(expect.any(Number))

      // 4. Create Page via REST referencing both testimonials in TestimonialGrid
      const pageRes = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] Trang Niềm Tin E2E',
          slug: pageSlug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'TestimonialGrid',
                props: {
                  id: 'testimonial-grid-test',
                  mode: 'manual',
                  manualTestimonials: [
                    { testimonialId: String(t1Id) },
                    { testimonialId: String(t2Id) },
                  ],
                  columns: 3,
                },
              },
            ],
            root: { props: { title: '[MẪU] Trang Niềm Tin E2E' } },
          },
        },
      })
      expect(pageRes.ok()).toBe(true)
      const pageDoc = await pageRes.json()
      pageId = pageDoc.doc?.id || pageDoc.id
      expect(pageId).toEqual(expect.any(Number))

      // 5. Publish the page
      const publishRes = await page.request.patch(`/api/pages/${pageId}?draft=false`, {
        data: {
          _status: 'published',
        },
      })
      expect(publishRes.ok()).toBe(true)

      // 6. Navigate to public page
      await publicPage.goto(`/${pageSlug}`, { waitUntil: 'networkidle' })

      // 7. Verify Testimonial 1 is visible
      const t1Author = publicPage.getByText(t1Name).filter({ visible: true }).first()
      await expect(t1Author).toBeVisible()

      // 8. Verify Testimonial 2 is NOT visible and NOT in HTML
      const t2Author = publicPage.getByText(t2Name)
      await expect(t2Author).toHaveCount(0)

      const html = await publicPage.content()
      expect(html).not.toContain(t2Quote)
      expect(html).not.toContain(t2Name)

      // 9. Verify puckData stored in DB does not leak testimonial quote or name
      const storedPageRes = await page.request.get(`/api/pages/${pageId}?depth=0`)
      expect(storedPageRes.ok()).toBe(true)
      const storedData = await storedPageRes.json()
      const rawStoredJson = JSON.stringify(storedData.puckData || {})

      expect(rawStoredJson).not.toContain(t1Quote)
      expect(rawStoredJson).not.toContain(t1Name)
      expect(rawStoredJson).not.toContain(t2Quote)
      expect(rawStoredJson).not.toContain(t2Name)
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (t1Id) {
        await page.request.delete(`/api/testimonials/${t1Id}`).catch(() => {})
      }
      if (t2Id) {
        await page.request.delete(`/api/testimonials/${t2Id}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
      await publicPage.close().catch(() => {})
      await publicContext.close().catch(() => {})
    }
  })
})
