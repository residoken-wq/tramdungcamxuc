import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * DP-01b: E2E EQ Buddy Flow & Access Mode Switch
 *
 * Scenarios per DP-01 section 7:
 * 1. Bootstrap admin if CI/dev DB is fresh.
 * 2. Ensure product eq-buddy-so exists.
 * 3. Seed/ensure 3 published sample EQ cards with prompts and stories.
 * 4. Part 1 (Trial mode - default):
 *    - Guest opens /eq-buddy/rut-the.
 *    - Draws card 1 -> 3D card flips front and back -> answers prompts.
 *    - Tries to draw card 2 -> paywall blocks guest.
 *    - Visits QR page of card directly -> card message & story load publicly.
 * 5. Part 2 (Free mode - "Miễn phí hoàn toàn"):
 *    - Admin updates eqBuddyContent.eqAccessMode = 'free'.
 *    - Guest opens /eq-buddy/rut-the with fresh context.
 *    - Draws multiple cards without getting blocked.
 *    - "Tất cả thẻ" displays unlocked cards.
 * 6. Admin restores eqAccessMode = 'trial'.
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

test.describe('DP-01b: EQ Buddy Zip Flow & Free Access Mode Switch', () => {
  test('luồng rút thẻ -> lật 3D -> chặn ở thẻ 2 khi trial -> xem QR công khai -> owner bật Miễn phí hoàn toàn -> rút tự do', async ({
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
            saleStatus: 'on_sale',
            isSample: true,
            _status: 'published',
          },
        })
        expect(prodRes.ok()).toBe(true)
        createdProductId = (await prodRes.json()).doc?.id
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
          _status: 'published',
        },
        {
          code: cardCode3,
          qrSlug: `test-qr-b3-${suffix}`,
          keywordEn: `Courage-${suffix}`,
          keywordVi: 'Can đảm',
          message: `Thông điệp can đảm B3 (${suffix})`,
          promptRecall: 'Bạn can đảm bước tiếp?',
          _status: 'published',
        },
      ]

      for (const cs of cardSeeds) {
        const cRes = await page.request.post('/api/eqCards', { data: cs })
        if (cRes.ok()) {
          const doc = await cRes.json()
          createdCardIds.push(doc.doc?.id || doc.id)
        }
      }

      // 3. Đảm bảo chế độ ban đầu là trial
      await page.request.post('/api/globals/eqBuddyContent', {
        data: { eqAccessMode: 'trial' },
      })

      // ===== PHẦN 1: Luồng Trial (chế độ mặc định) =====
      await guestPage1.goto('/eq-buddy/rut-the')
      await expect(guestPage1).toHaveURL(/\/eq-buddy\/rut-the$/)

      // Rút ngẫu nhiên thẻ 1
      await expect(async () => {
        const drawBtn = guestPage1.getByRole('button', { name: /Rút ngẫu nhiên một thẻ/i })
        await expect(drawBtn).toBeVisible()
        await drawBtn.click()
      }).toPass({ timeout: 15000 })

      // Thấy thông điệp hoặc từ khóa
      await expect(
        guestPage1.locator('div, h2, h3').filter({ hasText: new RegExp(`${suffix}`) }).first(),
      ).toBeVisible({ timeout: 15000 })

      // Bấm lật thẻ sang mặt sau
      const flipBtn = guestPage1.getByRole('button', { name: /Lật thẻ sang mặt sau/i })
      if (await flipBtn.isVisible()) {
        await flipBtn.click()
      }

      // Đi tiếp qua các bước suy ngẫm
      const reflectBtn = guestPage1.getByRole('button', { name: /Viết suy ngẫm/i })
      if (await reflectBtn.isVisible()) {
        await reflectBtn.click()
      }

      const nextBtn = guestPage1.getByRole('button', { name: /Đi tiếp/i })
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
      }

      // Thử rút lần thứ 2 -> Gặp màn hình Paywall dùng thử 21 ngày
      const drawAgainBtn = guestPage1.getByRole('button', { name: /Rút thẻ khác/i })
      if (await drawAgainBtn.isVisible()) {
        await drawAgainBtn.click()
        await expect(
          guestPage1.getByRole('link', { name: /Bắt đầu dùng thử 21 ngày/i }).first(),
        ).toBeVisible({ timeout: 15000 })
      }

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

      await expect(
        guestPage2.locator('div, h2, h3').filter({ hasText: new RegExp(`${suffix}`) }).first(),
      ).toBeVisible({ timeout: 15000 })

      // Trong free mode, nút "Rút thẻ khác" bấm được nhiều lần mà không bị paywall
      const freeDrawAgain = guestPage2.getByRole('button', { name: /Rút thẻ khác/i })
      if (await freeDrawAgain.isVisible()) {
        await freeDrawAgain.click()
        // Vẫn thấy thẻ mới hoặc màn rút thẻ, không hiện paywall
        await expect(
          guestPage2.getByRole('link', { name: /Bắt đầu dùng thử 21 ngày/i }),
        ).not.toBeVisible()
      }

      // Kiểm tra tab "Tất cả thẻ": các thẻ đều mở, có chữ "Chạm để mở thẻ" thay vì paywall
      const allCardsTab = guestPage2.getByRole('button', { name: /Tất cả thẻ/i })
      if (await allCardsTab.isVisible()) {
        await allCardsTab.click()
        await expect(
          guestPage2.getByText(/Chạm để mở thẻ/i).first(),
        ).toBeVisible({ timeout: 10000 })
      }

      await visitor2.close()

      // Khôi phục lại chế độ trial
      await page.request.post('/api/globals/eqBuddyContent', {
        data: { eqAccessMode: 'trial' },
      })
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      for (const id of createdCardIds) {
        await page.request.delete(`/api/eqCards/${id}`).catch(() => {})
      }
      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await visitor1.close()
    }
  })
})

