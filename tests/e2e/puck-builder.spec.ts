import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('T0-09: Puck publication lifecycle', () => {
  test('(a) redirects anonymous visitors to login with the editor return URL', async ({ page }) => {
    await page.goto('/builder/999999')
    await expect(page).toHaveURL(/\/admin\/login\?redirect=%2Fbuilder%2F999999/)
    await expect(page.locator('form')).toBeVisible()
  })

  test('(b)+(c) drags a Hero, publishes it, and keeps subsequent drafts private', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)
    const email = `t0-09-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-builder-${randomUUID()}`
    const publishedTitle = 'HÀNH TRÌNH TỰ THẤU HIỂU'
    const draftTitle = 'BẢN NHÁP CHƯA XUẤT BẢN'
    let userId: number | undefined
    let pageId: number | undefined
    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
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
      // Wait for hydration before submitting the first-user form.
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

      // REST creates only an empty draft. All block insertion and editing happens in the UI.
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E Puck',
          slug,
          _status: 'draft',
          puckData: { content: [], root: {} },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id
      expect(pageId).toEqual(expect.any(Number))
      await page.goto(`/builder/${pageId}`, { waitUntil: 'networkidle' })
      const canvas = page.frameLocator('iframe')
      const dropzone = canvas.locator('[data-puck-dropzone]').first()
      await expect(dropzone).toBeVisible()
      await expect(canvas.locator('[data-puck-component]')).toHaveCount(0)
      const hero = page.getByRole('button', {
        name: 'Hero 2 Lối vào (Cá nhân & Tổ chức)',
        exact: true,
      })
      const source = await hero.boundingBox()
      const target = await dropzone.boundingBox()
      if (!source || !target) throw new Error('Hero drawer or canvas has no visible bounds.')
      await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2)
      await page.mouse.down()
      await page.mouse.move(source.x + source.width / 2 + 12, source.y + source.height / 2, {
        steps: 5,
      })
      await page.mouse.move(target.x + target.width / 2, target.y + 60, { steps: 30 })
      await page.mouse.up()
      await expect(canvas.getByRole('heading', { level: 1 })).toContainText('[MẪU] DÒNG TIÊU ĐỀ 1')
      await canvas.locator('[data-puck-component]').click()
      const title = page.getByRole('textbox', {
        name: 'Tiêu đề dòng 1 (Xanh thẫm / Deep Navy)',
        exact: true,
      })
      await title.fill(publishedTitle)
      await expect(canvas.getByRole('heading', { level: 1 })).toContainText(publishedTitle)
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByText(/Đã xuất bản thành công/)).toBeVisible()
      await publicPage.goto(`/${slug}`)
      await expect(publicPage.getByRole('heading', { level: 1 })).toContainText(publishedTitle)

      await title.fill(draftTitle)
      await expect(canvas.getByRole('heading', { level: 1 })).toContainText(draftTitle)
      await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click()
      await expect(page.getByText(/Đã lưu bản nháp/)).toBeVisible()
      await publicPage.reload()
      await expect(publicPage.getByRole('heading', { level: 1 })).toContainText(publishedTitle)
      await expect(publicPage.getByText(draftTitle)).toHaveCount(0)

      await page.reload({ waitUntil: 'networkidle' })
      await expect(canvas.getByRole('heading', { level: 1 })).toContainText(draftTitle)
      await canvas.locator('[data-puck-component]').click()
      await expect(title).toHaveValue(draftTitle)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()
      // Always attempt user cleanup even if page cleanup fails.
      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'The temporary page must be removed.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'The temporary account must be removed.').toBe(true)
        }
      }
    }
  })
})
