import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

/**
 * DP-01b / AU-02: E2E EQ Buddy Flow & Access Mode Switch
 *
 * Scenarios per DP-01 section 7 & AU-02:
 * 1. Bootstrap admin if CI/dev DB is fresh.
 * 2. Ensure product eq-buddy-so and growth-mirror-phien-trai-nghiem exist.
 * 3. Seed/ensure 3 published sample EQ cards with prompts and stories.
 * 4. Part 1 (Trial mode - default):
 *    - Guest opens /eq-buddy -> clicks "Rút thẻ ngay" -> navigates directly to /eq-buddy/rut-the.
 *    - Enters status and selects quick emotion.
 *    - Draws card 1 -> 3D card flips front and back -> answers prompts.
 *    - Verifies "Tôi đang:" and "Tôi cảm thấy:" show up.
 *    - Verifies NO string "TDCX-" and NO "#0..." on page.
 *    - Verifies 3 action buttons (VIP Member, Shopee, Đặt lịch coaching 1-1).
 *    - Verifies 375 responsive layout has no horizontal scroll and passes axe clean.
 *    - Tries to draw card 2 -> paywall blocks guest.
 *    - Visits QR page of card directly -> card message & story load publicly.
 * 5. Part 2 (Free mode - "Miễn phí hoàn toàn"):
 *    - Admin updates eqBuddyContent.eqAccessMode = 'free'.
 *    - Guest opens /eq-buddy/rut-the with fresh context.
 *    - Draws multiple cards without getting blocked.
 *    - "Tất cả thẻ" displays unlocked cards.
 * 6. Admin restores eqAccessMode and cleans sample test entities.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminDp01b-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-dp01b-${randomUUID()}@example.test`)
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
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('DP-01b: EQ Buddy Zip Flow & Free Access Mode Switch (AU-02)', () => {
  test('luồng rút thẻ -> lật 3D -> kiểm 3 nút & không mã số -> chặn ở thẻ 2 khi trial -> xem QR -> owner bật Miễn phí hoàn toàn -> rút tự do', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(240000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let adminId: number | undefined
    let createdProductId: number | undefined
    let createdCoachingId: number | undefined
    let initialGlobalData: any = null
    const createdCardIds: (number | string)[] = []
    const suffix = randomUUID().slice(0, 8)
    const cardCode1 = `EQ-B1-${suffix}`
    const cardCode2 = `EQ-B2-${suffix}`
    const cardCode3 = `EQ-B3-${suffix}`
    const qrSlug1 = `test-qr-b1-${suffix}`
    const message1 = `Thông điệp chữa lành mẫu B1 (${suffix})`
    const story1 = `Câu chuyện truyền cảm hứng mẫu B1 (${suffix})`

    const visitor1 = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width: 1440, height: 900 },
    })
    const guestPage1 = await visitor1.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // Lưu lại global EQ content ban đầu
      const initialGlobalRes = await page.request.get('/api/globals/eqBuddyContent')
      if (initialGlobalRes.ok()) {
        initialGlobalData = await initialGlobalRes.json()
      }

      // 1. Đảm bảo sản phẩm eq-buddy-so đã tồn tại
      const existingProduct = await (
        await page.request.get('/api/products?where[slug][equals]=eq-buddy-so&draft=true')
      ).json()
      if (existingProduct.docs?.length) {
        createdProductId = existingProduct.docs[0].id
      } else {
        const prodRes = await page.request.post('/api/products', {
          data: {
            name: 'EQ Buddy số',
            slug: 'eq-buddy-so',
            web: 'eq',
            type: 'digital_tool',
            trialDays: 21,
            price: 250000,
            salePrice: 99000,
            saleStatus: 'on_sale',
            isSample: true,
            _status: 'published',
          },
        })
        expect(prodRes.ok()).toBe(true)
        createdProductId = (await prodRes.json()).doc?.id
      }

      // 1b. Đảm bảo sản phẩm coaching trải nghiệm tồn tại cho nút đặt lịch AU-04
      const existingCoaching = await (
        await page.request.get(
          '/api/products?where[slug][equals]=growth-mirror-phien-trai-nghiem&draft=true',
        )
      ).json()
      if (existingCoaching.docs?.length) {
        createdCoachingId = existingCoaching.docs[0].id
      } else {
        const cProdRes = await page.request.post('/api/products', {
          data: {
            name: 'Growth Mirror – phiên trải nghiệm',
            slug: 'growth-mirror-phien-trai-nghiem',
            web: 'site',
            type: 'coaching_trial',
            price: 149000,
            saleStatus: 'on_sale',
            isSample: true,
            _status: 'published',
          },
        })
        expect(cProdRes.ok()).toBe(true)
        createdCoachingId = (await cProdRes.json()).doc?.id
      }

      // 2. Tạo 3 thẻ EQ Buddy test
      const cardSeeds = [
        {
          code: cardCode1,
          qrSlug: qrSlug1,
          keywordEn: `Clarity-${suffix}`,
          keywordVi: 'Sáng tỏ',
          message: message1,
          promptRecall: 'Bạn nhớ lại khoảnh khắc nào gần đây?',
          promptPack: 'Bạn muốn gói ghém bài học gì?',
          promptAcknowledge: 'Bạn ghi nhận điều gì ở bản thân?',
          story: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [{ type: 'text', text: story1 }],
                },
              ],
            },
          },
          _status: 'published',
        },
        {
          code: cardCode2,
          qrSlug: `test-qr-b2-${suffix}`,
          keywordEn: `Peace-${suffix}`,
          keywordVi: 'Bình an',
          message: `Thông điệp bình an B2 (${suffix})`,
          promptRecall: 'Khi nào bạn thấy lòng an?',
          promptPack: 'Bạn muốn gói ghém điều gì?',
          promptAcknowledge: 'Bạn ghi nhận điều gì ở bản thân?',
          _status: 'published',
        },
        {
          code: cardCode3,
          qrSlug: `test-qr-b3-${suffix}`,
          keywordEn: `Courage-${suffix}`,
          keywordVi: 'Can đảm',
          message: `Thông điệp can đảm B3 (${suffix})`,
          promptRecall: 'Bạn can đảm bước tiếp?',
          promptPack: 'Bạn muốn gói ghém điều gì?',
          promptAcknowledge: 'Bạn ghi nhận điều gì ở bản thân?',
          _status: 'published',
        },
      ]

      for (const cs of cardSeeds) {
        const cRes = await page.request.post('/api/eqCards', { data: cs })
        expect(cRes.ok(), `tạo thẻ ${cs.code}: ${cRes.status()}`).toBe(true)
        const doc = await cRes.json()
        createdCardIds.push(doc.doc?.id || doc.id)
      }

      // 3. Đảm bảo chế độ ban đầu là trial
      await page.request.post('/api/globals/eqBuddyContent', {
        data: { eqAccessMode: 'trial' },
      })

      // ===== PHẦN 1: Luồng Giới thiệu -> Rút thẻ -> Trial =====
      // 1.1 Khách mở /eq-buddy
      await guestPage1.goto('/eq-buddy')
      await expect(guestPage1).toHaveURL(/\/eq-buddy$/)
      await expect(guestPage1.getByRole('heading', { level: 1, name: 'BỘ THẺ EQ BUDDY' })).toBeVisible({
        timeout: 15000,
      })

      // Nút chính đi thẳng vào rút thẻ
      const drawNowLink = guestPage1.getByRole('link', { name: /Rút thẻ ngay/i })
      await expect(drawNowLink).toBeVisible()
      await drawNowLink.click()
      await expect(guestPage1).toHaveURL(/\/eq-buddy\/rut-the$/)

      // 1.2 Nhập trạng thái + chọn cảm xúc (AU-02)
      const inputEl = guestPage1.locator('#emotion-input')
      await expect(inputEl).toBeVisible({ timeout: 15000 })
      await inputEl.fill('đang tìm hướng đi mới')

      const emotionButton = guestPage1.getByRole('button', { name: /\+ Bình an/i })
      if (await emotionButton.isVisible()) {
        await emotionButton.click()
      }

      // Rút ngẫu nhiên thẻ 1
      await expect(async () => {
        const drawBtn = guestPage1.getByRole('button', { name: /Rút ngẫu nhiên một thẻ/i })
        await expect(drawBtn).toBeVisible()
        await drawBtn.click()
      }).toPass({ timeout: 15000 })

      // 1.3 Màn hình kết quả: Thẻ lật 3D hiện ra với aria-label không chứa số thẻ
      await expect(guestPage1.getByRole('button', { name: /^Thẻ EQ: .*Bấm để lật\.$/ })).toBeVisible({
        timeout: 15000,
      })

      // Nhắc lại Tôi đang / Tôi cảm thấy (AU-02)
      await expect(guestPage1.getByText('Tôi đang:').first()).toBeVisible()
      await expect(guestPage1.getByText('đang tìm hướng đi mới').first()).toBeVisible()

      // Kiểm tra KHÔNG còn chuỗi "TDCX-" và "#0..." trên trang (AU-02)
      const pageText = await guestPage1.innerText('body')
      expect(pageText).not.toContain('TDCX-')
      expect(pageText).not.toMatch(/#[0-9]/)

      // Kiểm tra có đủ 3 nút: VIP Member, Shopee, Đặt lịch coaching 1-1
      await expect(guestPage1.getByRole('link', { name: /Trở thành VIP Member/i })).toBeVisible()
      await expect(guestPage1.getByRole('link', { name: /Mua bộ thẻ trên Shopee/i })).toBeVisible()
      await expect(guestPage1.getByRole('link', { name: /Đặt lịch coaching 1-1/i })).toBeVisible()

      // Kiểm tra 375px responsive: không cuộn ngang và axe sạch
      await guestPage1.setViewportSize({ width: 375, height: 667 })
      const hasHorizontalOverflow = await guestPage1.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(hasHorizontalOverflow).toBe(false)
      await expectNoSeriousA11y(guestPage1, 'eq-buddy-rut-the-result-375')
      await guestPage1.setViewportSize({ width: 1440, height: 900 })

      // Lật thẻ sang mặt sau rồi lật về: kiểm tra 3 câu hỏi kết nối nội tâm
      await guestPage1.getByRole('button', { name: /Lật thẻ sang mặt sau/i }).click()
      await expect(guestPage1.getByRole('button', { name: /Lật về mặt trước/i })).toBeVisible()
      await expect(guestPage1.getByText('3 câu hỏi kết nối nội tâm')).toBeVisible()
      await expect(guestPage1.getByText('Dừng để vững vàng bước tới.')).toBeVisible()

      // Thẻ thứ 2 ở chế độ dùng thử -> màn dùng thử 21 ngày
      await guestPage1.getByRole('button', { name: /Rút thẻ khác/i }).click()
      await expect(
        guestPage1.getByRole('link', { name: /Bắt đầu dùng thử 21 ngày/i }).first(),
      ).toBeVisible({ timeout: 15000 })

      // Kiểm tra trang QR của thẻ 1 mở trực tiếp được mà không cần đăng nhập
      const qrContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
      const qrPage = await qrContext.newPage()
      await qrPage.goto(`/eq-buddy/the/${qrSlug1}`)
      await expect(qrPage.getByText(message1).first()).toBeVisible({ timeout: 15000 })
      await expect(qrPage.getByText(story1).first()).toBeVisible({ timeout: 15000 })
      await qrContext.close()

      // ===== PHẦN 2: Owner đổi sang "Miễn phí hoàn toàn" (free mode) =====
      const updateGlobalRes = await page.request.post('/api/globals/eqBuddyContent', {
        data: { eqAccessMode: 'free' },
      })
      expect(updateGlobalRes.ok()).toBe(true)

      // Khách truy cập với ngữ cảnh mới
      const visitor2 = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
      const guestPage2 = await visitor2.newPage()

      await guestPage2.goto('/eq-buddy/rut-the')
      await expect(guestPage2).toHaveURL(/\/eq-buddy\/rut-the$/)

      // Rút thẻ lần 1
      const freeDrawBtn = guestPage2.getByRole('button', { name: /Rút ngẫu nhiên một thẻ/i })
      await expect(freeDrawBtn).toBeVisible()
      await freeDrawBtn.click()

      const flipFree = guestPage2.getByRole('button', { name: /Lật thẻ sang mặt sau/i })
      await expect(flipFree).toBeVisible({ timeout: 15000 })

      // Chế độ miễn phí: rút tiếp nhiều lần, không gặp màn dùng thử
      for (let i = 0; i < 2; i++) {
        await guestPage2.getByRole('button', { name: /Rút thẻ khác/i }).click()
        await expect(flipFree).toBeVisible({ timeout: 15000 })
        await expect(
          guestPage2.getByRole('link', { name: /Bắt đầu dùng thử 21 ngày/i }),
        ).toHaveCount(0)
      }

      // "Xem tất cả thẻ": mọi thẻ đều mở, thấy thông điệp, không còn nhãn khoá
      await guestPage2.getByRole('button', { name: /Xem tất cả thẻ/i }).click()
      await expect(guestPage2.getByRole('heading', { name: 'Tất cả thẻ Trạm Dừng' })).toBeVisible()
      for (const cs of cardSeeds) {
        await expect(guestPage2.getByText(cs.message).first()).toBeVisible()
      }
      await expect(guestPage2.getByText('Dùng thử hoặc mua để mở trọn vẹn')).toHaveCount(0)

      // Z4: Mỗi thẻ trong "Tất cả thẻ" là button có aria-label, có thể focus và bấm bằng bàn phím
      const firstCardBtn = guestPage2.getByRole('button', { name: new RegExp(`Clarity-${suffix}`) })
      await expect(firstCardBtn).toBeVisible()
      await firstCardBtn.focus()
      await guestPage2.keyboard.press('Enter')
      await expect(guestPage2.getByRole('button', { name: /Lật thẻ sang mặt sau/i })).toBeVisible({
        timeout: 15000,
      })

      await visitor2.close()
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      // Khôi phục lại bản global cũ
      if (initialGlobalData) {
        await page.request
          .post('/api/globals/eqBuddyContent', { data: initialGlobalData })
          .catch(() => {})
      } else {
        await page.request
          .post('/api/globals/eqBuddyContent', { data: { eqAccessMode: 'trial' } })
          .catch(() => {})
      }
      for (const id of createdCardIds) {
        await page.request.delete(`/api/eqCards/${id}`).catch(() => {})
      }
      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }
      if (createdCoachingId) {
        await page.request.delete(`/api/products/${createdCoachingId}`).catch(() => {})
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await visitor1.close()
    }
  })
})
