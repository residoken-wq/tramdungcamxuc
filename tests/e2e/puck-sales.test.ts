import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from '@playwright/test'

test.describe('T1-02a: Puck Sales Blocks – ProductGrid publication & price reactivity', () => {
  test('creates product via REST, drops ProductGrid selecting it, publishes, updates price in admin, verifies updated price on public page, and ensures puckData contains no product name or price', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `t1-02a-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-sales-${randomUUID()}`
    const productSlug = `e2e-product-${randomUUID()}`
    const productName = `Khóa học EQ E2E - ${randomUUID()}`
    const initialPrice = 250000
    const initialSalePrice = 180000
    const updatedSalePrice = 150000

    let userId: number | undefined
    let pageId: number | undefined
    let productId: number | undefined

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

      // 2. Create published product via REST
      const productRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: productSlug,
          web: 'site',
          type: 'digital_tool',
          price: initialPrice,
          salePrice: initialSalePrice,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(productRes.ok()).toBe(true)
      const productDoc = await productRes.json()
      productId = productDoc.doc?.id || productDoc.id
      expect(productId).toEqual(expect.any(Number))

      // 3. Create blank draft page with ProductGrid block referencing productId
      const createdPage = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E Puck Sales Page',
          slug: pageSlug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'ProductGrid',
                props: {
                  id: 'product-grid-test',
                  mode: 'manual',
                  manualProducts: [{ productId: String(productId) }],
                  columns: 3,
                },
              },
            ],
            root: {},
          },
        },
      })
      expect(createdPage.ok()).toBe(true)
      pageId = (await createdPage.json()).doc.id
      expect(pageId).toEqual(expect.any(Number))

      // 4. Open Puck editor to verify rendering and publish
      await page.goto(`/builder/${pageId}`, { waitUntil: 'networkidle' })
      const canvas = page.frameLocator('iframe')

      // Verify product card is displayed in canvas editor preview
      await expect(canvas.getByText(productName)).toBeVisible({ timeout: 15000 })

      // 5. Publish the page
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByText(/Đã xuất bản thành công/)).toBeVisible()

      // 6. Verify initial price on public page
      await publicPage.setViewportSize({ width: 1440, height: 900 })
      await publicPage.goto(`/${pageSlug}`)
      await expect(publicPage.getByText(productName)).toBeVisible()
      // Initial sale price 180.000 đ
      await expect(publicPage.getByText('180.000').filter({ visible: true }).first()).toBeVisible()

      // 7. Update product price in admin via REST without touching the page
      const updateProductRes = await page.request.patch(`/api/products/${productId}`, {
        data: {
          salePrice: updatedSalePrice,
        },
      })
      expect(updateProductRes.ok()).toBe(true)

      // 8. Reload public page -> should reflect the updated price immediately
      await publicPage.reload()
      await expect(publicPage.getByText(productName)).toBeVisible()
      // New sale price 150.000 đ should appear
      await expect(publicPage.getByText('150.000').filter({ visible: true }).first()).toBeVisible()

      // 9. Inspect puckData stored in DB via REST -> MUST NOT contain product name or price
      const getPageRes = await page.request.get(`/api/pages/${pageId}?depth=0`)
      expect(getPageRes.ok()).toBe(true)
      const pageDataInDb = await getPageRes.json()
      const rawPuckDataStr = JSON.stringify(pageDataInDb.doc?.puckData || pageDataInDb.puckData)

      // Anti-data leak verification:
      expect(rawPuckDataStr).not.toContain(productName)
      expect(rawPuckDataStr).not.toContain(String(initialPrice))
      expect(rawPuckDataStr).not.toContain(String(initialSalePrice))
      expect(rawPuckDataStr).not.toContain(String(updatedSalePrice))
      // It should only store the product ID reference
      expect(rawPuckDataStr).toContain(String(productId))
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary page must be deleted.').toBe(true)
        }
      } finally {
        try {
          if (productId) {
            const deleted = await page.request.delete(`/api/products/${productId}`)
            expect(deleted.ok(), 'Temporary product must be deleted.').toBe(true)
          }
        } finally {
          if (userId) {
            const deleted = await page.request.delete(`/api/users/${userId}`)
            expect(deleted.ok(), 'Temporary user must be deleted.').toBe(true)
          }
        }
      }
    }
  })
})
