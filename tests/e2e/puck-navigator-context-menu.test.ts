import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-07: Navigator custom labels and right-click context menu', () => {
  test('renames block in navigator, duplicates and undos, copies style, pastes cross-page with fresh ids, enforces locks, and leaves public HTML clean', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs only on desktop-1440.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const email = `eb-07-${randomUUID()}@example.test`
    const password = randomUUID()

    const slugA = `e2e-eb07-a-${randomUUID().slice(0, 8)}`
    const slugB = `e2e-eb07-b-${randomUUID().slice(0, 8)}`
    const slugHome = `trang-chu`

    const containerAId = `eb07-con-a-${randomUUID().slice(0, 8)}`
    const heading1Id = `eb07-h1-${randomUUID().slice(0, 8)}`
    const heading2Id = `eb07-h2-${randomUUID().slice(0, 8)}`
    const heading1Text = `[MẪU] Tiêu đề 1 - ${randomUUID().slice(0, 6)}`
    const heading2Text = `[MẪU] Tiêu đề 2 - ${randomUUID().slice(0, 6)}`

    const headingBId = `eb07-hb-${randomUUID().slice(0, 8)}`
    const headingBText = `[MẪU] Tiêu đề trang B`

    const heroId = `eb07-hero-${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageAId: number | undefined
    let pageBId: number | undefined
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

      // 2. Create Page A: Container holding 2 Headings (Heading 2 has textColor: 'bright-magenta')
      const createPageA = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-07 Page A',
          slug: slugA,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'Container',
                props: {
                  id: containerAId,
                  tag: 'div',
                  width: 'boxed',
                  contentWidth: 'lg',
                  items: [
                    {
                      type: 'HeadingWidget',
                      props: {
                        id: heading1Id,
                        text: heading1Text,
                        tag: 'h2',
                      },
                    },
                    {
                      type: 'HeadingWidget',
                      props: {
                        id: heading2Id,
                        text: heading2Text,
                        tag: 'h2',
                        _style: {
                          textColor: 'bright-magenta',
                        },
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-07 Page A' } },
          },
        },
      })
      expect(createPageA.ok()).toBe(true)
      pageAId = (await createPageA.json()).doc.id
      expect(pageAId).toBeDefined()

      // 3. Create Page B: 1 HeadingWidget
      const createPageB = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-07 Page B',
          slug: slugB,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HeadingWidget',
                props: {
                  id: headingBId,
                  text: headingBText,
                  tag: 'h2',
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E EB-07 Page B' } },
          },
        },
      })
      expect(createPageB.ok()).toBe(true)
      pageBId = (await createPageB.json()).doc.id
      expect(pageBId).toBeDefined()

      // 4. Create Homepage with HeroTwoEntries (to test lock behavior)
      const createHome = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-07 Homepage',
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
            root: { props: { title: '[MẪU] E2E EB-07 Homepage' } },
          },
        },
      })
      if (createHome.ok()) {
        homepageId = (await createHome.json()).doc.id
      }

      // 5. Open Builder for Page A
      await page.goto(`/builder/${pageAId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)

      // --- TEST STEP 1: Rename Container in Navigator via Double-click ---
      await page.getByRole('tab', { name: 'Cấu trúc', exact: true }).click()
      const containerRow = page.locator(`[data-puck-layer-tree-id="${containerAId}"]`)
      await expect(containerRow).toBeVisible()

      // Double-click to enter inline rename
      await containerRow.locator('button').first().dblclick()
      const renameInput = containerRow.locator('input[type="text"]')
      await expect(renameInput).toBeVisible()
      await renameInput.fill('Khối giới thiệu')
      await renameInput.press('Enter')

      // Row should now prominently show "Khối giới thiệu"
      await expect(containerRow).toContainText('Khối giới thiệu')
      // Let Puck record the rename as its own history step (recording is debounced 250 ms).
      await page.waitForTimeout(600)

      // --- TEST STEP 2: Canvas Right-click Heading 1 -> Duplicate -> Undo ---
      const canvasA = page.frameLocator('iframe')
      const block1 = canvasA.locator(`[data-puck-component="${heading1Id}"]`)
      await expect(block1).toBeVisible()

      // Right-click Heading 1 on canvas
      await block1.click({ button: 'right' })
      const contextMenu = page.getByRole('menu', { name: 'Tác vụ khối' })
      await expect(contextMenu).toBeVisible()

      // Click "Nhân bản"
      await page.getByRole('menuitem', { name: /^Nhân bản$/ }).click()

      // Canvas should now have 3 headings (total 4 blocks inside canvas)
      await expect(canvasA.locator('[data-puck-component]')).toHaveCount(4)

      // Puck records history 250 ms after an action (debounced): an undo sooner than that goes one
      // step further back (here it would also undo the rename). Wait like a person would.
      await page.waitForTimeout(600)
      await page.getByRole('button', { name: 'Hoàn tác', exact: true }).first().click()

      // Should be back to 2 headings (total 3 blocks)
      await expect(canvasA.locator('[data-puck-component]')).toHaveCount(3)

      // --- TEST STEP 3: Copy Style from Heading 2 -> Paste Style on Heading 1 ---
      const block2 = canvasA.locator(`[data-puck-component="${heading2Id}"]`)
      await expect(block2).toBeVisible()

      // Right-click Heading 2 -> Copy
      await block2.click({ button: 'right' })
      await expect(contextMenu).toBeVisible()
      await page.getByRole('menuitem', { name: /^Sao chép$/ }).click()

      // Right-click Heading 1 -> Paste style
      await block1.click({ button: 'right' })
      await expect(contextMenu).toBeVisible()
      await page.getByRole('menuitem', { name: /^Dán kiểu$/ }).click()

      // Toast notification appears
      await expect(page.getByRole('status').filter({ hasText: 'Đã dán kiểu dáng' })).toBeVisible()

      // Save draft on Page A
      await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: /Đã lưu/ })).toBeVisible({
        timeout: 15000,
      })

      // --- TEST STEP 4: Copy Container -> Paste into Page B ---
      await page.getByRole('tab', { name: 'Cấu trúc', exact: true }).click()
      const rowLabel = containerRow.getByText('Khối giới thiệu')
      await expect(rowLabel).toBeVisible()
      await rowLabel.click({ button: 'right' })
      await expect(contextMenu).toBeVisible()
      await page.getByRole('menuitem', { name: /^Sao chép$/ }).click()

      // Open Page B
      await page.goto(`/builder/${pageBId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)

      const canvasB = page.frameLocator('iframe')
      const blockB = canvasB.locator(`[data-puck-component="${headingBId}"]`)
      await expect(blockB).toBeVisible()

      // Right-click first block on Page B -> Paste
      await blockB.click({ button: 'right' })
      await expect(page.getByRole('menuitem', { name: /^Dán$/ })).toBeEnabled()
      await page.getByRole('menuitem', { name: /^Dán$/ }).click()

      // Toast notification for paste
      await expect(page.getByRole('status').filter({ hasText: 'Đã dán khối' })).toBeVisible()

      // Page B canvas now contains the original heading plus the pasted Container + 2 Headings (total 4 blocks)
      await expect(canvasB.locator('[data-puck-component]')).toHaveCount(4)

      // Save draft on Page B to persist puckData to Payload
      await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click()

      // Verify fresh IDs in Page B data with polling for DB write
      await expect
        .poll(
          async () => {
            const resB = await page.request.get(`/api/pages/${pageBId}?draft=true&depth=0`)
            if (!resB.ok()) return null
            const json = await resB.json()
            const bContent = json.puckData?.content || []
            return bContent.find((b: { type: string }) => b.type === 'Container')
          },
          { timeout: 15000 },
        )
        .toBeDefined()

      const resB = await page.request.get(`/api/pages/${pageBId}?draft=true&depth=0`)
      expect(resB.ok()).toBe(true)
      const bContent = (await resB.json()).puckData.content
      const pastedContainer = bContent.find(
        (b: { type: string; props: { id: string } }) => b.type === 'Container',
      )
      expect(pastedContainer).toBeDefined()
      expect(pastedContainer.props.id).not.toBe(containerAId)
      const pastedChildIds = (pastedContainer.props.items ?? []).map(
        (b: { props: { id: string } }) => b.props.id,
      )
      expect(pastedChildIds).toHaveLength(2)
      expect(pastedChildIds).not.toContain(heading1Id)

      // QA EB-07c: paste INTO a slot (after a heading inside the pasted Container).
      await blockB.click({ button: 'right' })
      await page.getByRole('menuitem', { name: /^Sao chép$/ }).click()
      const innerHeading = canvasB.locator(`[data-puck-component="${pastedChildIds[0]}"]`)
      // EB-13a: right-click inside the selected block targets that block, so
      // select the inner heading first to paste after it inside the slot.
      await innerHeading.click({ force: true })
      await page.waitForTimeout(300)
      await innerHeading.click({ button: 'right', force: true })
      await page.getByRole('menuitem', { name: /^Dán$/ }).click()
      await expect(
        canvasB.locator(`.eb-c-${pastedContainer.props.id} > [data-puck-component]`),
      ).toHaveCount(3)
      await page.waitForTimeout(600)
      await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click()
      await expect
        .poll(
          async () => {
            const json = await (
              await page.request.get(`/api/pages/${pageBId}?draft=true&depth=0`)
            ).json()
            const c = (json.puckData?.content || []).find(
              (b: { type: string }) => b.type === 'Container',
            )
            return [
              json.puckData?.content?.length,
              c?.props?.items?.length,
              Object.keys(json.puckData?.zones ?? {}).length,
            ]
          },
          { timeout: 15000 },
        )
        // Root unchanged (heading + container), 3 blocks in the slot, no stray legacy zones.
        .toEqual([2, 3, 0])

      // --- TEST STEP 5: Homepage Locked Block HeroTwoEntries ---
      if (homepageId) {
        await page.goto(`/builder/${homepageId}`, { waitUntil: 'domcontentloaded' })
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)

        const canvasHome = page.frameLocator('iframe')
        const heroBlock = canvasHome.locator(`[data-puck-component="${heroId}"]`)
        await expect(heroBlock).toBeVisible()

        await heroBlock.click({ button: 'right', force: true })
        const deleteItem = page.getByRole('menuitem', { name: /^Xoá$/ })
        const duplicateItem = page.getByRole('menuitem', { name: /^Nhân bản$/ })

        // Locked block must have aria-disabled="true"
        await expect(deleteItem).toHaveAttribute('aria-disabled', 'true')
        await expect(duplicateItem).toHaveAttribute('aria-disabled', 'true')

        await page.keyboard.press('Escape')
      }

      // --- TEST STEP 6: Publish Page A and verify public HTML ---
      await page.goto(`/builder/${pageAId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)

      // Publish Page A
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 15000,
      })

      // Visit public page A
      await page.goto(`/${slugA}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()

      // Public HTML must NEVER contain the internal _label name "Khối giới thiệu"
      const publicHtml = await page.content()
      expect(publicHtml).not.toContain('Khối giới thiệu')

      // Heading 1 must carry the pasted bright-magenta text color style
      const heading1El = page.locator(`[data-eb-id="${heading1Id}"]`)
      await expect(heading1El).toBeVisible()
      await expect(heading1El).toHaveCSS('color', 'rgb(188, 3, 158)')
    } finally {
      // Clean up created resources
      if (pageAId) await page.request.delete(`/api/pages/${pageAId}`).catch(() => {})
      if (pageBId) await page.request.delete(`/api/pages/${pageBId}`).catch(() => {})
      if (homepageId) await page.request.delete(`/api/pages/${homepageId}`).catch(() => {})
      if (userId) await page.request.delete(`/api/users/${userId}`).catch(() => {})
    }
  })
})
