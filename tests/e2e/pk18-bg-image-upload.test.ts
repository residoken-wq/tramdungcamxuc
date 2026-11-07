import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { test, expect, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

const SHOT_DIR = path.join(process.cwd(), 'docs/screenshots/pk18')
const SHOTS = process.env.PK18_SCREENSHOTS === '1'

// 1x1 transparent/small PNG fixture in base64
const SMALL_PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk18-${randomUUID()}@example.test`
  const password = randomUUID()
  await page.locator('#field-email').fill(email)
  await page.locator('#field-password').fill(password)
  await page.locator('#field-confirm-password').fill(password)

  let response: Response | undefined
  await expect(async () => {
    const registration = page.waitForResponse(
      (res) => res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
      { timeout: 5000 },
    )
    await page.locator('button[type="submit"]').click()
    response = await registration
  }).toPass({ timeout: 60000 })

  if (!response) throw new Error('First-user registration request was never sent.')
  expect(response.ok()).toBe(true)
  const registered = await response.json()
  await expect(page).toHaveURL(/\/admin\/?$/)
  const userId = registered.user?.id || registered.doc?.id
  return { userId }
}

test.describe('PK-18: Media upload & block background image', () => {
  test('Tải ảnh lên trong builder và đặt ảnh nền + lớp phủ 40% cho JourneySteps', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-1440',
      'Runs once, checks 1440 and 375 internally.',
    )
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    const marker = randomUUID().slice(0, 8)
    const slug = `e2e-pk18-${marker}`
    let userId: number | undefined
    let pageId: number | undefined
    let mediaId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Tạo trang mẫu chứa HanaStory và JourneySteps
      const createdPage = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E PK-18 ${marker}`,
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'HanaStory',
                props: {
                  id: 'hana-story-1',
                  version: 1,
                  titleLine1: '[MẪU] CÂU CHUYỆN',
                  titleLine2: '[MẪU] CỦA HANA',
                  seriesLabel: '[MẪU] GIỚI THIỆU',
                  bgColor: 'warm-ivory',
                },
              },
              {
                type: 'JourneySteps',
                props: {
                  id: 'journey-steps-1',
                  version: 3,
                  titleLine1: '[MẪU] HÀNH TRÌNH',
                  titleLine2: '[MẪU] 5 BƯỚC CHUYỂN HÓA',
                  seriesLabel: '[MẪU] LỘ TRÌNH',
                  bgColor: 'warm-ivory',
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E PK-18 ${marker}` } },
          },
        },
      })
      expect(createdPage.ok()).toBe(true)
      const pageDoc = await createdPage.json()
      pageId = pageDoc.doc?.id

      // 2. Mở builder
      await page.goto(`/admin/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('#puck-portal-root')).toBeVisible({ timeout: 30000 })

      // Chọn khối HanaStory
      const hanaBlock = page.locator('[data-puck-component="HanaStory"]').first()
      await hanaBlock.click()

      // Mở hộp chọn ảnh chân dung
      const chooseImgBtn = page.getByRole('button', { name: /Chọn ảnh/i }).first()
      await chooseImgBtn.click()

      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()

      // Tải ảnh lên fixture nhỏ
      const fileChooserPromise = page.waitForEvent('filechooser')
      await modal.getByRole('button', { name: /Tải ảnh lên/i }).click()
      const fileChooser = await fileChooserPromise
      await fileChooser.setFiles({
        name: 'test-pk18-fixture.png',
        mimeType: 'image/png',
        buffer: SMALL_PNG_BUFFER,
      })

      // Điền alt bắt buộc
      const altInput = modal.getByPlaceholder(/Nhập mô tả hình ảnh/i)
      await altInput.fill('[MẪU] Ảnh thử PK-18')

      // Bấm Tải lên & chọn
      const uploadResponsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/media') && res.request().method() === 'POST',
      )
      await modal.getByRole('button', { name: /Tải lên & chọn/i }).click()
      const uploadRes = await uploadResponsePromise
      expect(uploadRes.ok()).toBe(true)
      const uploadJson = await uploadRes.json()
      mediaId = uploadJson.doc?.id

      // Modal đóng và ảnh được chọn
      await expect(modal).not.toBeVisible()

      // 3. Chọn khối JourneySteps và đặt ảnh nền ở tab Kiểu -> Nền -> Ảnh
      const journeyBlock = page.locator('[data-puck-component="JourneySteps"]').first()
      await journeyBlock.click()

      // Chuyển sang tab Kiểu
      const styleTabBtn = page.getByRole('tab', { name: /Kiểu/i })
      await styleTabBtn.click()

      // Chọn loại nền "Ảnh"
      const bgTypeImageBtn = page.getByRole('button', { name: /^Ảnh$/i })
      await bgTypeImageBtn.click()

      // Bấm "Chọn ảnh" cho ảnh nền
      const selectBgImageBtn = page
        .locator('[data-testid="style-field-style"]')
        .getByRole('button', { name: /Chọn ảnh/i })
        .first()
      await selectBgImageBtn.click()

      const bgModal = page.getByRole('dialog')
      await expect(bgModal).toBeVisible()

      // Chọn ảnh vừa tải
      const mediaRow = bgModal.locator('tr', { hasText: '[MẪU] Ảnh thử PK-18' })
      await expect(mediaRow).toBeVisible()
      await mediaRow.click()
      await expect(bgModal).not.toBeVisible()

      // Chụp ảnh màn hình builder nếu bật flag
      if (SHOTS) {
        await page.screenshot({ path: path.join(SHOT_DIR, 'builder-bg-image-1440.png') })
      }

      // 4. Xuất bản trang
      const publishBtn = page.getByRole('button', { name: /Xuất bản/i })
      const saveResponsePromise = page.waitForResponse(
        (res) => res.url().includes(`/api/pages/${pageId}`) && res.request().method() === 'PATCH',
      )
      await publishBtn.click()
      await saveResponsePromise

      // 5. Kiểm tra trang công khai (ở cả 1440px và 375px)
      for (const width of [1440, 375]) {
        await publicPage.setViewportSize({ width, height: width === 375 ? 812 : 900 })
        await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })

        const journeySectionWrapper = publicPage.locator('[data-eb-id="journey-steps-1"]')
        await expect(journeySectionWrapper).toBeVisible()

        // Lớp bọc có background-image chứa url media
        const bgImage = await journeySectionWrapper.evaluate(
          (el) => getComputedStyle(el).backgroundImage,
        )
        expect(bgImage).toContain('/api/media/file/test-pk18-fixture')

        // Lớp phủ ::before có opacity 0.4
        const overlayOpacity = await journeySectionWrapper.evaluate((el) => {
          const before = window.getComputedStyle(el, '::before')
          return before.opacity
        })
        expect(overlayOpacity).toBe('0.4')

        // Section con bên trong không bị nền đặc che ảnh (background-color là transparent)
        const childSectionBg = await journeySectionWrapper
          .locator('> section')
          .evaluate((el) => getComputedStyle(el).backgroundColor)
        expect(childSectionBg).toBe('rgba(0, 0, 0, 0)')

        // Kiểm tra a11y không lỗi nghiêm trọng
        await expectNoSeriousA11y(publicPage, `PK-18 Public Page (${width}px)`)

        if (SHOTS) {
          await publicPage.screenshot({
            path: path.join(SHOT_DIR, `public-bg-image-${width}.png`),
          })
        }
      }
    } finally {
      // Dọn dẹp media, trang, tài khoản test
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (mediaId) {
        await page.request.delete(`/api/media/${mediaId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
      await publicContext.close().catch(() => {})
    }
  })
})
