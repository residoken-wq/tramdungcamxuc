import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

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
    const editedTitle = `[MẪU] THỬ ẢNH NỀN ${randomUUID().slice(0, 4).toUpperCase()}`
    const extraPageIds: number[] = []
    const shoot = process.env.EB14_SCREENSHOTS === '1'
    const legacyHeroId = `eb14a-legacy-${randomUUID().slice(0, 8)}`
    const lightHeroId = `eb14a-light-${randomUUID().slice(0, 8)}`

    const mediaAlt = `[MẪU] Ảnh nền Hero E2E - ${randomUUID().slice(0, 8)}`
    const legacyMediaAlt = `[MẪU] Ảnh Hero Cũ - ${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined
    let mediaId: string | number | undefined
    let mediaUrl: string = ''

    const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots/eb14')
    if (process.env.EB14_SCREENSHOTS === '1' && !fs.existsSync(screenshotsDir)) {
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
      extraPageIds.push((await createLegacy.json()).doc.id)

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
      extraPageIds.push((await createLight.json()).doc.id)

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
      const layoutSelect = page.getByRole('combobox', { name: vi.eb14a.layout, exact: true })
      await expect(layoutSelect).toBeVisible()
      await layoutSelect.selectOption({ label: vi.eb14a.layoutOptions.backdrop })

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
      const overlayToneSelect = page.getByRole('combobox', {
        name: vi.eb14a.overlayTone,
        exact: true,
      })
      await expect(overlayToneSelect).toBeVisible()
      await overlayToneSelect.selectOption({ label: vi.eb14a.overlayToneOptions.dark })

      const overlayStrengthSelect = page.getByRole('combobox', {
        name: vi.eb14a.overlayStrength,
        exact: true,
      })
      await expect(overlayStrengthSelect).toBeVisible()
      await overlayStrengthSelect.selectOption({ label: vi.eb14a.overlayStrengthOptions.lg })

      const imageBlurSelect = page.getByRole('combobox', { name: vi.eb14a.imageBlur, exact: true })
      await expect(imageBlurSelect).toBeVisible()
      await imageBlurSelect.selectOption({ label: vi.eb14a.imageBlurOptions.sm })

      // Edit title line 1 (QA EB-14ac: the step only clicked it before)
      const titleField = page.getByRole('textbox', { name: /Tiêu đề dòng 1/i })
      await expect(titleField).toBeVisible()
      await titleField.fill(editedTitle)
      await expect(canvas.locator('h1').first()).toContainText(editedTitle)

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
      await expect(titleH1).toContainText(editedTitle)

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
      if (shoot)
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
      if (shoot)
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
      if (shoot)
        await page.screenshot({
          path: path.join(screenshotsDir, 'backdrop-sang-1440.png'),
          fullPage: false,
        })

      // 10. Light backdrop at 375
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload({ waitUntil: 'domcontentloaded' })

      // Screenshot 4: Light backdrop 375
      if (shoot)
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
      if (shoot)
        await page.screenshot({
          path: path.join(screenshotsDir, 'split-cu-1440.png'),
          fullPage: false,
        })

      // --- SECTION 1.6 THROUGH THE EDITOR: split + rows + text column (QA EB-14ac) ---
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1)
      await page.waitForTimeout(600)
      const canvasRows = page.frameLocator('iframe')
      await canvasRows.locator(`[data-puck-component="${heroId}"]`).click()
      await page.waitForTimeout(400)
      await page
        .getByRole('combobox', { name: vi.eb14a.layout, exact: true })
        .selectOption({ label: vi.eb14a.layoutOptions.split })
      await page
        .getByRole('combobox', { name: vi.eb14a.entriesLayoutLabel, exact: true })
        .selectOption({ label: vi.eb14a.entriesLayoutRows })
      await page
        .getByRole('combobox', { name: vi.eb14a.entriesPlacementLabel, exact: true })
        .selectOption({ label: vi.eb14a.entriesPlacementTextColumn })
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 20000,
      })

      // 1440: cards stacked, inside the text column left of the image, button right of text
      await page.goto(`/${slugBackdrop}`, { waitUntil: 'domcontentloaded' })
      const rowsHero = page.locator('section[data-bg]').filter({ hasText: editedTitle }).first()
      await expect(rowsHero.locator('[data-entries-layout="rows"]')).toBeVisible()
      const rowCards = rowsHero.locator('[data-entries-layout="rows"] .rounded-card')
      await expect(rowCards).toHaveCount(2)
      const box1 = await rowCards.nth(0).boundingBox()
      const box2 = await rowCards.nth(1).boundingBox()
      const rowsImgBox = await rowsHero.locator('img').first().boundingBox()
      expect(box1 && box2 && rowsImgBox).toBeTruthy()
      expect(box2!.y).toBeGreaterThanOrEqual(box1!.y + box1!.height - 1)
      expect(Math.abs(box2!.x - box1!.x)).toBeLessThanOrEqual(2)
      expect(box1!.x + box1!.width).toBeLessThanOrEqual(rowsImgBox!.x + 1)
      const btnBox = await rowCards.nth(0).locator('a').first().boundingBox()
      const textBox = await rowCards.nth(0).locator('p').first().boundingBox()
      expect(btnBox && textBox).toBeTruthy()
      expect(btnBox!.x).toBeGreaterThanOrEqual(textBox!.x + textBox!.width - 1)
      expect(
        Math.abs(btnBox!.y + btnBox!.height / 2 - (textBox!.y + textBox!.height / 2)),
      ).toBeLessThan(24)
      if (shoot)
        await page.screenshot({ path: path.join(screenshotsDir, 'rows-text-column-1440.png') })

      // 375: the button drops below the text
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload({ waitUntil: 'domcontentloaded' })
      const mBtn = await rowCards.nth(0).locator('a').first().boundingBox()
      const mText = await rowCards.nth(0).locator('p').first().boundingBox()
      expect(mBtn && mText).toBeTruthy()
      expect(mBtn!.y).toBeGreaterThanOrEqual(mText!.y + mText!.height - 1)
      if (shoot)
        await page.screenshot({ path: path.join(screenshotsDir, 'rows-text-column-375.png') })
    } finally {
      // Clean up test pages and media
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      for (const id of extraPageIds) {
        await page.request.delete(`/api/pages/${id}`).catch(() => {})
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
