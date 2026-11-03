import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-13b: Click to insert blocks & 2-column pattern', () => {
  test('click to insert 2-column pattern, empty container button, and hidden FreeSection in drawer', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `eb13b-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-eb13b-${randomUUID()}`

    let userId: number | undefined
    let pageId: number | undefined

    try {
      // 1. First admin on clean DB
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()
      test.skip(
        !process.env.CI && initData.initialized === true,
        'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
      )

      await page.goto('/admin/create-first-user')
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

      // 2. Create an empty draft page
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-13b',
          slug,
          _status: 'draft',
          puckData: {
            content: [],
            root: { props: { title: '[MẪU] E2E EB-13b' } },
            zones: {},
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 3. Open Builder
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
        timeout: 30000,
      })
      await page.waitForTimeout(600)
      const canvas = page.frameLocator('iframe')

      // 4. Verify FreeSection is hidden from LeftPanel library drawer
      const freeSectionGroup = page.getByRole('button', {
        name: /Section tự do/i,
      })
      await expect(freeSectionGroup).toHaveCount(0)

      // 5. Click the 2-column pattern item at top of "Bố cục"
      const patternItem = page
        .getByRole('button', { name: 'Khung 2 cột (ảnh + chữ)' })
        .getByTestId('pattern-two-columns')
      await expect(patternItem).toBeVisible({ timeout: 10000 })
      await patternItem.click()
      await page.waitForTimeout(600)

      // The pattern inserted a Container (image + text) and selected it.
      await expect(canvas.getByRole('button', { name: /^Chưa chọn ảnh/ }).first()).toBeVisible({
        timeout: 10000,
      })
      await expect(canvas.locator('p:has-text("[MẪU]")').first()).toBeVisible()
      await expect(canvas.getByRole('toolbar', { name: /Container/ })).toBeVisible()

      // 6. With the Container selected, click "Tiêu đề": it goes to the end of the Container slot.
      await page.getByRole('button', { name: 'Tiêu đề', exact: true }).click()
      await page.waitForTimeout(600)

      // 7. Publish page
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 15000,
      })

      const res = await page.request.get(`/api/pages/${pageId}?depth=0`)
      expect(res.ok()).toBe(true)
      const content = (await res.json()).puckData.content as Array<{
        type: string
        props: { id: string; items?: Array<{ type: string; props: { id: string } }> }
      }>
      const container = content.find((b) => b.type === 'Container')
      expect(container).toBeDefined()
      const childTypes = (container?.props.items ?? []).map((b) => b.type)
      expect(childTypes).toEqual(['ImageWidget', 'TextWidget', 'HeadingWidget'])

      // 8. Public page: side by side at 1440, stacked at 375.
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${slug}`)
      const textEl = page.locator('p:has-text("[MẪU] Tiêu đề nội dung")').first()
      const headingEl = page.getByRole('heading', { name: 'Tiêu đề mới' })
      await expect(textEl).toBeVisible()
      await expect(headingEl).toBeVisible()
      const t1440 = await textEl.boundingBox()
      const h1440 = await headingEl.boundingBox()
      expect(t1440 && h1440 && h1440.x > t1440.x + 40).toBe(true)

      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await expect(textEl).toBeVisible()
      const t375 = await textEl.boundingBox()
      const h375 = await headingEl.boundingBox()
      expect(t375 && h375 && h375.y >= t375.y + t375.height - 1).toBe(true)
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })

  test('existing page with FreeSection renders intact on public page', async ({ page }) => {
    const slug = `e2e-freesection-legacy-${randomUUID()}`
    let pageId: number | undefined

    try {
      const created = await page.request.post('/api/pages', {
        data: {
          title: '[MẪU] Legacy FreeSection Page',
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'FreeSection',
                props: {
                  id: `free-${randomUUID().slice(0, 8)}`,
                  columns: '1',
                  col1: [
                    {
                      type: 'ParagraphEl',
                      props: {
                        id: `para-${randomUUID().slice(0, 8)}`,
                        content: 'Đoạn văn từ FreeSection cũ vẫn hiển thị bình thường',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] Legacy FreeSection' } },
            zones: {},
          },
        },
      })

      if (created.ok()) {
        pageId = (await created.json()).doc.id
        await page.goto(`/${slug}`)
        await expect(
          page.getByText('Đoạn văn từ FreeSection cũ vẫn hiển thị bình thường'),
        ).toBeVisible()
      }
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
    }
  })
})
