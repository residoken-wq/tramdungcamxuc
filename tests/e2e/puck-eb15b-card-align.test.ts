import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

test.describe('EB-15b: Căn lề icon / nút / nhãn trong thẻ và khung lưới', () => {
  test('căn lề icon và văn bản đồng nhất khi dùng tab Kiểu hoặc field Căn lề của khung lưới', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs on desktop-1440 project.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const email = `eb15b-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-card-align-${randomUUID().slice(0, 8)}`
    const gridId = `eb15b-grid-${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined

    const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots/eb15')
    if (process.env.EB15_SCREENSHOTS === '1' && !fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }

    try {
      // 1. Admin bootstrap with retry
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
      await expect(page).toHaveURL(/\/admin\/?$/)

      const meRes = await page.request.get('/api/users/me')
      if (meRes.ok()) {
        const meJson = await meRes.json()
        userId = meJson?.user?.id
      }

      // 2. Create test page with IconCardGrid containing 3 cards:
      // Card 0: align='left' (default)
      // Card 1: align='center'
      // Card 2: align='left'
      const initialPuckData = {
        root: { props: { title: 'EB-15b Card Alignment Test' } },
        content: [
          {
            type: 'IconCardGrid',
            props: {
              id: gridId,
              seriesLabel: '[MẪU] BỘ CÔNG CỤ',
              titleLine1: '[MẪU] RÈN LUYỆN CẢM XÚC',
              titleLine2: '[MẪU] MỖI NGÀY MỘT BƯỚC',
              cardAlign: 'inherit',
              cards: [
                {
                  icon: 'heart',
                  title: 'Thẻ 1 Mặc định Trái',
                  text: 'Nội dung mô tả thẻ một để kiểm tra căn lề trái.',
                  align: 'left',
                },
                {
                  icon: 'sparkles',
                  title: 'Thẻ 2 Căn Giữa Riêng',
                  text: 'Nội dung mô tả thẻ hai để kiểm tra căn lề giữa riêng.',
                  align: 'center',
                },
                {
                  icon: 'leaf',
                  title: 'Thẻ 3 Mặc định Trái',
                  text: 'Nội dung mô tả thẻ ba để kiểm tra căn lề trái.',
                  align: 'left',
                },
              ],
            },
          },
        ],
        zones: {},
      }

      const createRes = await page.request.post('/api/pages', {
        data: {
          title: 'EB-15b Card Alignment Test',
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

      // -------------------------------------------------------------
      // CÁCH 1: Tab Kiểu -> Căn chữ: Giữa trên IconCardGrid
      // -------------------------------------------------------------
      const canvas = page.frameLocator('iframe')
      const gridOnCanvas = canvas.locator(`[data-puck-component="${gridId}"]`).first()
      await gridOnCanvas.click()

      // Switch to tab "Kiểu" in Puck sidebar
      const styleTab = page
        .getByRole('tab', { name: /Kiểu|Style/i })
        .or(page.locator('button').filter({ hasText: /^Kiểu$/ }))
      if (await styleTab.isVisible()) {
        await styleTab.click()
        // Find text align center option in Style tab
        const alignCenterBtn = page
          .getByRole('button', { name: /Giữa|Center/i })
          .or(page.locator('[data-testid="text-align-center"]'))
        if (await alignCenterBtn.first().isVisible()) {
          await alignCenterBtn.first().click()
        }
      }

      // Publish page
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 15000,
      })

      // Check on public page at 1440 desktop
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${pageSlug}`)
      await page.waitForLoadState('networkidle')

      // Card 1 (align='center') verification:
      // The icon and title must be centered with each other (delta <= 2px)
      // and centered within card (delta <= 2px)
      const cards = page.locator('article, .rounded-2xl')
      const cardCenter = cards.nth(1)
      const iconWrap = cardCenter.locator('.w-full.self-stretch').first()
      const icon = iconWrap.locator('svg').first()
      const title = cardCenter.locator('h3').first()

      const iconBox = await icon.boundingBox()
      const titleBox = await title.boundingBox()
      const cardBox = await cardCenter.boundingBox()

      expect(iconBox).toBeTruthy()
      expect(titleBox).toBeTruthy()
      expect(cardBox).toBeTruthy()

      if (iconBox && titleBox && cardBox) {
        const iconCenterX = iconBox.x + iconBox.width / 2
        const titleCenterX = titleBox.x + titleBox.width / 2
        const cardCenterX = cardBox.x + cardBox.width / 2

        expect(Math.abs(iconCenterX - titleCenterX)).toBeLessThanOrEqual(2)
        expect(Math.abs(titleCenterX - cardCenterX)).toBeLessThanOrEqual(2)
      }

      // Card 0 (align='left') verification:
      // When align='left', icon stays left-aligned
      const cardLeft = cards.nth(0)
      const leftIconWrap = cardLeft.locator('.w-full.self-stretch').first()
      const leftIcon = leftIconWrap.locator('svg').first()
      const leftCardBox = await cardLeft.boundingBox()
      const leftIconBox = await leftIcon.boundingBox()

      expect(leftCardBox).toBeTruthy()
      expect(leftIconBox).toBeTruthy()
      if (leftCardBox && leftIconBox) {
        // Left icon should be positioned near left edge of card (accounting for card padding)
        expect(leftIconBox.x - leftCardBox.x).toBeLessThan(50)
      }

      // Check on public page at 375 mobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(400)

      const mobileCardBox = await cardCenter.boundingBox()
      const mobileIconBox = await icon.boundingBox()
      const mobileTitleBox = await title.boundingBox()

      if (mobileCardBox && mobileIconBox && mobileTitleBox) {
        const mobileIconCenterX = mobileIconBox.x + mobileIconBox.width / 2
        const mobileTitleCenterX = mobileTitleBox.x + mobileTitleBox.width / 2
        const mobileCardCenterX = mobileCardBox.x + mobileCardBox.width / 2

        expect(Math.abs(mobileIconCenterX - mobileTitleCenterX)).toBeLessThanOrEqual(2)
        expect(Math.abs(mobileTitleCenterX - mobileCardCenterX)).toBeLessThanOrEqual(2)
      }

      // -------------------------------------------------------------
      // CÁCH 2: Khung lưới "Căn lề tất cả thẻ: Giữa"
      // -------------------------------------------------------------
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/builder/${pageId}`)
      await page.locator('[class*="_PuckCanvas--ready_"]').waitFor({ timeout: 45000 })
      await page.waitForTimeout(600)

      const gridBlock = canvas.locator(`[data-puck-component="${gridId}"]`).first()
      await gridBlock.click()

      // Switch back to Content tab if in Style tab
      const contentTab = page
        .getByRole('tab', { name: /Nội dung|Content/i })
        .or(page.locator('button').filter({ hasText: /^Nội dung$/ }))
      if (await contentTab.isVisible()) {
        await contentTab.click()
      }

      // Set "Căn lề tất cả thẻ" to "Giữa"
      const gridAlignSelect = page.getByRole('combobox', {
        name: vi.eb15b.gridCardAlign,
      })
      if (await gridAlignSelect.isVisible()) {
        await gridAlignSelect.selectOption('center')
      }

      // Publish page
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 15000,
      })

      // Verify on public page at 1440 - all 3 cards should now be centered
      await page.goto(`/${pageSlug}`)
      await page.waitForLoadState('networkidle')

      const allCards = page.locator('article, .rounded-2xl')
      const firstCard = allCards.nth(0)
      const firstIconWrap = firstCard.locator('.w-full.self-stretch').first()
      const firstIcon = firstIconWrap.locator('svg').first()
      const firstTitle = firstCard.locator('h3').first()

      const firstIconBox = await firstIcon.boundingBox()
      const firstTitleBox = await firstTitle.boundingBox()
      const firstCardBox = await firstCard.boundingBox()

      if (firstIconBox && firstTitleBox && firstCardBox) {
        const cX1 = firstIconBox.x + firstIconBox.width / 2
        const cX2 = firstTitleBox.x + firstTitleBox.width / 2
        const cXCard = firstCardBox.x + firstCardBox.width / 2

        expect(Math.abs(cX1 - cX2)).toBeLessThanOrEqual(2)
        expect(Math.abs(cX2 - cXCard)).toBeLessThanOrEqual(2)
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
