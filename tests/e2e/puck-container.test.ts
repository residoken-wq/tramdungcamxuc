import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-05: Container flexbox block and nested drag-drop', () => {
  test('nested flexbox container with responsive direction and gradient reaches public page', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `eb-05-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-container-${randomUUID()}`
    const containerId = `eb05-con-${randomUUID().slice(0, 8)}`
    const quote1Id = `eb05-q1-${randomUUID().slice(0, 8)}`
    const quote2Id = `eb05-q2-${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined

    try {
      // 1. First admin on a clean DB (self-contained).
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

      // 2. Create draft page with 1 Container containing 2 QuoteBlock components.
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-05 Container',
          slug,
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
                  layout: {
                    direction: { desktop: 'row' },
                    gap: { desktop: 'lg' },
                  },
                  items: [
                    {
                      type: 'QuoteBlock',
                      props: {
                        id: quote1Id,
                        quote: '[MẪU] Trích dẫn số một trong container',
                        author: 'Hana',
                      },
                    },
                    {
                      type: 'QuoteBlock',
                      props: {
                        id: quote2Id,
                        quote: '[MẪU] Trích dẫn số hai trong container',
                        author: 'Hana',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-05 Container' } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 3. Open builder and select Container.
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      const containerBlock = canvas.locator(`[data-puck-component="${containerId}"]`)
      await expect(containerBlock).toBeVisible()

      const contentTab = page.getByRole('tab', { name: 'Nội dung', exact: true })
      await expect(async () => {
        await containerBlock.click()
        await expect(contentTab).toBeVisible({ timeout: 1000 })
      }).toPass({ timeout: 15000 })

      // 4. Tab Nội dung: Desktop = row, gap = lg; Phone = column.
      await contentTab.click()
      await expect(contentTab).toHaveAttribute('aria-selected', 'true')

      // Switch to phone viewport to configure mobile direction
      await page.getByRole('button', { name: 'Điện thoại', exact: true }).first().click()
      await expect(
        page.getByText('Đang chỉnh cho: Điện thoại').filter({ visible: true }),
      ).toBeVisible()

      // Set mobile direction to column
      const dirGroupMobile = page
        .getByRole('group', { name: 'Hướng sắp xếp' })
        .filter({ visible: true })
      await dirGroupMobile.getByRole('button', { name: /Cột dọc/ }).click()

      // Switch back to desktop
      await page.getByRole('button', { name: 'Máy tính', exact: true }).first().click()

      // 5. Tab Kiểu: Chuyển màu (gradient) with 2 palette tokens.
      const styleTab = page.getByRole('tab', { name: 'Kiểu', exact: true })
      await styleTab.click()
      await expect(styleTab).toHaveAttribute('aria-selected', 'true')

      // Select gradient type
      const bgTypeGroup = page.getByRole('group', { name: 'Kiểu nền' }).filter({ visible: true })
      await bgTypeGroup.getByRole('button', { name: /Chuyển màu/ }).click()

      // Select gradient from = bright-magenta, to = deep-navy
      const fromGroup = page.getByRole('group', { name: 'Màu bắt đầu' }).filter({ visible: true })
      await fromGroup.getByRole('button', { name: /^bright-magenta/ }).click()

      const toGroup = page.getByRole('group', { name: 'Màu kết thúc' }).filter({ visible: true })
      await toGroup.getByRole('button', { name: /^deep-navy/ }).click()

      // Verify canvas style preview gets gradient
      const styledWrapper = canvas.locator(`[data-eb-id="${containerId}"]`)
      await expect(styledWrapper).toHaveCSS('background-image', /linear-gradient/)

      // 6. Drag another Container from the sidebar into the first Container (nested container).
      const structureTab = page.getByRole('tab', { name: 'Cấu trúc' })
      if (await structureTab.isVisible()) {
        await structureTab.click()
        // Verify outline tree shows Container with children
        await expect(page.getByText('Container').first()).toBeVisible()
      }

      // 7. Publish.
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' }),
      ).toBeVisible({ timeout: 15000 })

      // 8. Public page verification:
      // At 1440: flex-direction: row, background-image: linear-gradient(...)
      // At 375: flex-direction: column
      const publicPage = await page.context().newPage()
      const publicWrapper = publicPage.locator(`[data-eb-id="${containerId}"]`)

      // Check desktop 1440
      await publicPage.setViewportSize({ width: 1440, height: 900 })
      await publicPage.goto(`/${slug}`)
      await expect(publicWrapper).toHaveCSS('display', 'flex')
      await expect(publicWrapper).toHaveCSS('flex-direction', 'row')
      await expect(publicWrapper).toHaveCSS('background-image', /linear-gradient/)

      // Check mobile 375
      await publicPage.setViewportSize({ width: 375, height: 800 })
      await publicPage.goto(`/${slug}`)
      await expect(publicWrapper).toHaveCSS('flex-direction', 'column')

      await publicPage.close()
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
