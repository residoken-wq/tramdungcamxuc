import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-03: Elementor-style editor frame (block library search, viewports, undo, structure)', () => {
  test('searches block, drags HeroImage into canvas, saves draft, switches viewport, undos, and opens structure', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `eb-03-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-frame-${randomUUID()}`

    let userId: number | undefined
    let pageId: number | undefined

    try {
      // 1. Authenticate or create first user (clean DB self-contained)
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

      // 2. Create blank draft page via REST
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E Elementor Frame Test',
          slug,
          _status: 'draft',
          puckData: { content: [], root: {} },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id
      expect(pageId).toEqual(expect.any(Number))

      // 3. Open Puck editor
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      const dropzone = canvas.locator('[data-puck-dropzone]').first()
      await expect(dropzone).toBeVisible()

      // 4. Search for "hero" in LeftPanel
      const searchInput = page.getByPlaceholder(/Tìm khối/i)
      await expect(searchInput).toBeVisible()
      await searchInput.fill('hero')

      // Block "Hero Ảnh biểu tượng" should be visible in search results
      const heroBlock = page.getByRole('button', {
        name: 'Hero Ảnh biểu tượng (Hero Image)',
        exact: true,
      })
      await expect(heroBlock).toBeVisible()

      // 5. Drag "Hero Ảnh biểu tượng" into canvas dropzone
      await heroBlock.scrollIntoViewIfNeeded()
      const heroSource = await heroBlock.boundingBox()
      const rootTarget = await dropzone.boundingBox()
      if (!heroSource || !rootTarget) {
        throw new Error('Hero block or root dropzone not visible for drag.')
      }

      await page.mouse.move(
        heroSource.x + heroSource.width / 2,
        heroSource.y + heroSource.height / 2,
      )
      await page.mouse.down()
      await page.mouse.move(
        heroSource.x + heroSource.width / 2 + 15,
        heroSource.y + heroSource.height / 2,
        { steps: 5 },
      )
      await page.mouse.move(rootTarget.x + rootTarget.width / 2, rootTarget.y + 60, { steps: 30 })
      await page.mouse.up()

      // Verify Hero block is inserted in the iframe
      await expect(canvas.locator('[data-puck-component]')).toHaveCount(1)

      // 6. Save Draft
      const saveDraftBtn = page.getByRole('button', { name: 'Lưu nháp', exact: true })
      await expect(saveDraftBtn).toBeVisible()
      await saveDraftBtn.click()
      await expect(page.getByRole('status').filter({ hasText: /Đã lưu bản nháp/i })).toBeVisible({
        timeout: 15000,
      })

      // 7. Click viewport 375px in EditorToolbar
      const mobileViewportBtn = page.getByRole('button', {
        name: /Điện thoại \(375px\)/i,
      })
      await expect(mobileViewportBtn).toBeVisible()
      await mobileViewportBtn.click()
      await expect(mobileViewportBtn).toHaveAttribute('aria-pressed', 'true')

      // 8. Undo via EditorToolbar -> Block should disappear
      // Puck's own header also has an undo button: use the one in the EB-03 bottom toolbar.
      const toolbar = page.locator('footer[aria-label="Thanh công cụ trình dựng"]')
      const undoBtn = toolbar.getByRole('button', { name: 'Hoàn tác', exact: true })
      await expect(undoBtn).toBeVisible()
      await expect(undoBtn).toBeEnabled()
      await undoBtn.click()

      // After undo, canvas component count drops to 0
      await expect(canvas.locator('[data-puck-component]')).toHaveCount(0)

      // 9. Click tab "Cấu trúc" (Outline) in LeftPanel
      const structureTab = page.getByRole('tab', { name: 'Cấu trúc', exact: true })
      await expect(structureTab).toBeVisible()
      await structureTab.click()

      // Outline panel is displayed
      await expect(page.locator('#panel-outline')).toBeVisible()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary test page must be deleted.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'Temporary test user must be deleted.').toBe(true)
        }
      }
    }
  })
})
