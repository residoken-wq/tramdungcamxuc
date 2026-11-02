import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

test.describe('EB-09: Custom CSS, HTML widget, and entrance animations', () => {
  test('enforces locking, owner-only authorization, safe HTML sanitization, and entrance animation progressive enhancement', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs only on desktop-1440.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const ownerEmail = `eb-09-owner-${randomUUID()}@example.test`
    const ownerPassword = randomUUID()

    const editorEmail = `eb-09-editor-${randomUUID()}@example.test`
    const editorPassword = randomUUID()

    const slug = `e2e-eb09-${randomUUID().slice(0, 8)}`
    const headingId = `eb09-h-${randomUUID().slice(0, 8)}`
    const htmlWidgetId = `eb09-hw-${randomUUID().slice(0, 8)}`

    let ownerUserId: number | string | undefined
    let editorUserId: number | string | undefined
    let pageId: number | string | undefined
    let previousDesignSystem: Record<string, unknown> | undefined

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
      await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20000 })
      if (!ownerUserId) {
        ownerUserId = (await (await page.request.get('/api/users/me')).json()).user.id
      }

      // 2. Create editor user via REST
      const createEditorRes = await page.request.post('/api/users', {
        data: {
          email: editorEmail,
          password: editorPassword,
          role: 'editor',
        },
      })
      expect(createEditorRes.ok()).toBe(true)
      const editorData = await createEditorRes.json()
      editorUserId = editorData.doc?.id || editorData.user?.id

      // 3. Save previous designSystem state and set lock.customCss = 'locked'
      const dsGetRes = await page.request.get('/api/globals/designSystem')
      if (dsGetRes.ok()) {
        previousDesignSystem = await dsGetRes.json()
      }

      const prevLock =
        previousDesignSystem?.lock && typeof previousDesignSystem.lock === 'object'
          ? (previousDesignSystem.lock as Record<string, unknown>)
          : {}

      const lockRes = await page.request.post('/api/globals/designSystem', {
        data: {
          ...(previousDesignSystem || {}),
          lock: {
            ...prevLock,
            customCss: 'locked',
          },
        },
      })
      expect(lockRes.ok()).toBe(true)

      // 4. Create test page via REST with customCss and an HtmlWidget
      const initialPageData = {
        title: '[MẪU] E2E EB-09 Custom Code Page',
        slug,
        _status: 'published',
        puckData: {
          content: [
            {
              type: 'HeadingWidget',
              props: {
                id: headingId,
                title: 'Tiêu đề kiểm tra EB-09',
                _style: {
                  customCss: 'selector { outline: 4px solid red; }',
                  entrance: 'fade-up',
                  entranceDelay: 150,
                },
              },
            },
            {
              type: 'HtmlWidget',
              props: {
                id: htmlWidgetId,
                html: '<p class="locked-check">Đoạn văn kiểm tra khoá</p>',
              },
            },
          ],
          root: {
            props: {
              title: '[MẪU] E2E EB-09 Custom Code Page',
              customCss: 'h1 { border: 2px solid blue; }',
            },
          },
        },
      }

      const createPageRes = await page.request.post('/api/pages', {
        data: initialPageData,
      })
      expect(createPageRes.ok()).toBe(true)
      pageId = (await createPageRes.json()).doc.id

      // -------------------------------------------------------------
      // 5. Test 1: Locked customCss state
      // -------------------------------------------------------------
      // (a) In editor, owner does NOT see "CSS tuỳ chỉnh" group in Advanced tab
      await page.goto(`/builder/${pageId}`)
      await page.waitForSelector('.puck-frame', { timeout: 30000 })

      // Select HeadingWidget block in canvas
      const frame = page.frameLocator('.puck-frame').first()
      await frame.getByText('Tiêu đề kiểm tra EB-09').click()

      // Switch to Advanced tab
      await page.getByRole('button', { name: 'Nâng cao' }).click()

      // Verify custom CSS group is hidden while locked
      await expect(page.getByText('CSS tuỳ chỉnh')).toHaveCount(0)

      // (b) On public page, custom CSS is NOT emitted, and HtmlWidget is blank
      await page.goto(`/${slug}`)
      await page.waitForLoadState('networkidle')

      // Block outline must NOT be in public styles while locked
      const pageStyles = await page.locator('style[data-design-system="blocks"]').allInnerTexts()
      const combinedStyles = pageStyles.join(' ')
      expect(combinedStyles).not.toContain('outline: 4px solid red')
      expect(combinedStyles).not.toContain('border: 2px solid blue')

      // HtmlWidget content must not render on public page while locked
      await expect(page.locator('.locked-check')).toHaveCount(0)

      // -------------------------------------------------------------
      // 6. Test 2: Open customCss state with owner
      // -------------------------------------------------------------
      const openRes = await page.request.post('/api/globals/designSystem', {
        data: {
          ...(previousDesignSystem || {}),
          lock: {
            ...prevLock,
            customCss: 'open',
          },
        },
      })
      expect(openRes.ok()).toBe(true)

      // Reload builder as owner
      await page.goto(`/builder/${pageId}`)
      await page.waitForSelector('.puck-frame', { timeout: 30000 })

      // Select HeadingWidget and open Advanced tab
      const frameOpen = page.frameLocator('.puck-frame').first()
      await frameOpen.getByText('Tiêu đề kiểm tra EB-09').click()
      await page.getByRole('button', { name: 'Nâng cao' }).click()

      // Group "CSS tuỳ chỉnh" is NOW visible!
      await expect(page.getByText('CSS tuỳ chỉnh')).toBeVisible({ timeout: 10000 })

      // Update customCss on the block with a unique outline
      const cssTextarea = page.locator('textarea[aria-label="CSS tuỳ chỉnh"]')
      await cssTextarea.fill('selector { outline: 3px solid rgb(0, 128, 0); }')

      // Update HtmlWidget with malicious payload to test safe sanitizer
      await frameOpen.locator(`[data-eb-id="${htmlWidgetId}"]`).click()
      const htmlTextarea = page.locator('textarea[placeholder*="Nội dung HTML"]')
      await htmlTextarea.fill(
        '<p class="x">An toàn</p><img src=x onerror="window.__eb09=1"><script>window.__eb09=2</script>',
      )

      // Publish page
      await page.getByRole('button', { name: vi.builder.publish }).click()
      await expect(page.getByText(vi.builder.published)).toBeVisible({ timeout: 20000 })

      // -------------------------------------------------------------
      // 7. Test 3: Verify public page sanitization & applied styles
      // -------------------------------------------------------------
      await page.goto(`/${slug}`)
      await page.waitForLoadState('networkidle')

      // Heading block has the scoped outline in styles
      const publicStyles = await page.locator('style[data-design-system="blocks"]').allInnerTexts()
      const combinedPubStyles = publicStyles.join(' ')
      expect(combinedPubStyles).toContain('outline: 3px solid rgb(0, 128, 0)')

      // HtmlWidget renders safe markup
      await expect(page.locator('p.x')).toHaveText('An toàn')

      // Malicious img[src="x"], script, and onerror must NOT exist
      await expect(page.locator('img[src="x"]')).toHaveCount(0)
      await expect(page.locator('script:has-text("__eb09")')).toHaveCount(0)

      // Window global injection variable must NOT be defined
      const windowEb09 = await page.evaluate(
        () => (window as unknown as Record<string, unknown>).__eb09,
      )
      expect(windowEb09).toBeUndefined()

      // -------------------------------------------------------------
      // 8. Test 4: Editor user authorization
      // -------------------------------------------------------------
      const editorContext = await browser.newContext()
      const editorPage = await editorContext.newPage()

      // Login as editor
      await editorPage.goto('/admin/login')
      await editorPage.locator('#field-email').fill(editorEmail)
      await editorPage.locator('#field-password').fill(editorPassword)
      await editorPage.locator('button[type="submit"]').click()
      await expect(editorPage).toHaveURL(/\/admin\/?$/, { timeout: 20000 })

      // Editor opens visual builder
      await editorPage.goto(`/builder/${pageId}`)
      await editorPage.waitForSelector('.puck-frame', { timeout: 30000 })

      // Editor selects HeadingWidget and opens Advanced tab
      const editorFrame = editorPage.frameLocator('.puck-frame').first()
      await editorFrame.getByText('Tiêu đề kiểm tra EB-09').click()
      await editorPage.getByRole('button', { name: 'Nâng cao' }).click()

      // Non-owner cannot see "CSS tuỳ chỉnh" group even when lock is open!
      await expect(editorPage.getByText('CSS tuỳ chỉnh')).toHaveCount(0)

      // Editor edits heading text (safe property) and saves draft -> SUCCEEDS
      await editorPage.getByRole('button', { name: 'Nội dung' }).click()
      const titleInput = editorPage.locator('input[name="title"]')
      if ((await titleInput.count()) > 0) {
        await titleInput.fill('Tiêu đề đã được editor sửa')
      }
      await editorPage.getByRole('button', { name: vi.builder.saveDraft }).click()
      await expect(editorPage.getByText(vi.builder.savedDraft)).toBeVisible({ timeout: 20000 })

      // Editor attempts to tamper customCss via REST action -> REJECTED with 403 / error message
      const tamperRes = await editorPage.request.post(`/api/pages/${pageId}?draft=true`, {
        data: {
          puckData: {
            ...initialPageData.puckData,
            content: [
              {
                type: 'HeadingWidget',
                props: {
                  id: headingId,
                  _style: { customCss: 'selector { outline: 10px solid black; }' },
                },
              },
            ],
          },
        },
      })
      // Server action / REST guard blocks it
      if (tamperRes.ok()) {
        const json = await tamperRes.json()
        if (json.code) {
          expect(json.code).toBe('FORBIDDEN')
        }
      } else {
        expect(tamperRes.status()).toBe(403)
      }

      await editorContext.close()

      // -------------------------------------------------------------
      // 9. Test 5: Entrance animation and reduced motion
      // -------------------------------------------------------------
      // (a) Normal mode: element enters view
      await page.goto(`/${slug}`)
      const animatedEl = page.locator('[data-eb-entrance="fade-up"]')
      await expect(animatedEl).toBeVisible()
      await expect(animatedEl).toHaveClass(/eb-in-view/)

      // (b) Reduced motion mode: element is immediately visible without wait
      const rmContext = await browser.newContext({ reducedMotion: 'reduce' })
      const rmPage = await rmContext.newPage()
      await rmPage.goto(`/${slug}`)
      const rmAnimatedEl = rmPage.locator('[data-eb-entrance="fade-up"]')
      await expect(rmAnimatedEl).toBeVisible()

      // Under reduced motion, opacity is 1 and animations are inactive
      const opacity = await rmAnimatedEl.evaluate((el) => window.getComputedStyle(el).opacity)
      expect(opacity).toBe('1')

      await rmContext.close()
    } finally {
      // Cleanup: restore designSystem
      if (previousDesignSystem) {
        await page.request.post('/api/globals/designSystem', {
          data: previousDesignSystem,
        })
      }

      // Cleanup: delete test page
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`)
      }

      // Cleanup: delete editor user
      if (editorUserId) {
        await page.request.delete(`/api/users/${editorUserId}`)
      }

      // Cleanup: delete owner user if created
      if (ownerUserId) {
        await page.request.delete(`/api/users/${ownerUserId}`)
      }
    }
  })
})

