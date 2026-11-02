import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('PK-14: One-click add child card & empty-slot hint', () => {
  test('empty slot hint, one-click add child cards, undo, and clean serialization without _addChild', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `pk-14-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-pk14-${randomUUID()}`
    const blockId = `pk14-pkg-${randomUUID().slice(0, 8)}`

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

      // 2. Draft page with one empty PackageCards block.
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E PK-14',
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'PackageCards',
                props: {
                  id: blockId,
                  version: 2,
                  seriesLabel: '[MẪU] Growth Mirror',
                  titleLine1: '[MẪU] CÁC GÓI',
                  titleLine2: '[MẪU] ĐỒNG HÀNH',
                },
              },
            ],
            zones: {
              [`${blockId}:cards`]: [],
            },
            root: { props: { title: '[MẪU] E2E PK-14' } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 3. Open the builder.
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      const block = canvas.locator(`[data-puck-component="${blockId}"]`)
      await expect(block).toBeVisible()

      // 4. Verify empty slot hint is visible on canvas.
      const hint = canvas.locator(`[data-empty-slot-hint="${blockId}:cards"]`)
      await expect(hint).toBeVisible({ timeout: 15000 })
      await expect(hint).toContainText('Chưa có Thẻ gói')

      // 5. Select the block.
      await expect(async () => {
        await block.click()
        const addBtn = page.getByRole('button', { name: '+ Thêm Thẻ gói' })
        await expect(addBtn).toBeVisible({ timeout: 1500 })
      }).toPass({ timeout: 20000 })

      // 6. Click "+ Thêm Thẻ gói" twice.
      const addChildBtn = page.getByRole('button', { name: '+ Thêm Thẻ gói' })
      await addChildBtn.click()

      // After first click, re-select the parent block to click again.
      await block.click()
      await expect(addChildBtn).toBeVisible()
      await addChildBtn.click()

      // Canvas should now contain 2 PackageCard items in the slot zone.
      // Child cards are Puck components nested inside the parent block on the canvas.
      const childCards = canvas.locator(`[data-puck-component="${blockId}"] [data-puck-component]`)
      await expect(childCards).toHaveCount(2)

      // Right panel should now show fields of the newly added card.
      await expect(page.getByRole('heading', { name: 'Thẻ gói', level: 2 })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Chọn sản phẩm từ hệ thống...' })).toBeVisible()

      // 7. Click Undo once.
      const undoBtn = page
        .getByRole('contentinfo', { name: 'Thanh công cụ trình dựng' })
        .getByRole('button', { name: 'Hoàn tác' })
      await undoBtn.click()

      // Canvas now has 1 card.
      await expect(childCards).toHaveCount(1)

      // 8. Save draft and verify JSON via API has no `_addChild`.
      const saveDraftBtn = page.getByRole('button', { name: 'Lưu nháp', exact: true })
      await saveDraftBtn.click()

      // Poll the saved draft: 1 card in the slot, and no `_addChild` anywhere in the page data.
      await expect
        .poll(
          async () => {
            const res = await page.request.get(`/api/pages/${pageId}?draft=true&depth=0`)
            if (!res.ok()) return 'error'
            const doc = await res.json()
            const json = JSON.stringify(doc.puckData || {})
            const block = (doc.puckData?.content || []).find(
              (b: { props?: { id?: string } }) => b.props?.id === blockId,
            )
            const cards = Array.isArray(block?.props?.cards) ? block.props.cards.length : -1
            return `${cards}:${json.includes('_addChild')}`
          },
          { timeout: 20000 },
        )
        .toBe('1:false')
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
