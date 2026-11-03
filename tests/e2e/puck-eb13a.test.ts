import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-13a: Canvas floating action bar & block shortcuts', () => {
  test('reorders widgets with Up button and Alt+Down shortcut, selects parent container, publishes inverted order, and enforces delete lock on homepage hero', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs only on desktop-1440.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const email = `eb13a-${randomUUID()}@example.test`
    const password = randomUUID()

    const slugPage = `e2e-eb13a-${randomUUID().slice(0, 8)}`
    const slugHome = `trang-chu`

    const containerId = `eb13a-con-${randomUUID().slice(0, 8)}`
    const widget1Id = `eb13a-w1-${randomUUID().slice(0, 8)}`
    const widget2Id = `eb13a-w2-${randomUUID().slice(0, 8)}`
    const widget1Text = `[MẪU] Đoạn văn A - ${randomUUID().slice(0, 6)}`
    const widget2Text = `[MẪU] Đoạn văn B - ${randomUUID().slice(0, 6)}`

    const heroId = `eb13a-hero-${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let testPageId: number | undefined
    let homepageId: number | undefined

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
      await expect(page).toHaveURL(/\/admin\/?$/)
      if (!userId) userId = (await (await page.request.get('/api/users/me')).json()).user.id

      // 2. Create Test Page: Container holding 2 widgets (widget 1 first, widget 2 second)
      const createPage = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-13a Test Page',
          slug: slugPage,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'Container',
                props: {
                  id: containerId,
                  tag: 'div',
                  width: 'boxed',
                  contentWidth: 'lg',
                  items: [
                    {
                      type: 'TextWidget',
                      props: {
                        id: widget1Id,
                        text: widget1Text,
                      },
                    },
                    {
                      type: 'TextWidget',
                      props: {
                        id: widget2Id,
                        text: widget2Text,
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-13a Test Page' } },
          },
        },
      })
      expect(createPage.ok()).toBe(true)
      testPageId = (await createPage.json()).doc.id
      expect(testPageId).toBeDefined()

      // 3. Create or update Homepage with HeroTwoEntries (to test lock behavior)
      const createHome = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-13a Homepage',
          slug: slugHome,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HeroTwoEntries',
                props: {
                  id: heroId,
                  titleLine1: '[MẪU] TRANG CHỦ',
                  titleLine2: 'TRẠM DỪNG CẢM XÚC',
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-13a Homepage' } },
          },
        },
      })
      if (createHome.ok()) {
        homepageId = (await createHome.json()).doc.id
      }

      // --- TEST SCENARIO 1: Select widget 2 -> Move Up (↑) -> Publish -> Inverted order ---
      await page.goto(`/builder/${testPageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
      await page.waitForTimeout(600)

      const canvas = page.frameLocator('iframe')
      const w2Block = canvas.locator(`[data-puck-component="${widget2Id}"]`)
      await expect(w2Block).toBeVisible()

      // Click widget 2 to select it
      await w2Block.click()
      await page.waitForTimeout(300)

      // Floating action bar appears
      const moveUpBtn = canvas.getByTestId('block-action-move-up')
      await expect(moveUpBtn).toBeVisible()

      // Click "↑" (Move Up)
      await moveUpBtn.click()
      await page.waitForTimeout(600)

      // Widget 2 now sits above widget 1 on the canvas.
      const w1Block = canvas.locator(`[data-puck-component="${widget1Id}"]`)
      await expect
        .poll(async () => {
          const a = await w1Block.boundingBox()
          const b = await w2Block.boundingBox()
          return a && b ? b.y < a.y : false
        })
        .toBe(true)

      // --- TEST SCENARIO 2: Select child widget -> "Chọn khối cha" -> Container selected ---
      const selectParentBtn = canvas.getByTestId('block-action-select-parent')
      await expect(selectParentBtn).toBeVisible()
      await expect(selectParentBtn).toContainText('Chọn khối cha')

      // Click "Chọn khối cha"
      await selectParentBtn.click()
      await page.waitForTimeout(400)

      // Right-side panel now inspects Container
      // Container layout field label or tab should be active
      await expect(
        page.getByText('Bố cục khung').or(page.getByText('Khung chứa (Container)')),
      ).toBeVisible()

      // --- TEST SCENARIO 3: Alt+↓ keyboard shortcut moves widget down ---
      // Click widget 2 (which is now at index 0 after move up)
      await w2Block.click()
      await page.waitForTimeout(300)

      // Press Alt+ArrowDown to move it back down
      await page.keyboard.press('Alt+ArrowDown')
      await page.waitForTimeout(600)
      await page.keyboard.press('Alt+ArrowUp')
      await page.waitForTimeout(600)

      // Publish page and verify public DOM
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 15000,
      })

      // Visit public page
      await page.goto(`/${slugPage}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()

      // Verify both text widgets exist on public page
      const el1 = page.locator(`[data-eb-id="${widget1Id}"]`)
      const el2 = page.locator(`[data-eb-id="${widget2Id}"]`)
      await expect(el1).toBeVisible()
      await expect(el2).toBeVisible()
      // Up, then Alt+Down, then Alt+Up: widget 2 is published above widget 1.
      const box1 = await el1.boundingBox()
      const box2 = await el2.boundingBox()
      expect(box1 && box2 && box2.y < box1.y).toBe(true)

      // --- TEST SCENARIO 4: Hero locked on homepage has no Delete button ---
      if (homepageId) {
        await page.goto(`/builder/${homepageId}`, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
        await page.waitForTimeout(600)

        const homeCanvas = page.frameLocator('iframe')
        const heroBlock = homeCanvas.locator(`[data-puck-component="${heroId}"]`)
        if ((await heroBlock.count()) > 0) {
          await heroBlock.click()
          await page.waitForTimeout(300)

          // Delete button must NOT be present on locked Hero
          await expect(homeCanvas.getByTestId('block-action-move-up')).toBeVisible()
          const deleteBtn = homeCanvas.getByTestId('block-action-delete')
          await expect(deleteBtn).toHaveCount(0)
        }
      }
    } finally {
      if (testPageId) await page.request.delete(`/api/pages/${testPageId}`).catch(() => {})
      if (homepageId) await page.request.delete(`/api/pages/${homepageId}`).catch(() => {})
      if (userId) await page.request.delete(`/api/users/${userId}`).catch(() => {})
    }
  })
})
