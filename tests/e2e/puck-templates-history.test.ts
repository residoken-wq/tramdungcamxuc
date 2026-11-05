import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-08: Block templates and version history', () => {
  test('saves section/page as template, inserts from left panel, applies saved template, previews and exits version history, and blocks unauthenticated API access', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs only on desktop-1440.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const email = `eb-08-${randomUUID()}@example.test`
    const password = randomUUID()

    const slugA = `e2e-eb08-a-${randomUUID().slice(0, 8)}`
    const slugB = `e2e-eb08-b-${randomUUID().slice(0, 8)}`

    const containerAId = `eb08-con-a-${randomUUID().slice(0, 8)}`
    const headingAId = `eb08-ha-${randomUUID().slice(0, 8)}`
    const headingAText = `[MẪU] Tiêu đề EB-08 A - ${randomUUID().slice(0, 6)}`

    const headingBId = `eb08-hb-${randomUUID().slice(0, 8)}`
    const headingBText = `[MẪU] Tiêu đề EB-08 B`

    let userId: number | undefined
    let pageAId: number | undefined
    let pageBId: number | undefined

    try {
      // 1. First admin bootstrap (self-contained on clean DB)
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

      let regResponse: Response | undefined
      await expect(async () => {
        const registration = page.waitForResponse(
          (res) =>
            res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
          { timeout: 5000 },
        )
        await page.locator('button[type="submit"]').click()
        regResponse = await registration
      }).toPass({ timeout: 60000 })

      if (!regResponse) throw new Error('First-user registration request was never sent.')
      expect(regResponse.ok()).toBe(true)
      const registered = await regResponse.json()
      userId = registered.user?.id || registered.doc?.id
      await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20000 })
      if (!userId) userId = (await (await page.request.get('/api/users/me')).json()).user.id

      // 2. Create Page A with a Container holding 1 Heading
      const createPageA = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-08 Page A',
          slug: slugA,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'Container',
                props: {
                  id: containerAId,
                  tag: 'section',
                  width: 'boxed',
                  contentWidth: 'lg',
                  items: [
                    {
                      type: 'HeadingWidget',
                      props: {
                        id: headingAId,
                        text: headingAText,
                        tag: 'h2',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-08 Page A' } },
          },
        },
      })
      expect(createPageA.ok()).toBe(true)
      pageAId = (await createPageA.json()).doc.id
      expect(pageAId).toBeDefined()

      // 3. Create Page B with a single HeadingWidget
      const createPageB = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-08 Page B',
          slug: slugB,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HeadingWidget',
                props: {
                  id: headingBId,
                  text: headingBText,
                  tag: 'h2',
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-08 Page B' } },
          },
        },
      })
      expect(createPageB.ok()).toBe(true)
      pageBId = (await createPageB.json()).doc.id
      expect(pageBId).toBeDefined()

      // -----------------------------------------------------------------------
      // Kịch bản 1: Mở builder trang A -> Chuột phải Container -> "Lưu thành mẫu" -> Nhập tên -> Lưu
      // -----------------------------------------------------------------------
      await page.goto(`/builder/${pageAId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
        timeout: 30000,
      })

      const canvasA = page.frameLocator('iframe')
      const containerBlock = canvasA.locator(`[data-puck-component="${containerAId}"]`)
      await expect(containerBlock).toBeVisible()

      // Right-click container block on canvas
      await containerBlock.click({ button: 'right' })
      const contextMenu = page.getByRole('menu', { name: 'Tác vụ khối' })
      await expect(contextMenu).toBeVisible()

      // Click "Lưu thành mẫu"
      const templateName = `Mẫu khung hero ${randomUUID().slice(0, 6)}`
      await page.getByRole('menuitem', { name: 'Lưu thành mẫu' }).click()

      // Save template modal opens
      const saveModal = page.getByRole('dialog', { name: 'Lưu thành mẫu' })
      await expect(saveModal).toBeVisible()

      const nameInput = saveModal.locator('#template-name-input')
      await nameInput.fill(templateName)
      await saveModal.getByRole('button', { name: 'Lưu mẫu' }).click()

      // Toast notification confirms success
      await expect(
        page.getByRole('status').filter({ hasText: 'Đã lưu mẫu thành công' }),
      ).toBeVisible({ timeout: 10000 })

      // -----------------------------------------------------------------------
      // Kịch bản 2: Mở builder trang B -> Mở tab "Mẫu" -> Thấy mẫu -> Bấm Chèn
      // -----------------------------------------------------------------------
      await page.goto(`/builder/${pageBId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
        timeout: 30000,
      })

      // Click tab "Mẫu" in LeftPanel
      const templatesTab = page.locator('button[data-tab="templates"]')
      await expect(templatesTab).toBeVisible()
      await templatesTab.click()

      // Verify the saved section template appears in list
      const templateItem = page.locator('div').filter({ hasText: templateName }).first()
      await expect(templateItem).toBeVisible({ timeout: 10000 })

      // Click "Chèn"
      const insertBtn = page.getByRole('button', { name: 'Chèn' }).first()
      await insertBtn.click()

      // Canvas should now have the newly inserted block alongside Heading B
      const canvasB = page.frameLocator('iframe')
      await expect(canvasB.locator('[data-puck-component]')).toHaveCount(2, { timeout: 10000 })
      await expect(canvasB.getByText(headingAText)).toBeVisible()

      // Save draft on Page B to create a version
      await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: /Đã lưu/ })).toBeVisible({
        timeout: 15000,
      })

      // -----------------------------------------------------------------------
      // Kịch bản 3: Header trang B -> "Lưu trang thành mẫu" -> Mở Modal Mẫu -> "Mẫu đã lưu" -> Áp dụng
      // -----------------------------------------------------------------------
      const savePageBtn = page.getByRole('button', { name: 'Lưu trang thành mẫu' })
      await expect(savePageBtn).toBeVisible()
      await savePageBtn.click()

      const savePageModal = page.getByRole('dialog', { name: 'Lưu trang thành mẫu' })
      await expect(savePageModal).toBeVisible()

      const pageTemplateName = `Mẫu trang B full ${randomUUID().slice(0, 6)}`
      await savePageModal.locator('#template-name-input').fill(pageTemplateName)
      await savePageModal.getByRole('button', { name: 'Lưu mẫu' }).click()

      await expect(
        page.getByRole('status').filter({ hasText: 'Đã lưu mẫu thành công' }),
      ).toBeVisible({ timeout: 10000 })

      // Open TemplateModal via "Dùng mẫu..." header button
      await page.getByRole('button', { name: /Dùng mẫu/ }).click()
      const templateModal = page.getByRole('dialog', { name: 'Chọn mẫu trang' })
      await expect(templateModal).toBeVisible()

      // Switch to "Mẫu đã lưu" tab
      await templateModal.getByRole('tab', { name: /Mẫu đã lưu/ }).click()

      // Verify page template is listed
      await expect(templateModal.getByRole('heading', { name: pageTemplateName })).toBeVisible()

      // Click "Áp dụng mẫu này" on the saved page template, then confirm inside the card (EB-16)
      await templateModal
        .getByRole('button', { name: /Áp dụng mẫu này/ })
        .first()
        .click()
      await templateModal.getByRole('button', { name: 'Thay toàn bộ trang', exact: true }).click()

      // Canvas should have received the applied template data
      await expect(canvasB.locator('[data-puck-component]')).toHaveCount(2, { timeout: 10000 })

      // Save draft again so we have multiple versions in history
      await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: /Đã lưu/ })).toBeVisible({
        timeout: 15000,
      })

      // -----------------------------------------------------------------------
      // Kịch bản 4: Mở Lịch sử phiên bản -> Thấy danh sách -> Bấm "Xem" -> Banner xuất hiện -> "Thoát"
      // -----------------------------------------------------------------------
      await page.getByRole('button', { name: /Lịch sử/ }).click()
      const historyModal = page.getByRole('dialog', { name: 'Lịch sử phiên bản' })
      await expect(historyModal).toBeVisible()

      // Check version list items have VN date format and badges
      const viewButtons = historyModal.getByRole('button', { name: 'Xem' })
      await expect(viewButtons.first()).toBeVisible({ timeout: 10000 })

      // Click "Xem" on the earliest version
      await viewButtons.last().click()

      // History modal closes, preview banner appears on canvas
      const previewBanner = page.locator('div[role="status"]').filter({ hasText: 'Thoát' })
      await expect(previewBanner).toBeVisible({ timeout: 5000 })

      // QA EB-08c: while previewing, saving is blocked (the old version must not overwrite the draft).
      await expect(page.getByRole('button', { name: 'Lưu nháp', exact: true })).toBeDisabled()
      await expect(page.getByRole('button', { name: 'Xuất bản', exact: true })).toBeDisabled()

      // Click "Thoát" on preview banner
      const exitBtn = previewBanner.getByRole('button', { name: 'Thoát' })
      await expect(exitBtn).toBeVisible()
      await exitBtn.click()

      // Banner should disappear and canvas reverts
      await expect(previewBanner).toHaveCount(0)

      // -----------------------------------------------------------------------
      // Kịch bản 5: User chưa đăng nhập gọi POST/DELETE /api/blockTemplates -> 401/403
      // -----------------------------------------------------------------------
      const unauthContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })

      const unauthPost = await unauthContext.request.post('/api/blockTemplates', {
        data: {
          name: 'Hacker Template',
          kind: 'section',
          puckData: { content: [], root: {} },
        },
      })
      expect([401, 403]).toContain(unauthPost.status())

      const unauthDelete = await unauthContext.request.delete('/api/blockTemplates/1')
      expect([401, 403]).toContain(unauthDelete.status())

      await unauthContext.close()
    } finally {
      // Cleanup created resources
      if (pageAId) await page.request.delete(`/api/pages/${pageAId}`).catch(() => {})
      if (pageBId) await page.request.delete(`/api/pages/${pageBId}`).catch(() => {})
      if (userId) await page.request.delete(`/api/users/${userId}`).catch(() => {})
    }
  })
})
