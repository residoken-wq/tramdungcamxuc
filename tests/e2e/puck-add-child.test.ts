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
      const cardSlotZone = canvas.locator(`[id="${blockId}:cards"], [data-puck-zone="${blockId}:cards"]`)
      await expect(cardSlotZone.locator('> *')).toHaveCount(2)

      // Right panel should now show fields of the newly added card.
      await expect(page.getByText(/Gói sản phẩm|Chọn gói đồng hành/i)).toBeVisible()

      // 7. Click Undo once.
      const undoBtn = page.getByRole('button', { name: /Hoàn tác/i })
      await undoBtn.click()

      // Canvas now has 1 card.
      await expect(cardSlotZone.locator('> *')).toHaveCount(1)

      // 8. Save draft and verify JSON via API has no `_addChild`.
      const saveDraftBtn = page.getByRole('button', { name: /Lưu nháp/i })
      await saveDraftBtn.click()
      await expect(page.getByText(/Đã lưu nháp/i)).toBeVisible({ timeout: 15000 })

      const savedRes = await page.request.get(`/api/pages/${pageId}?draft=true`)
      expect(savedRes.ok()).toBe(true)
      const savedPage = await savedRes.json()
      const serializedPuckData = JSON.stringify(savedPage.puckData || {})
      expect(serializedPuckData).not.toContain('_addChild')
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
