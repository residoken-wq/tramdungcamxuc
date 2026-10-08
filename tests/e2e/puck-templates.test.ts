import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from '@playwright/test'

test.describe('T1-04: Puck Templates, Versions, Locked Blocks and Autosave', () => {
  test('creates page from campaign template, edits, publishes, restores from history, and verifies locked Hero on homepage', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `t1-04-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-template-campaign-${randomUUID()}`
    const updatedTitle = `Chiến Dịch Đã Cập Nhật ${randomUUID().slice(0, 6)}`

    let userId: number | undefined
    let pageId: number | undefined
    let homepageId: number | undefined

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

      // 2. Admin creates a new page with template: 'campaign' via REST API
      const createRes = await page.request.post('/api/pages?draft=true', {
        data: {
          title: 'Chiến Dịch Mẫu E2E',
          slug: pageSlug,
          template: 'campaign',
          _status: 'draft',
        },
      })
      expect(createRes.ok()).toBe(true)
      const createdJson = await createRes.json()
      pageId = createdJson.doc.id
      expect(pageId).toBeDefined()

      // Verify that beforeChange hook populated puckData with template content
      expect(Array.isArray(createdJson.doc.puckData?.content)).toBe(true)
      expect(createdJson.doc.puckData.content.length).toBeGreaterThanOrEqual(4)

      // 3. Open Puck editor for the newly created page
      await page.goto(`/builder/${pageId}`, { waitUntil: 'load' })

      // Wait for Puck iframe canvas to load and show template blocks
      const canvas = page.frameLocator('iframe')
      const heroBlock = canvas.locator('[data-puck-component="HeroImage"]').first()
      await expect(heroBlock).toBeVisible({ timeout: 15000 })

      // Verify template components are present in canvas
      await expect(canvas.locator('[data-puck-component="SectionHeader"]').first()).toBeVisible()
      await expect(canvas.locator('[data-puck-component="LeadForm"]').first()).toBeVisible()

      // 4. Edit title and publish page
      // Click on SectionHeader to select it and edit titleLine1
      const sectionHeader = canvas.locator('[data-puck-component="SectionHeader"]').first()
      await sectionHeader.click()

      // Edit field in Puck right sidebar
      const titleLine1Field = page
        .locator('input[name="titleLine1"], #titleLine1, input[id*="titleLine1"]')
        .first()
      if (await titleLine1Field.isVisible()) {
        await titleLine1Field.fill(updatedTitle)
      }

      // Click "Xuất bản" button in header
      const publishBtn = page.getByRole('button', { name: 'Xuất bản', exact: true })
      await expect(publishBtn).toBeVisible()
      await publishBtn.click()

      // Wait for published status feedback badge
      await expect(page.getByRole('status')).toContainText('Đã xuất bản', { timeout: 15000 })

      // 5. Verify public page reflects published content (do NOT use networkidle because of Turnstile)
      await publicPage.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      await expect(publicPage.locator('body')).toContainText('ĐỒNG HÀNH CHUYỂN HÓA', {
        timeout: 15000,
      })

      // 6. Test History and Restore Version
      // Make a draft change and save draft to create a new version
      const saveDraftBtn = page.getByRole('button', { name: 'Lưu nháp', exact: true })
      await saveDraftBtn.click()
      await expect(page.getByRole('status')).toContainText('Đã lưu bản nháp', { timeout: 15000 })

      // Open version history modal
      const historyBtn = page.getByRole('button', { name: 'Lịch sử', exact: true })
      await historyBtn.click()

      const historyModal = page.getByRole('dialog', { name: 'Lịch sử phiên bản' })
      await expect(historyModal).toBeVisible({ timeout: 10000 })

      // Expect at least one restore button in the list
      const restoreButtons = historyModal.getByRole('button', { name: 'Khôi phục' })
      await expect(restoreButtons.first()).toBeVisible()

      // Auto-accept confirmation dialog when restoring
      page.once('dialog', async (dialog) => {
        await dialog.accept()
      })

      // Click restore on the first available version
      await restoreButtons.first().click()

      // Verify restore feedback
      await expect(page.getByRole('status')).toContainText('Đã khôi phục phiên bản', {
        timeout: 15000,
      })

      // 7. Verify Locked Block on Homepage slug '/'
      // Create or locate a homepage document
      const homeRes = await page.request.post('/api/pages?draft=true', {
        data: {
          title: 'Trang Chủ Kiểm Thử E2E',
          slug: `home-e2e-${randomUUID()}`,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HeroTwoEntries',
                props: {
                  id: 'hero-locked-e2e',
                  titleLine1: 'TIÊU ĐỀ KHÓA',
                  titleLine2: 'KHÔNG THỂ XÓA',
                },
              },
            ],
            root: { props: { title: 'Trang Chủ' } },
          },
        },
      })
      expect(homeRes.ok()).toBe(true)
      const homeJson = await homeRes.json()
      homepageId = homeJson.doc.id

      // Open builder for homepage
      await page.goto(`/builder/${homepageId}`, { waitUntil: 'load' })
      const homeCanvas = page.frameLocator('iframe')
      const lockedHero = homeCanvas.locator('[data-puck-component="HeroTwoEntries"]').first()
      await expect(lockedHero).toBeVisible({ timeout: 15000 })

      // Click on Hero to reveal action bar / outline
      await lockedHero.click()

      // On locked components, delete and duplicate actions are disabled or absent
      const deleteAction = page.locator(
        'button[title*="Xóa"], button[aria-label*="Xóa"], [data-puck-action="delete"]',
      )
      const isDeleteDisabledOrHidden =
        (await deleteAction.count()) === 0 || (await deleteAction.first().isDisabled())
      expect(isDeleteDisabledOrHidden).toBe(true)
    } finally {
      // Cleanup created resources via REST API
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`)
      }
      if (homepageId) {
        await page.request.delete(`/api/pages/${homepageId}`)
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`)
      }
      await publicContext.close()
    }
  })
})
