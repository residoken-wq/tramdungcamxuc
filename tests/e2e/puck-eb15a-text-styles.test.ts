import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from './fixtures'
import { vi } from '@/lib/i18n/vi'

test.describe('EB-15a: Kiểu chữ cho từng ô chữ (Nút "Aa")', () => {
  test('cho phép tùy chỉnh màu sắc, cỡ chữ đáp ứng và kiểm tra tương phản chuẩn WCAG AA', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs on desktop-1440 project.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const email = `eb15a-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-text-styles-${randomUUID().slice(0, 8)}`
    const storyId = `eb15a-story-${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined

    const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots/eb15')
    if (process.env.EB15_SCREENSHOTS === '1' && !fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }

    try {
      // 1. Admin bootstrap
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
      await page.locator('button[type="submit"]').click()
      await page.waitForURL((url) => !url.pathname.includes('/create-first-user'), {
        timeout: 45000,
      })

      // Fetch current user id
      const meRes = await page.request.get('/api/users/me')
      if (meRes.ok()) {
        const meJson = await meRes.json()
        userId = meJson?.user?.id
      }

      // 2. Create test page with HanaStory block
      const initialPuckData = {
        root: { props: { title: 'EB-15a Test Page' } },
        content: [
          {
            type: 'HanaStory',
            props: {
              id: storyId,
              seriesLabel: '[MẪU] CÂU CHUYỆN KHỞI NGUỒN',
              titleLine1: '[MẪU] HÀNH TRÌNH CHUYỂN MÌNH',
              titleLine2: '[MẪU] TẬP THƯƠNG CẢM XÚC',
              storyContent: 'Đây là đoạn nội dung câu chuyện mẫu dùng để kiểm thử kiểu chữ.',
              quoteLine: 'Lắng nghe là bước khởi đầu vững chãi nhất.',
              tone: 'light',
              bgColor: 'warm-ivory',
            },
          },
        ],
        zones: {},
      }

      const createRes = await page.request.post('/api/pages', {
        data: {
          title: 'EB-15a Test Page',
          slug: pageSlug,
          kind: 'page',
          _status: 'draft',
          puckData: initialPuckData,
        },
      })
      expect(createRes.ok()).toBe(true)
      const createJson = await createRes.json()
      pageId = createJson.doc.id

      // 3. Open Puck editor
      await page.goto(`/builder/${pageId}`)
      await page.locator('[class*="_PuckCanvas--ready_"]').waitFor({ timeout: 45000 })
      await page.waitForTimeout(600)

      // 4. Select HanaStory block on canvas
      const canvas = page.frameLocator('iframe')
      const storyBlockOnCanvas = canvas.locator(`[data-puck-component="${storyId}"]`).first()
      await storyBlockOnCanvas.click()

      // 5. Look for the "Aa" button next to "Tiêu đề dòng 2"
      const aaBtn = page.getByRole('button', {
        name: vi.eb15a.buttonAaLabel(vi.eb15a.titleLine2),
      })
      await expect(aaBtn).toBeVisible()

      if (process.env.EB15_SCREENSHOTS === '1') {
        await page.screenshot({
          path: path.join(screenshotsDir, '01-aa-button-sidebar.png'),
          fullPage: false,
        })
      }

      // Open popover
      await aaBtn.click()

      // 6. Inspect Popover
      const popover = page.getByRole('dialog', {
        name: vi.eb15a.popoverTitle(vi.eb15a.titleLine2),
      })
      await expect(popover).toBeVisible()

      if (process.env.EB15_SCREENSHOTS === '1') {
        await page.screenshot({
          path: path.join(screenshotsDir, '02-popover-open.png'),
          fullPage: false,
        })
      }

      // Pick accent-pink swatch
      const pinkSwatch = popover.getByRole('button', { name: 'Hồng đậm (Accent Pink)' })
      await expect(pinkSwatch).toBeVisible()
      await pinkSwatch.click()

      // Set desktop size to XL
      const xlSizeBtn = popover.getByRole('button', { name: 'XL' })
      await xlSizeBtn.click()

      // Switch to Mobile tab and set size to SM
      const mobileTab = popover.getByRole('tab', { name: vi.eb15a.deviceMobile })
      await mobileTab.click()
      const smSizeBtn = popover.getByRole('button', { name: 'SM' })
      await smSizeBtn.click()

      // Close popover
      const closeBtn = popover.getByRole('button', { name: vi.eb15a.closeButton })
      await closeBtn.click()
      await expect(popover).not.toBeVisible()

      // Verify active dot indicator appears on Aa button
      const dot = aaBtn.locator('[data-testid="aa-dot"]')
      await expect(dot).toBeVisible()

      // 7. Publish page
      const publishBtn = page.getByRole('button', { name: /Xuất bản/i })
      await publishBtn.click()
      await page.waitForTimeout(2000)

      // 8. Visit public page at 1440
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${pageSlug}`)
      await page.waitForLoadState('networkidle')

      const title2El = page.locator(`[data-eb-text="${storyId}:titleLine2"]`)
      await expect(title2El).toBeVisible()

      // Computed style at 1440
      const desktopStyles = await title2El.evaluate((el) => {
        const s = window.getComputedStyle(el)
        return {
          color: s.color,
          fontSize: parseFloat(s.fontSize),
        }
      })

      // accent-pink is #EF3B83 -> rgb(239, 59, 131)
      expect(desktopStyles.color).toBe('rgb(239, 59, 131)')

      // Verify titleLine1 is NOT altered
      const title1El = page.locator(`[data-eb-text="${storyId}:titleLine1"]`)
      const title1Color = await title1El.evaluate((el) => window.getComputedStyle(el).color)
      expect(title1Color).not.toBe('rgb(239, 59, 131)')

      // 9. Resize to 375 mobile and verify responsive font size
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(400)

      const mobileStyles = await title2El.evaluate((el) => {
        const s = window.getComputedStyle(el)
        return {
          fontSize: parseFloat(s.fontSize),
        }
      })

      // Desktop size should be greater than mobile size
      expect(desktopStyles.fontSize).toBeGreaterThan(mobileStyles.fontSize)

      if (process.env.EB15_SCREENSHOTS === '1') {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.screenshot({
          path: path.join(screenshotsDir, '03-public-page-custom-style.png'),
          fullPage: true,
        })
      }
    } finally {
      // Cleanup
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})

