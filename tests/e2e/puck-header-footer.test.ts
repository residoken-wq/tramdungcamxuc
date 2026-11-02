import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('EB-10: Header and Footer Visual Builder', () => {
  test('validates full lifecycle: code default, builder header/footer, mobile menu at 375px, legal footer protection, draft fallback, and editor RBAC', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs only on desktop-1440.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const ownerEmail = `eb-10-owner-${randomUUID()}@example.test`
    const ownerPassword = randomUUID()

    const editorEmail = `eb-10-editor-${randomUUID()}@example.test`
    const editorPassword = randomUUID()

    let ownerUserId: number | string | undefined
    let editorUserId: number | string | undefined
    let headerPageId: number | string | undefined
    let footerPageId: number | string | undefined
    let draftHeaderPageId: number | string | undefined
    let previousNavigation: Record<string, unknown> | undefined

    try {
      // -------------------------------------------------------------
      // 1. First admin bootstrap (self-contained on clean DB)
      // -------------------------------------------------------------
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

      // -------------------------------------------------------------
      // 2. Create editor user via REST
      // -------------------------------------------------------------
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

      // Save initial navigation state
      const navGetRes = await page.request.get('/api/globals/navigation')
      if (navGetRes.ok()) {
        previousNavigation = await navGetRes.json()
      }

      // -------------------------------------------------------------
      // 3. Scenario 1: Default (code) - public page has code Navbar, no [data-eb-header]
      // -------------------------------------------------------------
      await page.goto('/')
      await expect(page.locator('header nav')).toBeVisible()
      await expect(page.locator('[data-eb-header]')).toHaveCount(0)
      await expect(page.locator('[data-eb-footer]')).toHaveCount(0)

      // -------------------------------------------------------------
      // 4. Scenario 2: Owner creates & publishes header in builder, selects headerSource = builder
      // -------------------------------------------------------------
      const customCtaText = '[MẪU] KẾT NỐI NGAY'
      const createHeaderRes = await page.request.post('/api/pages', {
        data: {
          title: '[MẪU] E2E Header Builder',
          kind: 'header',
          _status: 'published',
        },
      })
      expect(createHeaderRes.ok()).toBe(true)
      const headerDoc = (await createHeaderRes.json()).doc
      headerPageId = headerDoc.id

      // Update header puckData to add custom button
      const existingContainer = headerDoc.puckData?.content?.[0] || {
        type: 'Container',
        props: { id: 'header-container', items: [] },
      }
      const customHeaderData = {
        ...headerDoc.puckData,
        content: [
          {
            ...existingContainer,
            props: {
              ...existingContainer.props,
              items: [
                ...(existingContainer.props?.items || []),
                {
                  type: 'ButtonWidget',
                  props: {
                    id: 'custom-e2e-cta-btn',
                    text: customCtaText,
                    href: '#custom-connect',
                    variant: 'primary',
                    size: 'sm',
                  },
                },
              ],
            },
          },
        ],
      }

      const updateHeaderRes = await page.request.patch(`/api/pages/${headerPageId}`, {
        data: {
          puckData: customHeaderData,
          _status: 'published',
        },
      })
      expect(updateHeaderRes.ok()).toBe(true)

      // Owner selects headerSource = 'builder' in navigation
      const updateNavRes = await page.request.post('/api/globals/navigation', {
        data: {
          ...(previousNavigation || {}),
          headerSource: 'builder',
          headerPage: headerPageId,
        },
      })
      expect(updateNavRes.ok()).toBe(true)

      // Verify on public page
      await page.goto('/')
      const headerLocator = page.locator('[data-eb-header]')
      await expect(headerLocator).toBeVisible()
      await expect(headerLocator).toContainText(customCtaText)

      // Verify navigation items exist
      await expect(page.locator('[data-eb-header] a')).not.toHaveCount(0)

      // Verify mobile responsiveness at 375px
      await page.setViewportSize({ width: 375, height: 667 })
      const mobileMenuBtn = page.locator(
        '[data-eb-header] #mobile-nav-toggle, [data-eb-header] button[aria-label*="Mở menu"]',
      )
      await expect(mobileMenuBtn).toBeVisible()

      // Open mobile drawer
      await mobileMenuBtn.click()
      const mobileDrawer = page.locator('#mobile-nav-drawer')
      await expect(mobileDrawer).toBeVisible()

      // Close mobile drawer using Escape
      await page.keyboard.press('Escape')
      await expect(mobileDrawer).not.toBeVisible()

      // Reset viewport back to desktop
      await page.setViewportSize({ width: 1440, height: 900 })

      // -------------------------------------------------------------
      // 5. Scenario 3: Footer builder: 6 legal links, LegalFooter deletion rejected, slug returns 404
      // -------------------------------------------------------------
      const createFooterRes = await page.request.post('/api/pages', {
        data: {
          title: '[MẪU] E2E Footer Builder',
          kind: 'footer',
          _status: 'published',
        },
      })
      expect(createFooterRes.ok()).toBe(true)
      const footerDoc = (await createFooterRes.json()).doc
      footerPageId = footerDoc.id
      const footerSlug = footerDoc.slug

      // Set footerSource = builder in navigation
      const updateNavFooterRes = await page.request.post('/api/globals/navigation', {
        data: {
          ...(previousNavigation || {}),
          headerSource: 'builder',
          headerPage: headerPageId,
          footerSource: 'builder',
          footerPage: footerPageId,
        },
      })
      expect(updateNavFooterRes.ok()).toBe(true)

      // Public page has [data-eb-footer] and contains legal links
      await page.goto('/')
      const footerLocator = page.locator('[data-eb-footer]')
      await expect(footerLocator).toBeVisible()
      await expect(page.locator('[data-eb-footer] a[href*="dieu-khoan-su-dung"]')).toBeVisible()

      // Attempting to delete LegalFooter from footer page via REST is rejected
      const invalidFooterData = {
        content: [{ type: 'Container', props: { id: 'invalid-c' } }],
        zones: {},
      }
      const deleteLegalRes = await page.request.patch(`/api/pages/${footerPageId}`, {
        data: {
          puckData: invalidFooterData,
        },
      })
      expect(deleteLegalRes.status()).toBe(400)

      // Visiting the internal footer slug returns 404
      const footerSlugRes = await page.goto(`/${footerSlug}`)
      expect(footerSlugRes?.status()).toBe(404)

      // -------------------------------------------------------------
      // 6. Scenario 4: Selected builder page is draft -> falls back to code
      // -------------------------------------------------------------
      const createDraftHeaderRes = await page.request.post('/api/pages', {
        data: {
          title: '[MẪU] E2E Draft Header',
          kind: 'header',
          _status: 'draft',
        },
      })
      expect(createDraftHeaderRes.ok()).toBe(true)
      draftHeaderPageId = (await createDraftHeaderRes.json()).doc.id

      // Point navigation to the unpublished draft header
      await page.request.post('/api/globals/navigation', {
        data: {
          ...(previousNavigation || {}),
          headerSource: 'builder',
          headerPage: draftHeaderPageId,
        },
      })

      // Public page falls back to code Navbar!
      await page.goto('/')
      await expect(page.locator('[data-eb-header]')).toHaveCount(0)
      await expect(page.locator('header nav')).toBeVisible()

      // -------------------------------------------------------------
      // 7. Scenario 5: Editor RBAC permissions
      // -------------------------------------------------------------
      const editorContext = await browser.newContext()
      const editorPage = await editorContext.newPage()

      // Editor logs in
      await editorPage.goto('/admin/login')
      await editorPage.locator('#field-email').fill(editorEmail)
      await editorPage.locator('#field-password').fill(editorPassword)
      await editorPage.locator('button[type="submit"]').click()
      await expect(editorPage).toHaveURL(/\/admin\/?$/, { timeout: 20000 })

      // Editor tries to modify navigation headerSource -> field is protected by isOwner and stripped
      const editorUpdateNavRes = await editorPage.request.post('/api/globals/navigation', {
        data: {
          headerSource: 'code',
        },
      })
      expect(editorUpdateNavRes.ok()).toBe(true)
      const checkNav = await (await page.request.get('/api/globals/navigation')).json()
      expect(checkNav.headerSource).toBe('builder')

      // Editor can edit header page content -> SUCCEEDS (200)
      const editorUpdatePageRes = await editorPage.request.patch(`/api/pages/${headerPageId}`, {
        data: {
          title: '[MẪU] Header Title Updated By Editor',
        },
      })
      expect(editorUpdatePageRes.ok()).toBe(true)

      await editorContext.close()
    } finally {
      // -------------------------------------------------------------
      // Cleanup: restore navigation and delete test documents
      // -------------------------------------------------------------
      if (previousNavigation) {
        await page.request.post('/api/globals/navigation', {
          data: {
            ...previousNavigation,
            headerSource: 'code',
            headerPage: null,
            footerSource: 'code',
            footerPage: null,
          },
        }).catch(() => {})
      }

      if (headerPageId) {
        await page.request.delete(`/api/pages/${headerPageId}`).catch(() => {})
      }
      if (footerPageId) {
        await page.request.delete(`/api/pages/${footerPageId}`).catch(() => {})
      }
      if (draftHeaderPageId) {
        await page.request.delete(`/api/pages/${draftHeaderPageId}`).catch(() => {})
      }
      if (editorUserId) {
        await page.request.delete(`/api/users/${editorUserId}`).catch(() => {})
      }
      if (ownerUserId) {
        await page.request.delete(`/api/users/${ownerUserId}`).catch(() => {})
      }
    }
  })
})

