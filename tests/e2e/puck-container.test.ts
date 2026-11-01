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

      // 3. Open the builder (Puck ignores input until the canvas is ready) and select the Container.
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
      const quote1 = canvas.locator(`[data-puck-component="${quote1Id}"]`)
      await expect(quote1).toBeVisible()

      // 4. Drag a second Container from the block library into the first one (nested).
      await page.getByPlaceholder(/Tìm khối/i).fill('container')
      const containerItem = page.getByRole('button', {
        name: 'Container (Hộp / Khung chứa)',
        exact: true,
      })
      await expect(containerItem).toBeVisible()
      const slot = canvas.locator(`.eb-c-${containerId}`)
      const source = await containerItem.boundingBox()
      const target = await slot.boundingBox()
      if (!source || !target) throw new Error('Container library item or slot not visible.')
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
      await page.mouse.down()
      await page.mouse.move(source.x + source.width / 2 + 15, source.y + source.height / 2, {
        steps: 5,
      })
      // Right edge of the row: after the two quotes, inside the slot.
      await page.mouse.move(target.x + target.width - 12, target.y + target.height / 2, {
        steps: 30,
      })
      await page.mouse.up()
      await expect(slot.locator(':scope > [data-puck-component]')).toHaveCount(3)
      await expect(slot.locator('[data-eb-id]')).toHaveCount(1)

      // 5. Select the outer Container in the structure tree, then the Content tab.
      await page.getByRole('tab', { name: 'Cấu trúc', exact: true }).click()
      const outline = page
        .getByRole('button', { name: 'Container (Hộp / Khung chứa)', exact: true })
        .filter({ visible: true })
      // Outer and nested container both appear in the structure tree.
      await expect(outline.nth(1)).toBeVisible()
      await outline.first().click()
      const contentTab = page.getByRole('tab', { name: 'Nội dung', exact: true })
      await expect(contentTab).toBeVisible()
      await contentTab.click()

      // Phone: column; desktop keeps the row from the stored data.
      await page.getByRole('button', { name: 'Điện thoại', exact: true }).first().click()
      await expect(
        page.getByText('Đang chỉnh cho: Điện thoại').filter({ visible: true }),
      ).toBeVisible()
      await page
        .getByRole('group', { name: 'Hướng sắp xếp', exact: true })
        .getByRole('button', { name: /^Cột dọc/ })
        .click()
      await page.getByRole('button', { name: 'Máy tính', exact: true }).first().click()

      // 6. Style tab: gradient with two palette tokens (colours are locked by default).
      const styleTab = page.getByRole('tab', { name: 'Kiểu', exact: true })
      await styleTab.click()
      await page
        .getByRole('group', { name: 'Kiểu nền', exact: true })
        .getByRole('button', { name: /Chuyển màu/ })
        .click()
      await page
        .getByRole('group', { name: 'Màu bắt đầu', exact: true })
        .getByRole('button', { name: /^soft-pink/ })
        .click()
      await page
        .getByRole('group', { name: 'Màu kết thúc', exact: true })
        .getByRole('button', { name: /^lavender-mist/ })
        .click()
      await expect(page.getByLabel(/Màu tự do/)).toHaveCount(0)
      await expect(canvas.locator(`[data-eb-id="${containerId}"]`)).toHaveCSS(
        'background-image',
        /linear-gradient/,
      )

      // 7. Publish.
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' }),
      ).toBeVisible({ timeout: 15000 })

      // 8. Public page: quotes side by side at 1440, stacked at 375; gradient; nested container.
      const publicPage = await page.context().newPage()
      const outer = publicPage.locator(`[data-eb-id="${containerId}"]`)
      const items = publicPage.locator(`.eb-c-${containerId}`)
      const q1 = publicPage.getByText('[MẪU] Trích dẫn số một trong container')
      const q2 = publicPage.getByText('[MẪU] Trích dẫn số hai trong container')

      await publicPage.setViewportSize({ width: 1440, height: 900 })
      await publicPage.goto(`/${slug}`)
      await expect(items).toHaveCSS('display', 'flex')
      await expect(items).toHaveCSS('flex-direction', 'row')
      await expect(outer).toHaveCSS('background-image', /linear-gradient/)
      await expect(outer.locator('[data-eb-id]')).toHaveCount(1)
      const [d1, d2] = [await q1.boundingBox(), await q2.boundingBox()]
      expect(d1 && d2 && d2.x > d1.x + d1.width - 1).toBe(true)

      await publicPage.setViewportSize({ width: 375, height: 800 })
      await publicPage.goto(`/${slug}`)
      await expect(items).toHaveCSS('flex-direction', 'column')
      const [m1, m2] = [await q1.boundingBox(), await q2.boundingBox()]
      expect(m1 && m2 && m2.y > m1.y + m1.height - 1).toBe(true)

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
