import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

test.describe('EB-14b: Lock visibility and manual temporary unlocking', () => {
  test('displays lock status, allows owner to unlock temporarily, prevents deleting only required block, and restricts editor', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs only on desktop-1440.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const ownerEmail = `eb14b-owner-${randomUUID()}@example.test`
    const ownerPassword = randomUUID()

    const editorEmail = `eb14b-editor-${randomUUID()}@example.test`
    const editorPassword = randomUUID()

    const slugHome = 'trang-chu'
    const heroId = `eb14b-hero-${randomUUID().slice(0, 8)}`
    const rtId = `eb14b-rt-${randomUUID().slice(0, 8)}`
    const rtText = `[MẪU] Khối nội dung văn bản dưới Hero - ${randomUUID().slice(0, 6)}`

    let ownerUserId: number | undefined
    let editorUserId: number | undefined
    let homepageId: number | undefined

    try {
      // 1. First admin bootstrap as owner (self-contained on clean DB)
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()
      test.skip(
        !process.env.CI && initData.initialized === true,
        'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
      )

      await page.goto('/admin/create-first-user')
      await page.locator('#field-email').fill(ownerEmail)
      await page.locator('#field-password').fill(ownerPassword)
      await page.locator('#field-confirm-password').fill(ownerPassword)

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
      ownerUserId = registered.user?.id || registered.doc?.id
      await expect(page).toHaveURL(/\/admin\/?$/)
      if (!ownerUserId) {
        ownerUserId = (await (await page.request.get('/api/users/me')).json()).user.id
      }

      // 2. Create editor user via REST API
      const createEditorRes = await page.request.post('/api/users', {
        data: {
          email: editorEmail,
          password: editorPassword,
          role: 'editor',
        },
      })
      expect(createEditorRes.ok()).toBe(true)
      const editorDoc = await createEditorRes.json()
      editorUserId = editorDoc.doc?.id || editorDoc.user?.id

      // 3. Create or update Homepage ('trang-chu') with HeroTwoEntries + RichText
      const createHome = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] Trang Chủ EB-14b',
          slug: slugHome,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HeroTwoEntries',
                props: {
                  id: heroId,
                  titleLine1: '[MẪU] TRANG CHỦ EB-14B',
                  titleLine2: 'TRẠM DỪNG CẢM XÚC',
                },
              },
              {
                type: 'RichText',
                props: {
                  id: rtId,
                  content: rtText,
                },
              },
            ],
            root: { props: { title: '[MẪU] Trang Chủ EB-14b' } },
          },
        },
      })
      expect(createHome.ok()).toBe(true)
      homepageId = (await createHome.json()).doc.id
      expect(homepageId).toBeDefined()

      // --- STEP 1: Owner opens homepage in builder, checks lock indicators ---
      await page.goto(`/builder/${homepageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
      await page.waitForTimeout(600)

      const canvas = page.frameLocator('iframe')
      const heroBlock = canvas.locator(`[data-puck-component="${heroId}"]`)
      await expect(heroBlock).toBeVisible()

      // Click Hero to select it
      await heroBlock.click({ force: true })
      await page.waitForTimeout(400)

      // Lock badge is visible on floating action bar with title reason
      const lockBadge = canvas.getByTestId('block-lock-badge')
      await expect(lockBadge).toBeVisible()
      await expect(lockBadge).toHaveText(new RegExp(vi.eb14b.lockedAria))
      await expect(lockBadge).toHaveAttribute('title', vi.eb14b.reasonHeroHomepage)

      // Properties panel on right shows lock banner with reasons and blocked actions
      const propBanner = page.getByTestId('lock-properties-banner').filter({ visible: true })
      await expect(propBanner).toBeVisible()
      await expect(propBanner).toHaveText(new RegExp(vi.eb14b.reasonHeroHomepage))

      // Delete button on action bar is visible but aria-disabled
      const deleteBtn = canvas.getByTestId('block-action-delete')
      await expect(deleteBtn).toBeVisible()
      await expect(deleteBtn).toHaveAttribute('aria-disabled', 'true')

      // Capture screenshot 1: Locked badge + tooltip / properties panel
      await page.screenshot({ path: 'docs/screenshots/eb14/01-locked-badge-tooltip.png' })

      // Clicking disabled delete button shows toast notification
      await deleteBtn.click({ force: true })
      await page.waitForTimeout(300)
      const toast = page.locator('[role="status"]').filter({ hasText: vi.eb14b.reasonHeroHomepage })
      await expect(toast.first()).toBeVisible()

      // --- STEP 2: Owner unlocks block via Action Bar, confirms alertdialog ---
      await heroBlock.click({ force: true })
      await page.waitForTimeout(400)
      const unlockBtn = canvas.getByTestId('block-action-unlock')
      await expect(unlockBtn).toBeVisible()
      await unlockBtn.click({ force: true })

      // Alert dialog appears with role="alertdialog"
      const dialog = page.locator('[role="alertdialog"]')
      await expect(dialog).toBeVisible()
      await expect(dialog).toHaveText(new RegExp(vi.eb14b.confirmTitle))
      await expect(dialog).toHaveText(new RegExp(vi.eb14b.confirmHeroNotice))

      // Cancel button should be focused
      const cancelBtn = page.getByTestId('dialog-cancel-unlock')
      await expect(cancelBtn).toBeFocused()

      // Capture screenshot 2: Confirmation Alertdialog
      await page.screenshot({ path: 'docs/screenshots/eb14/02-unlock-confirm-dialog.png' })

      // Confirm unlock
      const confirmUnlockBtn = page.getByTestId('dialog-confirm-unlock')
      await confirmUnlockBtn.click()
      await page.waitForTimeout(400)

      // Re-select Hero to show action bar
      await heroBlock.click({ force: true })
      await page.waitForTimeout(400)

      // Block is now unlocked! Unlocked badge appears on action bar
      const unlockedBadge = canvas.getByTestId('block-unlocked-badge')
      await expect(unlockedBadge).toBeVisible()
      await expect(unlockedBadge).toHaveText(new RegExp(vi.eb14b.unlockedAria))

      // Capture screenshot 3: Unlocked badge
      await page.screenshot({ path: 'docs/screenshots/eb14/03-unlocked-badge.png' })

      // --- STEP 3: Reorder Hero with Move Down button, Publish, check public page ---
      // Move Hero down below RichText
      const moveDownBtn = canvas.getByTestId('block-action-move-down')
      await expect(moveDownBtn).toBeVisible()
      await expect(moveDownBtn).not.toHaveAttribute('aria-disabled', 'true')
      await moveDownBtn.click()
      await page.waitForTimeout(600)

      // Publish page
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 15000,
      })

      // Visit public page: verify Hero is below RichText
      await page.goto(`/${slugHome}`, { waitUntil: 'domcontentloaded' })
      const pubHero = page.getByText('[MẪU] TRANG CHỦ EB-14B', { exact: true })
      const pubRt = page.getByText(rtText)
      await expect(pubHero).toBeVisible()
      await expect(pubRt).toBeVisible()
      const heroBox = await pubHero.boundingBox()
      const rtBox = await pubRt.boundingBox()
      expect(heroBox && rtBox && heroBox.y > rtBox.y).toBe(true)

      // --- STEP 4: In unlocked state, attempting to delete the only Hero is blocked ---
      await page.goto(`/builder/${homepageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
      await page.waitForTimeout(600)

      const homeCanvas = page.frameLocator('iframe')
      const targetHero = homeCanvas.locator(`[data-puck-component="${heroId}"]`)
      await targetHero.click({ force: true })
      await page.waitForTimeout(400)

      // Unlock again for this new session
      await homeCanvas.getByTestId('block-action-unlock').click({ force: true })
      await page.getByTestId('dialog-confirm-unlock').click()
      await page.waitForTimeout(400)

      // Re-select Hero to show action bar
      await targetHero.click({ force: true })
      await page.waitForTimeout(400)

      // Try deleting the only Hero: Delete button is enabled (not aria-disabled)
      const unlockedDeleteBtn = homeCanvas.getByTestId('block-action-delete')
      await expect(unlockedDeleteBtn).toBeVisible()
      await expect(unlockedDeleteBtn).not.toHaveAttribute('aria-disabled', 'true')
      await unlockedDeleteBtn.click({ force: true })
      await page.waitForTimeout(300)

      // Toast blocks deletion
      const deleteBlockedToast = page.locator('[role="status"]').filter({
        hasText: vi.eb14b.cannotDeleteLastHero,
      })
      await expect(deleteBlockedToast.first()).toBeVisible()
      // Hero still exists
      await expect(targetHero).toBeVisible()

      // --- STEP 5: Reload editor -> Hero automatically relocked ---
      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
      await page.waitForTimeout(600)

      const reloadedCanvas = page.frameLocator('iframe')
      await reloadedCanvas.locator(`[data-puck-component="${heroId}"]`).click({ force: true })
      await page.waitForTimeout(400)

      await expect(reloadedCanvas.getByTestId('block-lock-badge')).toBeVisible()

      // --- STEP 6: Editor user cannot unlock ---
      const editorContext = await page.context().browser()!.newContext()
      const editorPage = await editorContext.newPage()
      try {
        await editorPage.goto('/admin/login', { waitUntil: 'domcontentloaded' })
        await editorPage.locator('#field-email').fill(editorEmail)
        await editorPage.locator('#field-password').fill(editorPassword)
        await editorPage.locator('button[type="submit"]').click()
        await expect(editorPage).toHaveURL(/\/admin\/?$/)

        await editorPage.goto(`/builder/${homepageId}`, { waitUntil: 'domcontentloaded' })
        await expect(editorPage.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
        await editorPage.waitForTimeout(600)

        const edCanvas = editorPage.frameLocator('iframe')
        await edCanvas.locator(`[data-puck-component="${heroId}"]`).click({ force: true })
        await editorPage.waitForTimeout(400)

        // Lock badge is visible
        await expect(edCanvas.getByTestId('block-lock-badge')).toBeVisible()
        // Unlock button does NOT exist
        await expect(edCanvas.getByTestId('block-action-unlock')).toHaveCount(0)
        await expect(editorPage.getByTestId('block-banner-unlock')).toHaveCount(0)
        // Informational message for editor
        await expect(
          editorPage.getByText(vi.eb14b.editorOnlyOwnerCanUnlock).filter({ visible: true }),
        ).toBeVisible()
      } finally {
        await editorContext.close()
      }
    } finally {
      if (homepageId) await page.request.delete(`/api/pages/${homepageId}`).catch(() => {})
      if (editorUserId) await page.request.delete(`/api/users/${editorUserId}`).catch(() => {})
      if (ownerUserId) await page.request.delete(`/api/users/${ownerUserId}`).catch(() => {})
    }
  })
})
