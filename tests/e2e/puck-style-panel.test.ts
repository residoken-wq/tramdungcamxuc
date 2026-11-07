import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-04: Style / Advanced tabs', () => {
  test('palette background + mobile-only padding + hide on tablet reach the public page', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `eb-04-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-style-${randomUUID()}`
    const blockId = `eb04-hdr-${randomUUID().slice(0, 8)}`

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

      // 2. Draft page with one section header.
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-04',
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'SectionHeader',
                props: { id: blockId, titleLine1: '[MẪU] Kiểu EB-04', titleLine2: '[MẪU] Dòng 2' },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-04' } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 3. Open the builder and select the block (Puck ignores clicks until the canvas is ready).
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      const block = canvas.locator(`[data-puck-component="${blockId}"]`)
      await expect(block).toBeVisible()
      const styleTab = page.getByRole('tab', { name: 'Kiểu', exact: true })
      await expect(async () => {
        await block.click()
        await expect(styleTab).toBeVisible({ timeout: 1000 })
      }).toPass({ timeout: 15000 })

      // 4. Style tab: palette background (locked palette by default).
      await styleTab.click()
      await expect(page.getByRole('tab', { name: 'Kiểu', exact: true })).toHaveAttribute(
        'aria-selected',
        'true',
      )
      const bgGroup = page.getByRole('group', { name: 'Màu nền', exact: true })
      await bgGroup.getByRole('button', { name: /^mint-haze/ }).click()
      // Brand locks are closed by default: no free colour picker.
      await expect(page.getByLabel(/Màu tự do/)).toHaveCount(0)
      const styledWrapper = canvas.locator(`[data-eb-id="${blockId}"]`)
      await expect(styledWrapper).toHaveCSS('background-color', 'rgb(217, 241, 234)')

      // 5. Advanced tab, phone: top padding XL; hide on tablet.
      await page.getByRole('tab', { name: 'Nâng cao', exact: true }).click()
      await page.getByRole('button', { name: 'Điện thoại', exact: true }).first().click()
      // Puck also mounts the fields in a hidden plugin tab: only use the visible copy.
      await expect(
        page.getByText('Đang chỉnh cho: Điện thoại').filter({ visible: true }),
      ).toBeVisible()
      await page
        .getByLabel('Trên', { exact: true })
        .filter({ visible: true })
        .first()
        .selectOption('xl')
      await page.getByRole('checkbox', { name: 'Máy tính bảng', exact: true }).check()

      // 6. Publish.
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' }),
      ).toBeVisible({ timeout: 15000 })

      // 7. Public page: padding only on phones, hidden on tablets, background everywhere.
      const publicPage = await page.context().newPage()
      const wrapper = publicPage.locator(`[data-eb-id="${blockId}"]`)
      for (const [width, padding, display] of [
        [375, '64px', 'block'],
        [800, '0px', 'none'],
        [1440, '0px', 'block'],
      ] as const) {
        await publicPage.setViewportSize({ width, height: 900 })
        await publicPage.goto(`/${slug}`)
        await expect(wrapper).toHaveCSS('display', display)
        // PK-24: padding-top được đặt trực tiếp lên phần tử con gốc (> *) thay vì lớp bọc
        if (display !== 'none' && width === 375) {
          await expect(wrapper.locator('> *')).toHaveCSS('padding-top', padding)
        }
        await expect(wrapper).toHaveCSS('background-color', 'rgb(217, 241, 234)')
      }
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
