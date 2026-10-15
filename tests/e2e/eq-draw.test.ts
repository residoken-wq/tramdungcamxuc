import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test cho Luồng rút thẻ EQ Buddy + Giới hạn dùng thử 21 ngày (T3-02).
 *
 * Kịch bản:
 * 1. Khởi tạo tài khoản admin trên CI nếu DB chưa có người dùng.
 * 2. Tạo 2 thẻ EQ Buddy test đã xuất bản qua REST API /api/eqCards (đủ 3 câu hỏi gợi nhớ/gói ghém/ghi nhận).
 * 3. Khách mới (chưa đăng nhập) rút ngẫu nhiên:
 *    - Thấy từ khóa + thông điệp mặt trước.
 *    - Lật thẻ sang mặt sau -> thấy câu hỏi "Gợi nhớ".
 *    - Đi tiếp qua các bước -> thử rút lần 2 -> thấy màn hình dùng thử 21 ngày (Paywall).
 * 4. Khách mới chọn theo từ khóa A–Z:
 *    - Bấm vào từ khóa mong muốn trong lưới -> rút đúng thẻ đã chọn.
 * 5. Dọn dẹp thẻ test và người dùng trong khối finally.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-t3-02-${randomUUID()}@example.test`)
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

test.describe('EQ Card Draw Flow & Trial Limits (T3-02)', () => {
  test('khách mới rút ngẫu nhiên -> lật thấy Gợi nhớ -> rút lần 2 bị chặn dùng thử; chọn theo từ khóa đúng thẻ', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let adminId: number | undefined
    const createdCardIds: (number | string)[] = []
    let createdProductId: number | undefined

    const suffix = randomUUID().slice(0, 8)
    const cardCode1 = `EQ-DRAW-1-${suffix}`
    const cardCode2 = `EQ-DRAW-2-${suffix}`
    const qrSlug1 = `test-draw-slug-1-${suffix}`
    const qrSlug2 = `test-draw-slug-2-${suffix}`
    const keyword1 = `Calmness ${suffix}`
    const keyword2 = `Courage ${suffix}`
    const message1 = `Bình yên bắt đầu từ một hơi thở sâu (${suffix})`
    const message2 = `Dũng cảm bước qua nỗi sợ để lớn lên (${suffix})`

    const visitor1 = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guestPage1 = await visitor1.newPage()

    const visitor2 = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guestPage2 = await visitor2.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // The paywall reads the EQ Buddy product; create it when the DB has none
      const existingProduct = await (
        await page.request.get('/api/products?where[slug][equals]=eq-buddy-so&draft=true')
      ).json()
      if (!existingProduct.docs?.length) {
        const prodRes = await page.request.post('/api/products', {
          data: {
            name: '[TEST] EQ Buddy số',
            slug: 'eq-buddy-so',
            web: 'eq',
            type: 'digital_tool',
            trialDays: 21,
            saleStatus: 'on_sale',
            _status: 'published',
          },
        })
        expect(prodRes.ok()).toBe(true)
        createdProductId = (await prodRes.json()).doc?.id
      }

      // 1. Tạo 2 thẻ EQ Buddy test qua REST API /api/eqCards
      const res1 = await page.request.post('/api/eqCards', {
        data: {
          code: cardCode1,
          qrSlug: qrSlug1,
          keywordEn: keyword1,
          message: message1,
          promptRecall: `Gợi nhớ về sự bình yên (${suffix})`,
          promptPack: `Gói ghém khoảnh khắc này (${suffix})`,
          promptAcknowledge: `Ghi nhận bản thân đã hiện diện (${suffix})`,
          order: 9101,
          _status: 'published',
        },
      })
      expect(res1.ok()).toBe(true)
      const data1 = await res1.json()
      createdCardIds.push(data1.doc?.id || data1.id)

      const res2 = await page.request.post('/api/eqCards', {
        data: {
          code: cardCode2,
          qrSlug: qrSlug2,
          keywordEn: keyword2,
          message: message2,
          promptRecall: `Gợi nhớ về lòng dũng cảm (${suffix})`,
          promptPack: `Gói ghém sự kiên định (${suffix})`,
          promptAcknowledge: `Ghi nhận bước đi nhỏ hôm nay (${suffix})`,
          order: 9102,
          _status: 'published',
        },
      })
      expect(res2.ok()).toBe(true)
      const data2 = await res2.json()
      createdCardIds.push(data2.doc?.id || data2.id)

      // 2. Kịch bản 1: Khách mới rút ngẫu nhiên -> lật thẻ -> rút lần 2 gặp màn dùng thử
      await guestPage1.goto('/eq-buddy/rut-the')
      await expect(guestPage1).toHaveURL(/\/eq-buddy\/rut-the$/)

      // Bấm nút rút ngẫu nhiên trong toPass
      await expect(async () => {
        const randomBtn = guestPage1.getByRole('button', { name: /Rút ngẫu nhiên một thẻ/i })
        await expect(randomBtn).toBeVisible()
        await randomBtn.click()
      }).toPass({ timeout: 15000 })

      // Thấy từ khóa và thông điệp mặt trước
      await expect(
        guestPage1.getByRole('heading', { level: 2 }).filter({ hasText: new RegExp(`${suffix}`) }),
      ).toBeVisible({ timeout: 15000 })

      // Bấm lật thẻ sang mặt sau
      await expect(async () => {
        const flipBtn = guestPage1.getByRole('button', { name: /Lật thẻ sang mặt sau/i })
        await expect(flipBtn).toBeVisible()
        await flipBtn.click()
      }).toPass({ timeout: 15000 })

      // Thấy câu hỏi Gợi nhớ ở mặt sau
      await expect(guestPage1.locator('dt', { hasText: 'Gợi nhớ' })).toBeVisible({ timeout: 10000 })

      // Tiếp tục qua bước suy ngẫm
      await expect(async () => {
        const continueBtn = guestPage1.getByRole('button', { name: /Viết suy ngẫm/i })
        await expect(continueBtn).toBeVisible()
        await continueBtn.click()
      }).toPass({ timeout: 10000 })

      // Thấy dòng chữ "Ghi chú chỉ ở trên máy bạn"
      await expect(guestPage1.getByText(/Ghi chú chỉ ở trên máy bạn/i).first()).toBeVisible()

      // Tiếp tục qua bước 5
      await expect(async () => {
        const nextBtn = guestPage1.getByRole('button', { name: /Đi tiếp/i })
        await expect(nextBtn).toBeVisible()
        await nextBtn.click()
      }).toPass({ timeout: 10000 })

      // Thử rút lần thứ 2 -> Bị chặn bởi Paywall dùng thử 21 ngày
      await expect(async () => {
        const drawAnotherBtn = guestPage1.getByRole('button', { name: /Rút thẻ khác/i })
        await expect(drawAnotherBtn).toBeVisible()
        await drawAnotherBtn.click()
      }).toPass({ timeout: 15000 })

      // Màn hình dùng thử hiển thị
      await expect(guestPage1.getByRole('link', { name: /Bắt đầu dùng thử 21 ngày/i })).toBeVisible(
        { timeout: 15000 },
      )

      // 3. Kịch bản 2: Khách mới chọn theo từ khóa đúng thẻ
      await guestPage2.goto('/eq-buddy/rut-the')
      await expect(guestPage2).toHaveURL(/\/eq-buddy\/rut-the$/)

      // Chọn thẻ 2 theo từ khóa keyword2
      await expect(async () => {
        const kwBtn = guestPage2.getByRole('button', { name: new RegExp(keyword2, 'i') })
        await expect(kwBtn).toBeVisible()
        await kwBtn.click()
      }).toPass({ timeout: 15000 })

      // Kiểm tra đúng thẻ 2 đã được rút
      await expect(guestPage2.getByText(keyword2)).toBeVisible({ timeout: 15000 })
      await expect(guestPage2.getByText(message2)).toBeVisible({ timeout: 15000 })
    } finally {
      // 4. Dọn dẹp dữ liệu kiểm thử
      try {
        for (const id of createdCardIds) {
          try {
            await page.request.delete(`/api/eqCards/${id}`)
          } catch {
            // Ignore individual delete errors
          }
        }
        if (createdProductId) {
          await page.request.delete(`/api/products/${createdProductId}`)
        }
        if (adminId) {
          await page.request.delete(`/api/users/${adminId}`)
        }
      } catch {
        // Ignore deletion errors in test cleanup
      } finally {
        await visitor1.close()
        await visitor2.close()
      }
    }
  })
})
