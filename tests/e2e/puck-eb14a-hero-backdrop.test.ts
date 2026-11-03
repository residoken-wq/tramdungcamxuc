import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Response } from './fixtures'

test.describe('EB-14a: Hero Backdrop Layout (HeroTwoEntries & HeroImage)', () => {
  test('configures backdrop layout in Puck editor, verifies WCAG AA contrast, bounding boxes, clickability, and legacy split layout', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs on desktop-1440 project.')
    test.setTimeout(240000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    const email = `eb14a-${randomUUID()}@example.test`
    const password = randomUUID()

    const slugBackdrop = `e2e-hero-backdrop-${randomUUID().slice(0, 8)}`
    const slugLegacy = `e2e-hero-legacy-${randomUUID().slice(0, 8)}`
    const slugLight = `e2e-hero-light-${randomUUID().slice(0, 8)}`

    const heroId = `eb14a-hero-${randomUUID().slice(0, 8)}`
    const legacyHeroId = `eb14a-legacy-${randomUUID().slice(0, 8)}`
    const lightHeroId = `eb14a-light-${randomUUID().slice(0, 8)}`

    const mediaAlt = `[MẪU] Ảnh nền Hero E2E - ${randomUUID().slice(0, 8)}`
    const legacyMediaAlt = `[MẪU] Ảnh Hero Cũ - ${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined
    let mediaId: string | number | undefined
    let mediaUrl: string = ''

    const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots/eb14')
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }

    // 1x1 valid PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    )

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

      // 2. Upload sample media with [MẪU] alt
      const uploadRes = await page.request.post('/api/media', {
        multipart: {
          _payload: JSON.stringify({ alt: mediaAlt }),
          file: {
            name: `eb14a-sample-${randomUUID().slice(0, 8)}.png`,
            mimeType: 'image/png',
            buffer: pngBuffer,
          },
        },
      })
      expect(uploadRes.ok()).toBe(true)
      const uploadData = await uploadRes.json()
      mediaId = uploadData.doc?.id || uploadData.id
      mediaUrl = uploadData.doc?.url || uploadData.url || ''
      expect(mediaId).toBeDefined()

      // 3. Create draft page with HeroTwoEntries (initially in split layout)
      const createPage = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E Hero Backdrop Page',
          slug: slugBackdrop,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HeroTwoEntries',
                props: {
                  id: heroId,
                  version: 4,
                  layout: 'split',
                  titleLine1: '[MẪU] TRẠM DỪNG CẢM XÚC',
                  titleLine2: 'ĐỒNG HÀNH CHUYỂN HÓA',
                  emotionLine: '[MẪU] Dừng lại để thấu hiểu chính mình',
                  description: '[MẪU] Không gian thực hành an toàn cho nội tâm',
                  mediaId: '',
                  imageUrl: '',
                  imageAlt: '',
                  bgColor: 'warm-ivory',
                  entries: [
                    {
                      type: 'EntryCard',
                      props: {
                        id: `${heroId}-entry-0`,
                        version: 1,
                        groupLabel: 'CÁ NHÂN',
                        label: '[MẪU] Cá nhân',
                        description: '[MẪU] Lộ trình thấu cảm và vững vàng nội tâm',
                        buttonText: 'Khám phá ngay',
                        buttonLink: '/lo-trinh-chuyen-minh',
                        buttonStyle: 'solid',
                        badgeColor: 'soft-pink',
                      },
                    },
                    {
                      type: 'EntryCard',
                      props: {
                        id: `${heroId}-entry-1`,
                        version: 1,
                        groupLabel: 'DOANH NGHIỆP',
                        label: '[MẪU] Tổ chức',
                        description: '[MẪU] Nâng cao năng lực thấu cảm cho đội ngũ',
                        buttonText: 'Tìm hiểu thêm',
                        buttonLink: '/doanh-nghiep',
                        buttonStyle: 'outline',
                        badgeColor: 'lavender-mist',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E Hero Backdrop Page' } },
          },
        },
      })
      expect(createPage.ok()).toBe(true)
      pageId = (await createPage.json()).doc.id
      expect(pageId).toBeDefined()

      // 4. Create legacy published page with HeroTwoEntries version 3 (no layout prop)
      const createLegacy = await page.request.post('/api/pages', {
        data: {
          title: '[MẪU] E2E Legacy Hero Page',
          slug: slugLegacy,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'HeroTwoEntries',
                props: {
                  id: legacyHeroId,
                  version: 3,
                  titleLine1: '[MẪU] HERO CŨ TRƯỚC EB14',
                  titleLine2: 'ẢNH BÊN CẠNH CHỮ',
                  emotionLine: '[MẪU] Dữ liệu di sản',
                  description: '[MẪU] Bố cục 2 cột truyền thống',
                  mediaId: String(mediaId),
                  imageUrl: mediaUrl,
                  imageAlt: legacyMediaAlt,
                  bgColor: 'warm-ivory',
                  entries: [
                    {
                      type: 'EntryCard',
                      props: {
                        id: `${legacyHeroId}-e1`,
                        version: 1,
                        groupLabel: 'CÁ NHÂN',
                        label: '[MẪU] Lối vào di sản',
                        description: '[MẪU] Giữ nguyên hiển thị y hệt trước đây',
                        buttonText: 'Bấm thử',
                        buttonLink: '#',
                        buttonStyle: 'solid',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E Legacy Hero Page' } },
          },
        },
      })
      expect(createLegacy.ok()).toBe(true)

      // 5. Create a published Light Backdrop page for screenshots & assertions
      const createLight = await page.request.post('/api/pages', {
        data: {
          title: '[MẪU] E2E Light Backdrop Hero Page',
          slug: slugLight,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'HeroTwoEntries',
                props: {
                  id: lightHeroId,
                  version: 4,
                  layout: 'backdrop',
                  overlayTone: 'light',
                  overlayStrength: 'lg',
                  imageBlur: 'none',
                  imagePosition: 'center',
                  contentAlign: 'center',
                  minHeight: 'lg',
                  titleLine1: '[MẪU] PHỦ SÁNG WARM-IVORY',
                  titleLine2: 'CHỮ TÍM THAN NỔI BẬT',
                  emotionLine: '[MẪU] Lớp phủ ngà ấm áp',
                  description: '[MẪU] Kiểm tra độ tương phản sáng',
                  mediaId: String(mediaId),
                  imageUrl: mediaUrl,
                  imageAlt: mediaAlt,
                  bgColor: 'warm-ivory',
                  entries: [
                    {
                      type: 'EntryCard',
                      props: {
                        id: `${lightHeroId}-e1`,
                        version: 1,
                        label: '[MẪU] Lối vào sáng',
                        description: '[MẪU] Thẻ lối vào trên nền sáng',
                        buttonText: 'Bấm ngay',
                        buttonLink: '#',
                        buttonStyle: 'solid',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: '[MẪU] E2E Light Backdrop Hero Page' } },
          },
        },
      })
      expect(createLight.ok()).toBe(true)

      // --- IN-EDITOR INTERACTION ---
      // 6. Open builder for the draft page
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
      await page.waitForTimeout(600)

      const canvas = page.frameLocator('iframe')
      const heroBlock = canvas.locator(`[data-puck-component="${heroId}"]`)
      await expect(heroBlock).toBeVisible()

      // Click hero block on canvas to select it
      await heroBlock.click()
      await page.waitForTimeout(400)

      // Switch to Content tab if needed
      const contentTab = page.getByRole('tab', { name: 'Nội dung', exact: true })
      if (await contentTab.isVisible()) {
        await contentTab.click()
      }

      // Change layout to "Ảnh làm nền, chữ nằm trên ảnh" (backdrop)
      const layoutSelect = page.locator('select[name="layout"]')
      await expect(layoutSelect).toBeVisible()
      await layoutSelect.selectOption('backdrop')

      // Select media via media modal
      const chooseMediaButton = page.getByRole('button', {
        name: /Chọn ảnh từ thư viện media/i,
      })
      await expect(chooseMediaButton).toBeVisible()
      await chooseMediaButton.click()

      const mediaRow = page.locator('tbody tr').filter({ hasText: mediaAlt, visible: true })
      await expect(mediaRow.first()).toBeVisible({ timeout: 10000 })
      await mediaRow.first().click()

      // Select "Phủ tối", "Đậm", "Mờ nhẹ"
      const overlayToneSelect = page.locator('select[name="overlayTone"]')
      await expect(overlayToneSelect).toBeVisible()
      await overlayToneSelect.selectOption('dark')

      const overlayStrengthSelect = page.locator('select[name="overlayStrength"]')
      await expect(overlayStrengthSelect).toBeVisible()
      await overlayStrengthSelect.selectOption('lg')

      const imageBlurSelect = page.locator('select[name="imageBlur"]')
      await expect(imageBlurSelect).toBeVisible()
      await imageBlurSelect.selectOption('sm')

      // Edit title on canvas (contentEditable check)
      const titleLine1Span = canvas.locator('h1 span').first()
      await expect(titleLine1Span).toBeVisible()
      await titleLine1Span.click()

      // Publish the page
      const publishBtn = page.getByRole('button', { name: 'Xuất bản', exact: true })
      await expect(publishBtn).toBeVisible()
      await publishBtn.click()

      await expect(
        page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' }),
      ).toBeVisible({ timeout: 20000 })

      // --- PUBLIC PAGE VERIFICATION: DARK BACKDROP (1440 & 375) ---
      // 7. Verify at 1440
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${slugBackdrop}`, { waitUntil: 'domcontentloaded' })

      const darkSection = page.locator('section[data-bg="deep-navy"]').first()
      await expect(darkSection).toBeVisible()

      const heroImg = darkSection.locator('img').first()
      const titleH1 = darkSection.locator('h1').first()

      const imgBox = await heroImg.boundingBox()
      const titleBox = await titleH1.boundingBox()

      expect(imgBox).toBeTruthy()
      expect(titleBox).toBeTruthy()

      // Image bounding box contains title bounding box
      expect(imgBox!.x).toBeLessThanOrEqual(titleBox!.x)
      expect(imgBox!.y).toBeLessThanOrEqual(titleBox!.y)
      expect(imgBox!.x + imgBox!.width).toBeGreaterThanOrEqual(titleBox!.x + titleBox!.width)
      expect(imgBox!.y + imgBox!.height).toBeGreaterThanOrEqual(titleBox!.y + titleBox!.height)

      // Title line 1 color is white: rgb(255, 255, 255)
      const titleColor = await titleH1
        .locator('span')
        .first()
        .evaluate((el) => window.getComputedStyle(el).color)
      expect(titleColor).toBe('rgb(255, 255, 255)')

      // Buttons / entry cards are clickable and not blocked by overlay
      const firstEntryBtn = darkSection.locator('a, button').first()
      await expect(firstEntryBtn).toBeVisible()
      const isClickable = await firstEntryBtn.evaluate((el) => {
        const rect = el.getBoundingClientRect()
        const pt = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        return el === pt || el.contains(pt)
      })
      expect(isClickable).toBe(true)

      // Screenshot 1: Dark backdrop 1440
      await page.screenshot({
        path: path.join(screenshotsDir, 'backdrop-toi-1440.png'),
        fullPage: false,
      })

      // 8. Verify at 375 mobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload({ waitUntil: 'domcontentloaded' })

      const mobileDarkSection = page.locator('section[data-bg="deep-navy"]').first()
      await expect(mobileDarkSection).toBeVisible()

      // Screenshot 2: Dark backdrop 375
      await page.screenshot({
        path: path.join(screenshotsDir, 'backdrop-toi-375.png'),
        fullPage: false,
      })

      // --- PUBLIC PAGE VERIFICATION: LIGHT BACKDROP (1440 & 375) ---
      // 9. Light backdrop at 1440
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${slugLight}`, { waitUntil: 'domcontentloaded' })

      const lightSection = page.locator('section[data-bg="warm-ivory"]').first()
      await expect(lightSection).toBeVisible()

      const lightTitleH1 = lightSection.locator('h1').first()
      const lightTitleColor = await lightTitleH1
        .locator('span')
        .first()
        .evaluate((el) => window.getComputedStyle(el).color)
      // deep-navy is rgb(40, 10, 96)
      expect(lightTitleColor).toBe('rgb(40, 10, 96)')

      // Screenshot 3: Light backdrop 1440
      await page.screenshot({
        path: path.join(screenshotsDir, 'backdrop-sang-1440.png'),
        fullPage: false,
      })

      // 10. Light backdrop at 375
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload({ waitUntil: 'domcontentloaded' })

      // Screenshot 4: Light backdrop 375
      await page.screenshot({
        path: path.join(screenshotsDir, 'backdrop-sang-375.png'),
        fullPage: false,
      })

      // --- PUBLIC PAGE VERIFICATION: LEGACY SPLIT HERO (1440) ---
      // 11. Legacy page renders split layout (image beside text)
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${slugLegacy}`, { waitUntil: 'domcontentloaded' })

      const legacySection = page.locator('section').first()
      await expect(legacySection).toBeVisible()

      // In split layout, the 12-column grid is present
      const splitGrid = legacySection.locator('.lg\\:grid-cols-12').first()
      await expect(splitGrid).toBeVisible()

      const legacyImg = legacySection.locator('img').first()
      const legacyTitle = legacySection.locator('h1').first()

      const legacyImgBox = await legacyImg.boundingBox()
      const legacyTitleBox = await legacyTitle.boundingBox()

      expect(legacyImgBox).toBeTruthy()
      expect(legacyTitleBox).toBeTruthy()

      // In split layout, image is in the right column (col-span-5) to the right of title (col-span-7)
      expect(legacyImgBox!.x).toBeGreaterThan(legacyTitleBox!.x)

      // Screenshot 5: Legacy split 1440
      await page.screenshot({
        path: path.join(screenshotsDir, 'split-cu-1440.png'),
        fullPage: false,
      })

      // --- PUBLIC PAGE VERIFICATION: SECTION 1.6 (ROWS & TEXT-COLUMN) ---
      const slugRows = `e2e-hero-rows-${randomUUID().slice(0, 8)}`
      const rowsHeroId = `eb14a-rows-${randomUUID().slice(0, 8)}`
      await page.request.post('/api/pages', {
        data: {
          title: '[MẪU] E2E Hero Rows Page',
          slug: slugRows,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'HeroTwoEntries',
                props: {
                  id: rowsHeroId,
                  version: 4,
                  layout: 'split',
                  entriesLayout: 'rows',
                  entriesPlacement: 'textColumn',
                  titleLine1: '[MẪU] HÀNG TRÊN DƯỚI',
                  titleLine2: 'TRONG CỘT CHỮ',
                  description: '[MẪU] Mô tả cột chữ bên trái',
                  imageUrl: mediaUrl || 'https://example.com/sample.png',
                  imageAlt: mediaAlt,
                  bgColor: 'warm-ivory',
                  entries: [
                    {
                      type: 'EntryCard',
                      props: {
                        id: 'row-card-1',
                        groupLabel: 'CHO CÁ NHÂN',
                        description: 'Phát triển Năng lực & Sự nghiệp',
                        buttonText: 'KHÁM PHÁ CÁC LỘ TRÌNH',
                        buttonLink: '/ca-nhan',
                        buttonStyle: 'solid',
                      },
                    },
                    {
                      type: 'EntryCard',
                      props: {
                        id: 'row-card-2',
                        groupLabel: 'CHO DOANH NGHIỆP',
                        description: 'Giải pháp EQ cho đội ngũ',
                        buttonText: 'TÌM HIỂU THÊM',
                        buttonLink: '/doanh-nghiep',
                        buttonStyle: 'outline',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: 'E2E Hero Rows Page' } },
            zones: {},
          },
        },
      })

      // 12. Rows & text-column at 1440
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${slugRows}`, { waitUntil: 'domcontentloaded' })

      const rowsSection = page.locator('section').first()
      await expect(rowsSection).toBeVisible()

      const cards = rowsSection.locator(
        '[data-entries-layout="rows"] > * > div, [data-entries-layout="rows"] .rounded-card',
      )
      const card1 = cards.first()
      const card2 = cards.nth(1)

      const box1 = await card1.boundingBox()
      const box2 = await card2.boundingBox()
      const img1440 = rowsSection.locator('img').first()
      const imgBox1440 = await img1440.boundingBox()

      if (box1 && box2 && imgBox1440) {
        // thẻ 2 nằm dưới thẻ 1 (box2.y >= box1.y + box1.height - tolerance), cùng x (within 5px)
        expect(box2.y).toBeGreaterThanOrEqual(box1.y + box1.height - 5)
        expect(Math.abs(box2.x - box1.x)).toBeLessThanOrEqual(5)

        // 2 thẻ nằm bên trái ảnh (card.x + card.width <= image.x + tolerance)
        expect(box1.x + box1.width).toBeLessThanOrEqual(imgBox1440.x + 5)
        expect(box2.x + box2.width).toBeLessThanOrEqual(imgBox1440.x + 5)

        // nút của thẻ nằm bên phải chữ của thẻ, cùng hàng (btn.x > text.x)
        const btn1 = card1.locator('a, button').first()
        const text1 = card1.locator('p').first()
        const btnBox1 = await btn1.boundingBox()
        const textBox1 = await text1.boundingBox()
        if (btnBox1 && textBox1) {
          expect(btnBox1.x).toBeGreaterThan(textBox1.x)
        }
      }

      await page.screenshot({
        path: path.join(screenshotsDir, 'rows-text-column-1440.png'),
        fullPage: false,
      })

      // 13. Rows & text-column at 375: nút nằm dưới chữ
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload({ waitUntil: 'domcontentloaded' })

      const mobileCard1 = rowsSection.locator('.rounded-card').first()
      const mobileBtn1 = mobileCard1.locator('a, button').first()
      const mobileText1 = mobileCard1.locator('p').first()
      const mobileBtnBox = await mobileBtn1.boundingBox()
      const mobileTextBox = await mobileText1.boundingBox()
      if (mobileBtnBox && mobileTextBox) {
        // nút nằm dưới chữ
        expect(mobileBtnBox.y).toBeGreaterThan(mobileTextBox.y)
      }

      await page.screenshot({
        path: path.join(screenshotsDir, 'rows-text-column-375.png'),
        fullPage: false,
      })
    } finally {
      // Clean up test pages and media
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (mediaId) {
        await page.request.delete(`/api/media/${mediaId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
