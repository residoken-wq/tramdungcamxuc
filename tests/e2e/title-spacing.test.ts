import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'

test.describe('PK-13: title line height and heading gaps', () => {
  test('global default very-airy (1.6) and per-block override normal (1.3) reach the public page', async ({
    page,
  }, testInfo) => {
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `pk-13-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-title-spacing-${randomUUID()}`
    const heroId = `pk13-hero-${randomUUID().slice(0, 8)}`
    const headerId = `pk13-hdr-${randomUUID().slice(0, 8)}`

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

      // 2. Set site-wide global default: titleLineHeight = 'very-airy' (1.6).
      const updateGlobal = await page.request.post('/api/globals/designSystem', {
        data: {
          titleSpacing: {
            titleLineHeight: 'very-airy',
            eyebrowGap: 'normal',
            emotionGap: 'normal',
          },
        },
      })
      expect(updateGlobal.ok()).toBe(true)

      // 3. Draft page with HeroImage + SectionHeader.
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E PK-13 Title Spacing',
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HeroImage',
                props: {
                  id: heroId,
                  titleLine1: '[MẪU] TIÊU ĐỀ HERO',
                  titleLine2: '[MẪU] DÒNG 2',
                  seriesLabel: '[MẪU] Khởi đầu',
                },
              },
              {
                type: 'SectionHeader',
                props: {
                  id: headerId,
                  titleLine1: '[MẪU] TIÊU ĐỀ SECTION',
                  titleLine2: '[MẪU] DÒNG 2',
                  seriesLabel: '[MẪU] Nhãn',
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E PK-13' } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      // 4. Open builder, select HeroImage block, set titleLineHeight to 'normal' (Vừa = 1.3).
      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      const heroBlock = canvas.locator(`[data-puck-component="${heroId}"]`)
      await expect(heroBlock).toBeVisible()
      const styleTab = page.getByRole('tab', { name: 'Kiểu', exact: true })
      await expect(async () => {
        await heroBlock.click()
        await expect(styleTab).toBeVisible({ timeout: 1000 })
      }).toPass({ timeout: 15000 })

      await styleTab.click()
      await expect(styleTab).toHaveAttribute('aria-selected', 'true')

      // Select 'Vừa' for Giãn dòng tiêu đề on the Hero block
      const lhSelect = page.getByLabel('Giãn dòng tiêu đề', { exact: true })
      await lhSelect.selectOption('normal')

      // 5. Publish the page.
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' }),
      ).toBeVisible({ timeout: 15000 })

      // 6. Test on public page at both 1440 and 375 viewports.
      const publicPage = await page.context().newPage()
      for (const width of [1440, 375]) {
        await publicPage.setViewportSize({ width, height: 900 })
        await publicPage.goto(`/${slug}`)

        // Hero block (overridden to 'normal' = 1.3)
        const heroHeading = publicPage.locator(`[data-eb-id="${heroId}"] h1`)
        await expect(heroHeading).toBeVisible()
        const heroRatio = await heroHeading.evaluate((el) => {
          const style = window.getComputedStyle(el)
          const fontSize = parseFloat(style.fontSize)
          const lineHeight = parseFloat(style.lineHeight)
          return lineHeight / fontSize
        })
        expect(heroRatio).toBeCloseTo(1.3, 1)

        // SectionHeader block (inherits global default 'very-airy' = 1.6)
        const sectionHeading = publicPage.locator('h2.font-display').last()
        await expect(sectionHeading).toBeVisible()
        const sectionRatio = await sectionHeading.evaluate((el) => {
          const style = window.getComputedStyle(el)
          const fontSize = parseFloat(style.fontSize)
          const lineHeight = parseFloat(style.lineHeight)
          return lineHeight / fontSize
        })
        expect(sectionRatio).toBeCloseTo(1.6, 1)
      }
      await publicPage.close()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      try {
        // Restore global designSystem titleSpacing to default
        await page.request.post('/api/globals/designSystem', {
          data: {
            titleSpacing: {
              titleLineHeight: 'normal',
              eyebrowGap: 'normal',
              emotionGap: 'normal',
            },
          },
        })
      } catch {
        // ignore restore failure during cleanup
      }

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

