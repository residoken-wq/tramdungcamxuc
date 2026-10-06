import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from '@playwright/test'

test.describe('T1-01: Puck Columns & QuoteBlock publication across viewports', () => {
  test('drags Columns, drops QuoteBlock into column, publishes, and verifies on public page at 375 and 1440', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `t1-01-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-blocks-${randomUUID()}`
    const testQuote = `HÃY LẮNG NGHE CẢM XÚC CỦA BẠN - ${randomUUID()}`
    const testAuthor = 'Hana Lương E2E'

    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      // 1. Authenticate or create first user
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

      // 2. Create blank draft page via REST
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E Puck Blocks',
          slug,
          _status: 'draft',
          puckData: { content: [], root: {} },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id
      expect(pageId).toEqual(expect.any(Number))

      // 3. Open Puck editor
      await page.goto(`/builder/${pageId}`, { waitUntil: 'networkidle' })
      const canvas = page.frameLocator('iframe')
      const dropzone = canvas.locator('[data-puck-dropzone]').first()
      await expect(dropzone).toBeVisible()

      // 4. Drag Columns block into root canvas
      const columnsDrawerItem = page.getByRole('button', {
        name: 'Bố cục Cột (2 hoặc 3 Cột)',
        exact: true,
      })
      const colSource = await columnsDrawerItem.boundingBox()
      const rootTarget = await dropzone.boundingBox()
      if (!colSource || !rootTarget)
        throw new Error('Columns drawer item or root dropzone not visible.')

      await page.mouse.move(colSource.x + colSource.width / 2, colSource.y + colSource.height / 2)
      await page.mouse.down()
      await page.mouse.move(
        colSource.x + colSource.width / 2 + 12,
        colSource.y + colSource.height / 2,
        {
          steps: 5,
        },
      )
      await page.mouse.move(rootTarget.x + rootTarget.width / 2, rootTarget.y + 60, { steps: 30 })
      await page.mouse.up()

      // Verify Columns is placed
      await expect(canvas.locator('[data-puck-component]')).toHaveCount(1)

      // 5. Drag QuoteBlock into the first column slot
      const quoteDrawerItem = page.getByRole('button', {
        name: 'Khối Trích dẫn cảm xúc (Quote Block)',
        exact: true,
      })
      const quoteSource = await quoteDrawerItem.boundingBox()
      const col1Target = await canvas.locator('[data-puck-dropzone]').nth(1).boundingBox()
      if (!quoteSource || !col1Target)
        throw new Error('QuoteBlock drawer item or column slot dropzone not visible.')

      await page.mouse.move(
        quoteSource.x + quoteSource.width / 2,
        quoteSource.y + quoteSource.height / 2,
      )
      await page.mouse.down()
      await page.mouse.move(
        quoteSource.x + quoteSource.width / 2 + 12,
        quoteSource.y + quoteSource.height / 2,
        {
          steps: 5,
        },
      )
      await page.mouse.move(col1Target.x + col1Target.width / 2, col1Target.y + 30, { steps: 30 })
      await page.mouse.up()

      // 6. Select QuoteBlock in canvas to open its field editor
      const quoteComponentInCanvas = canvas.locator('blockquote').first()
      await expect(quoteComponentInCanvas).toBeVisible()
      await quoteComponentInCanvas.click()

      // 7. Update quote text and author
      const quoteInput = page.getByRole('textbox', {
        name: 'Câu trích dẫn (Playfair Display Italic)',
        exact: true,
      })
      await quoteInput.fill(testQuote)

      const citeInput = page.getByRole('textbox', {
        name: 'Tác giả / Người nói (Tùy chọn)',
        exact: true,
      })
      await citeInput.fill(testAuthor)

      await expect(canvas.locator('blockquote')).toContainText(testQuote)

      // 8. Publish the page
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByText(/Đã xuất bản thành công/)).toBeVisible()

      // 9. Verify on public page at desktop viewport (1440px)
      await publicPage.setViewportSize({ width: 1440, height: 900 })
      await publicPage.goto(`/${slug}`)
      await expect(publicPage.locator('blockquote')).toContainText(testQuote)
      await expect(publicPage.getByText(testAuthor)).toBeVisible()

      // 10. Verify on public page at mobile viewport (375px)
      await publicPage.setViewportSize({ width: 375, height: 667 })
      await publicPage.reload()
      await expect(publicPage.locator('blockquote')).toContainText(testQuote)
      await expect(publicPage.getByText(testAuthor)).toBeVisible()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary page must be deleted.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'Temporary user must be deleted.').toBe(true)
        }
      }
    }
  })
})
