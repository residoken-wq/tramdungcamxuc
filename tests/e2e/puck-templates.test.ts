import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

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
    let homepageIsOurs = false

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
      const heroBlock = canvas.locator('[data-puck-component="campaign-hero"]').first()
      await expect(heroBlock).toBeVisible({ timeout: 15000 })

      // Verify template components are present in canvas
      await expect(canvas.locator('[data-puck-component="campaign-header"]').first()).toBeVisible()
      await expect(
        canvas.locator('[data-puck-component="campaign-lead-form"]').first(),
      ).toBeVisible()

      // 4. Edit the section title (mandatory) and publish.
      const sectionHeader = canvas.locator('[data-puck-component="campaign-header"]').first()
      await sectionHeader.click()
      const titleField = page.getByRole('textbox', {
        name: 'Tiêu đề dòng 1',
        exact: true,
      })
      await expect(titleField).toBeVisible()
      await titleField.fill(updatedTitle)
      await expect(canvas.locator('[data-puck-component="campaign-header"]')).toContainText(
        updatedTitle.toUpperCase(),
        { ignoreCase: true },
      )
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({
        timeout: 15000,
      })

      // 5. Public page shows the new title (no networkidle: the template has a form with Turnstile).
      await publicPage.goto(`/${pageSlug}`, { waitUntil: 'domcontentloaded' })
      await expect(publicPage.locator('body')).toContainText(updatedTitle, {
        ignoreCase: true,
        timeout: 15000,
      })

      // 6. History: restore the version before the edit → the template title comes back.
      await page.getByRole('button', { name: 'Lịch sử', exact: true }).click()
      const historyModal = page.getByRole('dialog', { name: 'Lịch sử phiên bản' })
      await expect(historyModal).toBeVisible({ timeout: 10000 })
      const restoreButtons = historyModal.getByRole('button', { name: 'Khôi phục' })
      await expect(restoreButtons.first()).toBeVisible()
      page.once('dialog', (dialog) => dialog.accept())
      // The oldest version is the page as created from the template.
      await restoreButtons.last().click()
      await expect(
        page
          .getByText(/Đã khôi phục phiên bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })
      await expect(canvas.locator('[data-puck-component="campaign-header"]')).toContainText(
        'ĐỒNG HÀNH CHUYỂN HÓA',
        { ignoreCase: true, timeout: 15000 },
      )

      // 7. Locked Hero on the homepage (slug '/'). Data-puck-component holds the block id.
      // Reuse an existing homepage, or create one on an empty CI database.
      const existingHome = await (
        await page.request.get('/api/pages?where[slug][equals]=/&depth=0&draft=true')
      ).json()
      let homeHeroId: string
      if (existingHome.docs.length > 0) {
        homepageIsOurs = false
        homepageId = existingHome.docs[0].id
        const heroItem = (existingHome.docs[0].puckData?.content || []).find(
          (c: { type: string }) => c.type === 'HeroTwoEntries',
        )
        expect(heroItem, 'Existing homepage must contain HeroTwoEntries').toBeTruthy()
        homeHeroId = heroItem.props.id
      } else {
        homeHeroId = 'hero-locked-e2e'
        const homeRes = await page.request.post('/api/pages', {
          data: {
            title: 'Trang Chủ Kiểm Thử E2E',
            slug: '/',
            _status: 'draft',
            puckData: {
              content: [
                {
                  type: 'HeroTwoEntries',
                  props: {
                    id: homeHeroId,
                    titleLine1: 'TIÊU ĐỀ KHÓA',
                    titleLine2: 'KHÔNG THỂ XÓA',
                  },
                },
              ],
              root: { props: { title: 'Trang Chủ' } },
            },
          },
        })
        expect(homeRes.status(), await homeRes.text()).toBe(201)
        homepageIsOurs = true
        homepageId = (await homeRes.json()).doc.id
      }

      // Server: saving '/' without the Hero is rejected.
      const stripped = await page.request.patch(`/api/pages/${homepageId}?draft=true`, {
        data: { puckData: { content: [], root: { props: {} } } },
      })
      expect(stripped.status()).toBe(400)

      // Editor: the Hero cannot be deleted. Leaving the previous editor may raise the
      // 'unsaved changes' prompt – accept it.
      page.on('dialog', (dialog) => dialog.accept().catch(() => {}))
      await page.goto(`/builder/${homepageId}`, { waitUntil: 'load' })
      const lockedHero = page
        .frameLocator('iframe')
        .locator(`[data-puck-component="${homeHeroId}"]`)
        .first()
      await expect(lockedHero).toBeVisible({ timeout: 15000 })
      // Measured separately: the block is static; Playwright still reports it unstable inside the
      // editor iframe after the previous steps. Selecting it is all we need here.
      await lockedHero.click({ force: true })
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
      if (homepageId && homepageIsOurs) {
        await page.request.delete(`/api/pages/${homepageId}`)
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`)
      }
      await publicContext.close()
    }
  })
})
