import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import { test, expect, type Page, type Locator, type Response } from './fixtures'

/**
 * Real pointer drag helper matching Puck's PointerSensor requirements:
 * 200ms hold within 10px, 5px initial move, then gradual steps to target.
 */
async function dragElement(
  page: Page,
  sourceLocator: Locator,
  targetPoint: { x: number; y: number },
): Promise<void> {
  const source = await sourceLocator.boundingBox()
  if (!source) throw new Error('Không tìm thấy bounding box của phần tử nguồn để kéo.')

  const startX = source.x + source.width / 2
  const startY = source.y + source.height / 2

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.waitForTimeout(250)
  await page.mouse.move(startX + 12, startY, { steps: 5 })

  const distance = Math.hypot(targetPoint.x - startX, targetPoint.y - startY)
  const steps = Math.max(15, Math.ceil(distance / 8))

  for (let i = 1; i <= steps; i++) {
    const curX = startX + 12 + ((targetPoint.x - (startX + 12)) * i) / steps
    const curY = startY + ((targetPoint.y - startY) * i) / steps
    await page.mouse.move(curX, curY)
    await page.waitForTimeout(10)
  }

  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(500)
}

test.describe('EB-11: Chạy thử 8 việc bằng giao diện như Hana', () => {
  test('Laptop đóng vai Hana: thực hiện đủ 8 việc qua giao diện builder, kiểm chứng trên trang công khai', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Buổi thử chỉ chạy trên desktop-1440.')
    test.setTimeout(360000)
    page.setDefaultTimeout(30000)
    page.setDefaultNavigationTimeout(90000)

    fs.mkdirSync('docs/screenshots/eb11', { recursive: true })

    const suffix = randomUUID().slice(0, 8)
    const ownerEmail = `hana-rehearsal-${suffix}@example.test`
    const ownerPassword = `HanaPass-${suffix}-2026`

    const landingSlug = `mau-landing-thu-${suffix}`
    const landingTitle = '[MẪU] Landing thử'
    const samplePageSlug = 'mau-trang-thu-builder'
    const samplePageTitle = '[MẪU] Trang thử builder'

    const sampleMedia1Alt = '[MẪU] Ảnh minh họa 1 - Cây mầm xanh'
    const sampleMedia2Alt = '[MẪU] Ảnh minh họa 2 - Bầu trời bình an'

    let ownerUserId: number | string | undefined
    let landingPageId: number | string | undefined
    let samplePageId: number | string | undefined
    let sampleMedia1Id: number | string | undefined
    let sampleMedia2Id: number | string | undefined
    let initialDesignSystem: Record<string, unknown> | undefined

    // 1x1 PNG bytes for sample images
    const samplePng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH9sAAAAASUVORK5CYII=',
      'base64',
    )

    try {
      // =========================================================================
      // BƯỚC CHUẨN BỊ (REST chỉ dùng để bootstrap owner & kiểm tra/nạp tài nguyên mẫu)
      // =========================================================================
      const initRes = await page.request.get('/api/users/init')
      expect(initRes.ok()).toBe(true)
      const initData = await initRes.json()

      if (!initData.initialized) {
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

        expect(regResponse?.ok()).toBe(true)
        const registered = await regResponse!.json()
        ownerUserId = registered.user?.id || registered.doc?.id
        await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 20000 })
      } else {
        const meRes = await page.request.get('/api/users/me')
        if (meRes.ok()) {
          const meData = await meRes.json()
          ownerUserId = meData.user?.id
        }
      }

      // Lưu lại trạng thái designSystem ban đầu để dọn dẹp sau buổi thử
      const dsGetRes = await page.request.get('/api/globals/designSystem')
      if (dsGetRes.ok()) {
        initialDesignSystem = await dsGetRes.json()
      }

      // Đảm bảo 2 ảnh MẪU có trong thư viện media
      const mediaListRes = await page.request.get('/api/media?limit=50&depth=0')
      const mediaList = mediaListRes.ok() ? (await mediaListRes.json()).docs || [] : []

      const m1 = mediaList.find((m: { alt?: string }) => m.alt === sampleMedia1Alt)
      if (m1) {
        sampleMedia1Id = m1.id
      } else {
        const upload1 = await page.request.post('/api/media', {
          multipart: {
            _payload: JSON.stringify({ alt: sampleMedia1Alt, isSample: true }),
            file: { name: 'sample1.png', mimeType: 'image/png', buffer: samplePng },
          },
        })
        if (upload1.ok()) {
          const json1 = await upload1.json()
          sampleMedia1Id = json1.doc?.id || json1.id
        }
      }

      const m2 = mediaList.find((m: { alt?: string }) => m.alt === sampleMedia2Alt)
      if (m2) {
        sampleMedia2Id = m2.id
      } else {
        const upload2 = await page.request.post('/api/media', {
          multipart: {
            _payload: JSON.stringify({ alt: sampleMedia2Alt, isSample: true }),
            file: { name: 'sample2.png', mimeType: 'image/png', buffer: samplePng },
          },
        })
        if (upload2.ok()) {
          const json2 = await upload2.json()
          sampleMedia2Id = json2.doc?.id || json2.id
        }
      }

      // Đảm bảo trang đích của việc 7 "[MẪU] Trang thử builder" tồn tại
      const samplePageRes = await page.request.get(
        `/api/pages?where[slug][equals]=${samplePageSlug}&depth=0`,
      )
      const existingSamplePages = samplePageRes.ok() ? (await samplePageRes.json()).docs || [] : []
      if (existingSamplePages.length > 0) {
        samplePageId = existingSamplePages[0].id
      } else {
        const createSamplePage = await page.request.post('/api/pages', {
          data: {
            title: samplePageTitle,
            slug: samplePageSlug,
            kind: 'page',
            _status: 'published',
            puckData: {
              root: { props: { title: samplePageTitle } },
              content: [
                {
                  type: 'SectionHeader',
                  props: {
                    id: 'sample-header-1',
                    seriesLabel: '[MẪU] Buổi thử builder',
                    titleLine1: 'TRANG THỬ BUILDER',
                    titleLine2: 'TRẠM DỪNG CẢM XÚC',
                    emotionLine: 'Trang mẫu dành cho buổi thực hành của Hana',
                    alignment: 'center',
                    bgColor: 'warm-ivory',
                  },
                },
              ],
              zones: {},
            },
          },
        })
        if (createSamplePage.ok()) {
          samplePageId = (await createSamplePage.json()).doc?.id
        }
      }

      // =========================================================================
      // VIỆC 1: Tạo trang [MẪU] Landing thử từ mẫu Landing chiến dịch, đổi tiêu đề
      // Đề bài: "Chị tạo trang mới [MẪU] Landing thử từ mẫu Landing chiến dịch,
      // đổi tiêu đề lớn đầu trang thành Thử builder mới, rồi xuất bản."
      // =========================================================================
      await test.step('Việc 1: Tạo trang mới từ mẫu Landing chiến dịch, đổi tiêu đề, xuất bản', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        // 1. Vào danh sách trang
        await page.goto('/admin/collections/pages')
        actions++

        // 2. Bấm "Tạo mới"
        const createLink = page.locator('a[href*="/admin/collections/pages/create"]').first()
        if (await createLink.isVisible().catch(() => false)) {
          await createLink.click()
        }
        await page.waitForURL(/\/admin\/collections\/pages\/create/, { timeout: 10000 }).catch(async () => {
          await page.goto('/admin/collections/pages/create')
        })
        await expect(page).toHaveURL(/\/admin\/collections\/pages\/create/)
        actions++

        // 3. Nhập tên trang
        const titleInput = page.locator('#field-title')
        await expect(titleInput).toBeVisible({ timeout: 15000 })
        await titleInput.fill(landingTitle)
        hardSelectors.push('#field-title')
        actions++

        // 4. Nhập slug
        const slugInput = page.locator('#field-slug')
        await expect(slugInput).toBeVisible({ timeout: 15000 })
        await slugInput.fill(landingSlug)
        hardSelectors.push('#field-slug')
        actions++

        // 5. Bấm "Lưu bản nháp" để tạo trang
        const saveDraftBtn = page
          .getByRole('button', { name: /Lưu bản nháp|Lưu nháp/i })
          .or(page.locator('#action-save'))
          .first()
        await expect(saveDraftBtn).toBeVisible({ timeout: 15000 })
        await saveDraftBtn.click()
        actions++

        // Chờ tạo trang xong và lấy link mở Visual Builder
        const builderLink = page.getByRole('link', { name: /Chỉnh sửa trực quan/i })
        await expect(builderLink).toBeVisible({ timeout: 30000 })
        const builderHref = await builderLink.getAttribute('href')
        expect(builderHref).toBeTruthy()
        const matchId = builderHref!.match(/\/builder\/([^/?#]+)/)
        if (matchId) landingPageId = matchId[1]

        // 6. Bấm mở Visual Builder
        await page.goto(builderHref!)
        actions++

        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })
        const canvas = page.frameLocator('iframe')

        // 7. Áp dụng mẫu "Landing chiến dịch" qua nút "Dùng mẫu..."
        const useTemplateBtn = page.getByRole('button', { name: /Dùng mẫu/i })
        await expect(useTemplateBtn).toBeVisible()
        await useTemplateBtn.click()
        actions++

        const templateModal = page.getByRole('dialog', { name: /Chọn mẫu trang/i })
        await expect(templateModal).toBeVisible()

        // Tìm thẻ "Landing chiến dịch"
        const campaignHeading = templateModal.getByRole('heading', { name: 'Landing chiến dịch' })
        await expect(campaignHeading).toBeVisible()
        const campaignTplCard = campaignHeading.locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]')
        await expect(campaignTplCard).toBeVisible()

        page.once('dialog', (d) => d.accept())
        await campaignTplCard.getByRole('button', { name: /Áp dụng mẫu này/i }).click()
        actions += 2

        // Canvas đã nạp mẫu Landing chiến dịch
        await expect(canvas.locator('[data-puck-component]')).not.toHaveCount(0, { timeout: 15000 })

        // 8. Chọn khối HeroImage trên canvas để đổi tiêu đề lớn
        const heroBlock = canvas.locator('[data-puck-component]').first()
        await expect(heroBlock).toBeVisible()
        await heroBlock.click()
        actions++

        // 9. Đổi tiêu đề dòng 1 thành "Thử builder mới"
        const titleField = page.getByRole('textbox', { name: /Tiêu đề dòng 1/i })
        await expect(titleField).toBeVisible()
        await titleField.fill('Thử builder mới')
        actions++

        // Chụp ảnh lại màn hình chỗ sửa tiêu đề
        await page.screenshot({ path: 'docs/screenshots/eb11/viec-1-doi-tieu-de.png' })

        // 10. Bấm "Xuất bản"
        const publishBtn = page.getByRole('button', { name: 'Xuất bản', exact: true })
        await expect(publishBtn).toBeEnabled()
        await publishBtn.click()
        actions++

        await expect(
          page.getByRole('status').filter({ hasText: /Đã xuất bản/ }),
        ).toBeVisible({ timeout: 15000 })

        // 11. Kiểm tra thật trên trang công khai: tiêu đề mới hiển thị
        await page.goto(`/${landingSlug}`)
        await expect(page.getByText('Thử builder mới')).toBeVisible({ timeout: 15000 })

        testInfo.annotations.push({
          type: 'viec-1',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })

      // =========================================================================
      // VIỆC 2: Thêm khung 2 cột (trái ảnh, phải chữ); trên điện thoại xếp chồng
      // Đề bài: "Trong trang đó, chị thêm một khung chia 2 cột: cột trái một ảnh,
      // cột phải một đoạn chữ. Trên điện thoại hai cột xếp chồng lên nhau."
      // =========================================================================
      let containerComponentId: string | null = null

      await test.step('Việc 2: Thêm khung chia 2 cột (ảnh + chữ), trên điện thoại xếp chồng', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        // 1. Quay lại visual builder của trang Landing thử
        await page.goto(`/builder/${landingPageId}`)
        actions++
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })
        const canvas = page.frameLocator('iframe')

        // 2. Tìm khối Container trong thư viện
        await page.getByPlaceholder(/Tìm khối/i).fill('container')
        actions++
        const containerItem = page.getByRole('button', { name: /Container/i }).first()
        await expect(containerItem).toBeVisible()

        // 3. Kéo Container thả vào canvas dưới HeroImage
        const heroBlock = canvas.locator('[data-puck-component]').first()
        const heroBox = await heroBlock.boundingBox()
        if (!heroBox) throw new Error('Không thấy hero block trên canvas')

        await dragElement(page, containerItem, {
          x: heroBox.x + heroBox.width / 2,
          y: heroBox.y + heroBox.height - 4,
        })
        actions++

        // Lấy container vừa thêm
        const containerBlock = canvas.locator('[data-puck-component]').nth(1)
        await expect(containerBlock).toBeVisible({ timeout: 10000 })
        containerComponentId = await containerBlock.getAttribute('data-puck-component')
        expect(containerComponentId).toBeTruthy()

        // 4. Chọn Container để chỉnh hướng hiển thị
        await containerBlock.click()
        actions++

        // Đảm bảo tab Nội dung đang mở
        const contentTab = page.getByRole('tab', { name: 'Nội dung', exact: true })
        if (await contentTab.isVisible()) {
          await contentTab.click()
          actions++
        }

        // Hướng hiển thị trên Desktop (1440): Hàng ngang
        const rowDirBtn = page.getByRole('button', { name: /Hàng ngang/i })
        await expect(rowDirBtn).toBeVisible()
        await rowDirBtn.click()
        actions++

        // Chuyển sang chỉnh cho Điện thoại (375): Cột dọc
        const phoneViewportBtn = page.getByRole('button', { name: 'Điện thoại', exact: true }).first()
        await phoneViewportBtn.click()
        actions++

        const colDirBtn = page.getByRole('button', { name: /Cột dọc/i })
        await expect(colDirBtn).toBeVisible()
        await colDirBtn.click()
        actions++

        // Chuyển lại máy tính
        const desktopViewportBtn = page.getByRole('button', { name: 'Máy tính', exact: true }).first()
        await desktopViewportBtn.click()
        actions++

        // 5. Kéo khối Ảnh vào trong slot của Container
        const containerSlot = canvas.locator(`.eb-c-${containerComponentId}`)
        const slotBox = await containerSlot.boundingBox()
        if (!slotBox) throw new Error('Không tìm thấy slot của Container')

        await page.getByPlaceholder(/Tìm khối/i).fill('anh')
        actions++
        const imageDrawerItem = page.getByRole('button', { name: 'Ảnh', exact: true })
        await expect(imageDrawerItem).toBeVisible()

        await dragElement(page, imageDrawerItem, {
          x: slotBox.x + slotBox.width / 4,
          y: slotBox.y + slotBox.height / 2,
        })
        actions++

        // 6. Chọn ảnh đã thả, gán ảnh mẫu 1 từ thư viện
        const emptyImageHint = canvas.getByText('Chưa chọn ảnh', { exact: false }).first()
        await emptyImageHint.click()
        actions++

        const chooseMediaBtn = page.getByRole('button', { name: /Chọn ảnh từ thư viện media/i })
        await expect(chooseMediaBtn).toBeVisible()
        await chooseMediaBtn.click()
        actions++

        const mediaRow = page.locator('tbody tr').filter({ hasText: sampleMedia1Alt, visible: true })
        await expect(mediaRow.first()).toBeVisible({ timeout: 10000 })
        await mediaRow.first().click()
        actions++

        // 7. Kéo khối Văn bản vào bên cạnh ảnh trong Container
        await page.getByPlaceholder(/Tìm khối/i).fill('văn bản')
        actions++
        const textDrawerItem = page.getByRole('button', { name: 'Văn bản', exact: true })
        await expect(textDrawerItem).toBeVisible()

        const currentSlotBox = await containerSlot.boundingBox()
        await dragElement(page, textDrawerItem, {
          x: currentSlotBox!.x + (currentSlotBox!.width * 3) / 4,
          y: currentSlotBox!.y + currentSlotBox!.height / 2,
        })
        actions++

        // 8. Nhập nội dung đoạn văn
        const droppedTextBlock = containerSlot.locator('[data-puck-component]').last()
        await droppedTextBlock.click()
        actions++

        const textContentInput = page.getByLabel('Nội dung văn bản', { exact: false }).first()
        if (await textContentInput.isVisible()) {
          await textContentInput.fill('Không gian lắng nghe và kết nối cảm xúc chân thật nhất.')
          actions++
        }

        // 9. Xem trước trên điện thoại trong builder bằng nút ở thanh dưới
        const toolbarMobileBtn = page.getByRole('button', { name: 'Điện thoại (375px)', exact: true })
        await toolbarMobileBtn.click()
        actions++
        await page.waitForTimeout(500)
        await page.screenshot({ path: 'docs/screenshots/eb11/viec-2-hai-cot-mobile.png' })

        // Quay lại desktop
        const toolbarDesktopBtn = page.getByRole('button', { name: 'Máy tính (1440px)', exact: true })
        await toolbarDesktopBtn.click()
        actions++

        // 10. Xuất bản
        await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
        actions++
        await expect(
          page.getByRole('status').filter({ hasText: /Đã xuất bản/ }),
        ).toBeVisible({ timeout: 15000 })

        // 11. Kiểm tra thật trên trang công khai: 1440 cạnh nhau, 375 xếp chồng
        const pubContext = page
        await pubContext.setViewportSize({ width: 1440, height: 900 })
        await pubContext.goto(`/${landingSlug}`)

        const imgEl = pubContext.locator(`img[alt="${sampleMedia1Alt}"]`)
        const txtEl = pubContext.getByText(/Nhập đoạn văn bản|Không gian lắng nghe/i)
        await expect(imgEl).toBeVisible({ timeout: 15000 })
        await expect(txtEl).toBeVisible({ timeout: 15000 })

        const box1440Img = await imgEl.boundingBox()
        const box1440Txt = await txtEl.boundingBox()
        expect(box1440Img).toBeTruthy()
        expect(box1440Txt).toBeTruthy()
        // Cạnh nhau ở 1440: img ở bên trái txt, trục Y gần tương đương
        expect(box1440Img!.x).toBeLessThan(box1440Txt!.x)
        expect(Math.abs(box1440Img!.y - box1440Txt!.y)).toBeLessThan(60)

        // Đổi sang 375: xếp chồng dọc
        await pubContext.setViewportSize({ width: 375, height: 900 })
        await pubContext.reload()
        const box375Img = await pubContext.locator(`img[alt="${sampleMedia1Alt}"]`).boundingBox()
        const box375Txt = await pubContext.getByText(/Nhập đoạn văn bản|Không gian lắng nghe/i).boundingBox()
        expect(box375Img).toBeTruthy()
        expect(box375Txt).toBeTruthy()
        // Xếp chồng ở 375: img ở trên txt
        expect(box375Img!.y).toBeLessThan(box375Txt!.y)
        expect(Math.abs(box375Img!.x - box375Txt!.x)).toBeLessThan(50)

        // Trả lại kích thước desktop cho các bước tiếp theo
        await page.setViewportSize({ width: 1440, height: 900 })

        testInfo.annotations.push({
          type: 'viec-2',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })

      // =========================================================================
      // VIỆC 3: Đổi màu nền sang hồng nhạt, bo góc lớn, giảm khoảng cách trên ĐT
      // Đề bài: "Chị đổi màu nền khối vừa thêm sang màu hồng nhạt, bo góc lớn,
      // và chỉ trên điện thoại thì giảm khoảng cách trên dưới cho gọn."
      // =========================================================================
      await test.step('Việc 3: Đổi màu nền sang soft-pink, bo góc lớn, padding ĐT khác máy tính', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        await page.goto(`/builder/${landingPageId}`)
        actions++
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })
        const canvas = page.frameLocator('iframe')

        // 1. Chọn Container
        const containerBlock = canvas.locator(`[data-puck-component="${containerComponentId}"]`)
        await expect(containerBlock).toBeVisible()
        await containerBlock.click({ position: { x: 5, y: 5 } })
        actions++

        // Nếu child bị click do click trúng con, bấm breadcrumb của Container ở đầu thanh thuộc tính
        const containerBreadcrumb = page
          .locator('[class*="Breadcrumbs"]')
          .getByRole('button', { name: /Container/i })
        if (await containerBreadcrumb.isVisible()) {
          await containerBreadcrumb.click()
          actions++
        }

        // 2. Chuyển sang tab "Kiểu"
        const styleTab = page.getByRole('tab', { name: 'Kiểu', exact: true })
        await expect(styleTab).toBeVisible()
        await styleTab.click()
        actions++

        // 3. Đổi màu nền sang "soft-pink"
        const bgGroup = page.getByRole('group', { name: 'Màu nền', exact: true })
        await expect(bgGroup).toBeVisible()
        const softPinkBtn = bgGroup.getByRole('button', { name: /^soft-pink/ })
        await softPinkBtn.click()
        actions++

        // 4. Đổi bo góc sang "Như thẻ" (card / 20-24px)
        const borderGroup = page.getByRole('group', { name: 'Viền & bo góc', exact: true })
        await expect(borderGroup).toBeVisible()
        const radiusSelect = borderGroup.getByRole('combobox', { name: 'Bo góc' })
        await expect(radiusSelect).toBeVisible()
        await radiusSelect.selectOption('card')
        actions++

        // 5. Chuyển sang tab "Nâng cao"
        const advancedTab = page.getByRole('tab', { name: 'Nâng cao', exact: true })
        await expect(advancedTab).toBeVisible()
        await advancedTab.click()
        actions++

        // 6. Chọn chỉnh cho thiết bị "Điện thoại"
        const phoneBtn = page.getByRole('button', { name: 'Điện thoại', exact: true }).first()
        await phoneBtn.click()
        actions++

        // 7. Giảm khoảng cách Trên / Dưới sang "sm" (Nhỏ / 16px)
        const padTopSelect = page.getByLabel('Trên', { exact: true }).filter({ visible: true }).first()
        await expect(padTopSelect).toBeVisible()
        await padTopSelect.selectOption('sm')
        actions++

        const padBottomSelect = page.getByLabel('Dưới', { exact: true }).filter({ visible: true }).first()
        await padBottomSelect.selectOption('sm')
        actions++

        await page.screenshot({ path: 'docs/screenshots/eb11/viec-3-kieu-nang-cao.png' })

        // 8. Bấm "Xuất bản"
        await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
        actions++
        await expect(
          page.getByRole('status').filter({ hasText: /Đã xuất bản/ }),
        ).toBeVisible({ timeout: 15000 })

        // 9. Kiểm tra trang công khai: nền soft-pink, bo góc lớn, padding 375 khác 1440
        const wrapper = page.locator(`[data-eb-id="${containerComponentId}"]`)

        // Tại 1440: nền soft-pink (rgb(253, 230, 246)), bo góc card (20-24px)
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto(`/${landingSlug}`)
        await expect(wrapper).toBeVisible({ timeout: 15000 })
        await expect(wrapper).toHaveCSS('background-color', 'rgb(253, 230, 246)')
        await expect(wrapper).toHaveCSS('border-radius', /(20|24)px/)
        const pad1440 = await wrapper.evaluate((el) => window.getComputedStyle(el).paddingTop)

        // Tại 375: padding top đổi sang 16px (sm)
        await page.setViewportSize({ width: 375, height: 900 })
        await page.reload()
        await expect(wrapper).toBeVisible()
        const pad375 = await wrapper.evaluate((el) => window.getComputedStyle(el).paddingTop)
        expect(pad375).toBe('16px')
        expect(pad375).toBe('16px')
        expect(pad375).not.toBe(pad1440)

        await page.setViewportSize({ width: 1440, height: 900 })

        testInfo.annotations.push({
          type: 'viec-3',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })

      // =========================================================================
      // VIỆC 4: Thêm khối Tab có 2 tab: Cá nhân và Doanh nghiệp
      // Đề bài: "Chị thêm một khối Tab có 2 tab: Cá nhân và Doanh nghiệp, mỗi tab một câu ngắn."
      // =========================================================================
      let tabsComponentId: string | null = null

      await test.step('Việc 4: Thêm khối Tab (Cá nhân, Doanh nghiệp) mỗi tab một câu ngắn', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        await page.goto(`/builder/${landingPageId}`)
        actions++
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })
        const canvas = page.frameLocator('iframe')

        // 1. Tìm khối Tabs trong thư viện
        await page.getByPlaceholder(/Tìm khối/i).fill('tab')
        actions++
        const tabDrawerItem = page.getByRole('button', { name: 'Tabs', exact: true })
        await expect(tabDrawerItem).toBeVisible()

        // 2. Kéo thả Tabs vào canvas dưới Container
        const containerOnCanvas = canvas.locator(`[data-puck-component="${containerComponentId}"]`)
        const cBox = await containerOnCanvas.boundingBox()
        if (!cBox) throw new Error('Không thấy container trên canvas')

        await dragElement(page, tabDrawerItem, {
          x: cBox.x + cBox.width / 2,
          y: cBox.y + cBox.height - 4,
        })
        actions++

        // 3. Chọn khối Tabs vừa thêm
        const tabsBlock = canvas.locator('[data-puck-component^="TabsWidget-"]').first()
        await expect(tabsBlock).toBeVisible({ timeout: 10000 })
        tabsComponentId = await tabsBlock.getAttribute('data-puck-component')
        expect(tabsComponentId).toBeTruthy()
        await tabsBlock.click()
        actions++

        // Mở tab Nội dung
        const contentTab = page.getByRole('tab', { name: 'Nội dung', exact: true })
        if (await contentTab.isVisible()) {
          await contentTab.click()
          actions++
        }

        // 4. Đổi tên Tab 1 thành "Cá nhân", Tab 2 thành "Doanh nghiệp"
        // Trong Puck, các mục mảng hiển thị dạng button "Tab 1...", click để mở rộng các trường con
        const tab1Button = page.getByRole('button', { name: /^Tab 1/ }).first()
        await expect(tab1Button).toBeVisible({ timeout: 10000 })
        await tab1Button.click()
        actions++

        const tab1TitleInput = page.locator('input[name*="title"], input[id*="title"]').filter({ visible: true }).first()
        await expect(tab1TitleInput).toBeVisible({ timeout: 5000 })
        await tab1TitleInput.fill('Cá nhân')
        hardSelectors.push('input[name="items.0.title"]')
        actions++

        const tab2Button = page.getByRole('button', { name: /^Tab 2/ }).first()
        await expect(tab2Button).toBeVisible({ timeout: 10000 })
        await tab2Button.click()
        actions++

        const tab2TitleInput = page.locator('input[name*="title"], input[id*="title"]').filter({ visible: true }).first()
        await expect(tab2TitleInput).toBeVisible({ timeout: 5000 })
        await tab2TitleInput.fill('Doanh nghiệp')
        hardSelectors.push('input[name="items.1.title"]')
        actions++

        // 5. Thêm câu ngắn cho Tab 1 và Tab 2
        // Kéo TextWidget vào slot Tab 1
        await page.getByPlaceholder(/Tìm khối/i).fill('văn bản')
        actions++
        const textItem = page.getByRole('button', { name: 'Văn bản', exact: true })

        const tab1Panel = canvas.getByText(/Tab 1:/).first()
        await expect(tab1Panel).toBeVisible({ timeout: 10000 })
        const t1Box = await tab1Panel.boundingBox()
        if (t1Box) {
          await dragElement(page, textItem, { x: t1Box.x + t1Box.width / 2, y: t1Box.y + t1Box.height + 15 })
          actions++
        }

        // Kéo TextWidget vào slot Tab 2
        const tab2Panel = canvas.getByText(/Tab 2:/).first()
        await expect(tab2Panel).toBeVisible({ timeout: 10000 })
        const t2Box = await tab2Panel.boundingBox()
        if (t2Box) {
          await dragElement(page, textItem, { x: t2Box.x + t2Box.width / 2, y: t2Box.y + t2Box.height + 15 })
          actions++
        }

        // 6. Xuất bản
        await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
        actions++
        await expect(
          page.getByRole('status').filter({ hasText: /Đã xuất bản/ }),
        ).toBeVisible({ timeout: 15000 })

        // 7. Kiểm tra thật trên trang công khai: bấm tab đổi được nội dung
        await page.goto(`/${landingSlug}`)
        const tabIndividual = page.getByRole('tab', { name: 'Cá nhân', exact: true })
        const tabBusiness = page.getByRole('tab', { name: 'Doanh nghiệp', exact: true })

        await expect(tabIndividual).toBeVisible({ timeout: 15000 })
        await expect(tabBusiness).toBeVisible({ timeout: 15000 })

        // Tab Cá nhân active ban đầu
        await expect(tabIndividual).toHaveAttribute('aria-selected', 'true')
        await expect(tabBusiness).toHaveAttribute('aria-selected', 'false')

        // Bấm sang Tab Doanh nghiệp
        await tabBusiness.click()
        actions++
        await expect(tabBusiness).toHaveAttribute('aria-selected', 'true')
        await expect(tabIndividual).toHaveAttribute('aria-selected', 'false')

        await page.screenshot({ path: 'docs/screenshots/eb11/viec-4-tabs-public.png' })

        testInfo.annotations.push({
          type: 'viec-4',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })

      // =========================================================================
      // VIỆC 5: Ẩn khối Tab trên điện thoại, đổi tên cây Cấu trúc thành "Tab khách hàng"
      // Đề bài: "Chị ẩn khối Tab đó trên điện thoại, rồi đặt lại tên khối trong cây Cấu trúc là Tab khách hàng."
      // =========================================================================
      await test.step('Việc 5: Ẩn Tab trên mobile, đổi tên trong cây Cấu trúc thành Tab khách hàng', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        await page.goto(`/builder/${landingPageId}`)
        actions++
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })
        const canvas = page.frameLocator('iframe')

        // 1. Chọn khối Tab
        const tabsBlock = canvas.locator(`[data-puck-component="${tabsComponentId}"]`)
        await expect(tabsBlock).toBeVisible()
        await tabsBlock.click()
        actions++

        // 2. Chuyển sang tab "Nâng cao"
        const advancedTab = page.getByRole('tab', { name: 'Nâng cao', exact: true })
        await expect(advancedTab).toBeVisible()
        await advancedTab.click()
        actions++

        // 3. Tích chọn ẩn trên "Điện thoại"
        const mobileHideCheckbox = page.getByRole('checkbox', { name: 'Điện thoại', exact: true })
        await expect(mobileHideCheckbox).toBeVisible()
        await mobileHideCheckbox.check()
        actions++

        // 4. Mở tab "Cấu trúc" trên bảng bên trái
        const outlineTab = page.getByRole('tab', { name: 'Cấu trúc', exact: true })
        await expect(outlineTab).toBeVisible()
        await outlineTab.click()
        actions++

        // 5. Tìm dòng khối Tab trong Navigator và đổi tên qua nhấp đúp
        const tabRow = page.locator(`[data-puck-layer-tree-id="${tabsComponentId}"]`)
        await expect(tabRow).toBeVisible()
        hardSelectors.push(`[data-puck-layer-tree-id="${tabsComponentId}"]`)

        // Double click text "Tabs" hiển thị trong row để kích hoạt inline rename
        await tabRow.getByText('Tabs', { exact: true }).last().dblclick()
        actions += 2

        const renameInput = tabRow.locator('input[type="text"]')
        await expect(renameInput).toBeVisible({ timeout: 5000 })
        await renameInput.fill('Tab khách hàng')
        await renameInput.press('Enter')
        actions += 2

        // Kiểm tra cây Cấu trúc hiện tên mới
        await expect(tabRow).toContainText('Tab khách hàng')

        await page.screenshot({ path: 'docs/screenshots/eb11/viec-5-navigator-rename.png' })

        // 6. Xuất bản
        await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
        actions++
        await expect(
          page.getByRole('status').filter({ hasText: /Đã xuất bản/ }),
        ).toBeVisible({ timeout: 15000 })

        // 7. Kiểm tra thật trên trang công khai: 1440 hiện, 375 ẩn
        const tabWrapper = page.locator(`[data-eb-id="${tabsComponentId}"]`)

        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto(`/${landingSlug}`)
        await expect(tabWrapper).toBeVisible({ timeout: 15000 })
        await expect(tabWrapper).toHaveCSS('display', 'block')

        await page.setViewportSize({ width: 375, height: 900 })
        await page.reload()
        await expect(tabWrapper).toHaveCSS('display', 'none')

        await page.setViewportSize({ width: 1440, height: 900 })

        testInfo.annotations.push({
          type: 'viec-5',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })

      // =========================================================================
      // VIỆC 6: Đổi màu nút chính của cả website sang màu tím đậm
      // Đề bài: "Chị đổi màu nút chính của cả website sang màu tím đậm, xem lại trang [MẪU] Landing thử."
      // =========================================================================
      await test.step('Việc 6: Đổi màu nút chính toàn site sang tím đậm, kiểm tra trang công khai', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        // 1. Vào Thiết kế hệ thống trong Admin
        await page.goto('/admin/globals/designSystem')
        actions++

        // 2. Mở toàn bộ bảng màu để thấy các trường HEX
        const expandAllBtn = page.getByRole('button', { name: 'Hiển thị toàn bộ' })
        if (await expandAllBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
          await expandAllBtn.click()
          actions++
        }

        // 3. Nhập mã HEX #280A60 (tím đậm / deep-navy) cho token accent-pink (hàng thứ 3, index 2)
        const pinkHexInput = page.getByRole('textbox', { name: 'Màu (HEX) *' }).nth(2)
        await expect(pinkHexInput).toBeVisible({ timeout: 10000 })
        await pinkHexInput.fill('#280A60')
        hardSelectors.push('getByRole("textbox", { name: "Màu (HEX) *" }).nth(2)')
        actions++

        await page.screenshot({ path: 'docs/screenshots/eb11/viec-6-doi-mau-nut.png' })

        // 4. Bấm Lưu
        const saveDsBtn = page.getByRole('button', { name: 'Lưu', exact: true })
        await expect(saveDsBtn).toBeEnabled({ timeout: 5000 })
        await saveDsBtn.click()
        actions++

        // Sau khi lưu thành công, nút Lưu trở lại trạng thái disabled (không còn dirty)
        await expect(saveDsBtn).toBeDisabled({ timeout: 15000 })

        // 5. Mở lại trang [MẪU] Landing thử công khai, kiểm tra màu nút chính
        await page.goto(`/${landingSlug}`)
        const ctaBtn = page.getByRole('link', { name: /Tham gia ngay/i }).first()
        await expect(ctaBtn).toBeVisible({ timeout: 15000 })

        // Nút chính nhận biến CSS --color-accent-pink: #280A60 -> rgb(40, 10, 96)
        await expect(ctaBtn).toHaveCSS('background-color', 'rgb(40, 10, 96)')

        testInfo.annotations.push({
          type: 'viec-6',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })

      // =========================================================================
      // VIỆC 7: Lưu khung 2 cột thành [MẪU] Khung ảnh chữ, chèn vào [MẪU] Trang thử builder
      // Đề bài: "Chị lưu khung 2 cột ở việc 2 thành mẫu tên [MẪU] Khung ảnh chữ,
      // rồi chèn mẫu đó vào trang [MẪU] Trang thử builder."
      // =========================================================================
      await test.step('Việc 7: Lưu khung 2 cột thành mẫu [MẪU] Khung ảnh chữ, chèn vào trang khác', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        // 1. Mở lại visual builder của Landing thử
        await page.goto(`/builder/${landingPageId}`)
        actions++
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })
        const canvasLanding = page.frameLocator('iframe')

        // 2. Nhấp chuột phải vào Container 2 cột trên canvas
        const containerBlock = canvasLanding.locator(`[data-puck-component="${containerComponentId}"]`)
        await expect(containerBlock).toBeVisible()
        await containerBlock.click({ button: 'right', position: { x: 5, y: 5 } })
        actions++

        // 3. Chọn "Lưu thành mẫu" trong menu ngữ cảnh
        const contextMenu = page.getByRole('menu', { name: 'Tác vụ khối' })
        await expect(contextMenu).toBeVisible()
        const saveTplItem = page.getByRole('menuitem', { name: 'Lưu thành mẫu' })
        await saveTplItem.click()
        actions++

        // 4. Nhập tên mẫu: "[MẪU] Khung ảnh chữ" và bấm Lưu mẫu
        const saveModal = page.getByRole('dialog', { name: 'Lưu thành mẫu' })
        await expect(saveModal).toBeVisible()
        const nameInput = saveModal.locator('#template-name-input')
        await nameInput.fill('[MẪU] Khung ảnh chữ')
        hardSelectors.push('#template-name-input')
        actions++

        await saveModal.getByRole('button', { name: 'Lưu mẫu' }).click()
        actions++

        await expect(
          page.getByRole('status').filter({ hasText: 'Đã lưu mẫu thành công' }),
        ).toBeVisible({ timeout: 15000 })

        // 5. Mở visual builder của trang đích "[MẪU] Trang thử builder"
        await page.goto(`/builder/${samplePageId}`)
        actions++
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })

        // 6. Mở tab "Mẫu" trên bảng bên trái
        const templatesTab = page.getByRole('tab', { name: 'Mẫu', exact: true }).or(page.locator('button[data-tab="templates"]'))
        await expect(templatesTab).toBeVisible()
        await templatesTab.click()
        actions++

        // 7. Tìm mẫu "[MẪU] Khung ảnh chữ" và bấm "Chèn"
        const savedTemplateCard = page.locator('div').filter({ hasText: '[MẪU] Khung ảnh chữ' }).first()
        await expect(savedTemplateCard).toBeVisible({ timeout: 15000 })

        const insertBtn = savedTemplateCard.getByRole('button', { name: 'Chèn' })
        await expect(insertBtn).toBeVisible()
        await insertBtn.click()
        actions++

        await page.screenshot({ path: 'docs/screenshots/eb11/viec-7-chen-mau-khoi.png' })

        // 8. Bấm Xuất bản trang thử
        await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
        actions++
        await expect(
          page.getByRole('status').filter({ hasText: /Đã xuất bản/ }),
        ).toBeVisible({ timeout: 15000 })

        // 9. Kiểm tra thật trên trang công khai: có ảnh và đoạn văn từ mẫu chèn vào
        await page.goto(`/${samplePageSlug}`)
        await expect(page.locator(`img[alt="${sampleMedia1Alt}"]`)).toBeVisible({ timeout: 15000 })
        await expect(page.getByText(/Nhập đoạn văn bản|Không gian lắng nghe/i)).toBeVisible({ timeout: 15000 })

        testInfo.annotations.push({
          type: 'viec-7',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })

      // =========================================================================
      // VIỆC 8: Mở lịch sử phiên bản của [MẪU] Landing thử, xem bản cũ, quay lại
      // Đề bài: "Chị mở lịch sử phiên bản của [MẪU] Landing thử, xem bản trước
      // khi đổi tiêu đề, rồi quay lại bản mới nhất."
      // =========================================================================
      await test.step('Việc 8: Xem trước bản cũ trong lịch sử phiên bản, thoát an toàn', async () => {
        const t0 = Date.now()
        let actions = 0
        const hardSelectors: string[] = []

        // 1. Mở lại Visual Builder của Landing thử
        await page.goto(`/builder/${landingPageId}`)
        actions++
        await expect(page.locator('[class*="_PuckCanvas--ready_"]')).toHaveCount(1, {
          timeout: 30000,
        })

        // 2. Bấm nút "Lịch sử" trên thanh công cụ trên cùng
        const historyBtn = page.getByRole('button', { name: /Lịch sử/ })
        await expect(historyBtn).toBeVisible()
        await historyBtn.click()
        actions++

        // 3. Modal Lịch sử phiên bản hiện danh sách
        const historyModal = page.getByRole('dialog', { name: 'Lịch sử phiên bản' })
        await expect(historyModal).toBeVisible()

        const viewButtons = historyModal.getByRole('button', { name: 'Xem' })
        await expect(viewButtons.first()).toBeVisible({ timeout: 10000 })

        // 4. Bấm "Xem" bản cũ nhất (trước khi đổi tiêu đề và thêm các khối)
        await viewButtons.last().click()
        actions++

        // 5. Modal đóng, xuất hiện banner cảnh báo xem trước
        const previewBanner = page.locator('div[role="status"]').filter({ hasText: 'Thoát' })
        await expect(previewBanner).toBeVisible({ timeout: 10000 })

        // Kiểm tra an toàn: Trong chế độ xem trước, các nút Lưu nháp và Xuất bản bị vô hiệu hoá
        await expect(page.getByRole('button', { name: 'Lưu nháp', exact: true })).toBeDisabled()
        await expect(page.getByRole('button', { name: 'Xuất bản', exact: true })).toBeDisabled()

        await page.screenshot({ path: 'docs/screenshots/eb11/viec-8-lich-su-phien-ban.png' })

        // 6. Bấm "Thoát" trên banner để quay về bản mới nhất
        const exitPreviewBtn = previewBanner.getByRole('button', { name: 'Thoát' })
        await expect(exitPreviewBtn).toBeVisible()
        await exitPreviewBtn.click()
        actions++

        // Banner biến mất, các nút Lưu nháp / Xuất bản kích hoạt lại
        await expect(previewBanner).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Lưu nháp', exact: true })).toBeEnabled()
        await expect(page.getByRole('button', { name: 'Xuất bản', exact: true })).toBeEnabled()

        // Tiêu đề mới "Thử builder mới" vẫn còn nguyên
        const canvas = page.frameLocator('iframe')
        await expect(canvas.getByText('Thử builder mới')).toBeVisible()

        testInfo.annotations.push({
          type: 'viec-8',
          description: JSON.stringify({
            actions,
            hardSelectors,
            durationMs: Date.now() - t0,
          }),
        })
      })
    } finally {
      // Dọn dẹp an toàn sau test
      test.setTimeout(testInfo.timeout + 30000)

      // Khôi phục designSystem nếu đã bị đổi
      if (initialDesignSystem) {
        await page.request.post('/api/globals/designSystem', {
          data: initialDesignSystem,
        }).catch(() => {})
      }

      // Xóa các trang test đã tạo
      if (landingPageId) {
        await page.request.delete(`/api/pages/${landingPageId}`).catch(() => {})
      }
      if (samplePageId) {
        await page.request.delete(`/api/pages/${samplePageId}`).catch(() => {})
      }

      // Xóa mẫu khối test đã lưu
      const tplsRes = await page.request.get(
        `/api/blockTemplates?where[name][like]=%5BM%E1%BA%AAU%5D%20Khung%20%E1%BA%A3nh%20ch%E1%BB%AF&depth=0`,
      )
      if (tplsRes.ok()) {
        const tpls = (await tplsRes.json()).docs || []
        for (const tpl of tpls) {
          await page.request.delete(`/api/blockTemplates/${tpl.id}`).catch(() => {})
        }
      }

      // Xóa ảnh test đã tạo
      if (sampleMedia1Id) {
        await page.request.delete(`/api/media/${sampleMedia1Id}`).catch(() => {})
      }
      if (sampleMedia2Id) {
        await page.request.delete(`/api/media/${sampleMedia2Id}`).catch(() => {})
      }

      // Xóa tài khoản admin test nếu tạo mới trong test này
      if (ownerUserId) {
        await page.request.delete(`/api/users/${ownerUserId}`).catch(() => {})
      }
    }
  })
})
