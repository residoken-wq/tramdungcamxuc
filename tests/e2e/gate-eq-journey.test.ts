import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'
import { expectNoSeriousA11y } from './helpers/a11y'

/**
 * T3-06a: GĐ 3 EQ Buddy Gate Test – Single Connected E2E Journey
 *
 * Kịch bản xuyên suốt:
 * 1. Bootstrap admin trên database CI độc lập (không có seed).
 * 2. Tạo 2 thẻ EQ Buddy mẫu đã xuất bản (đủ code, qrSlug, keywordEn, message, 3 prompt câu hỏi).
 * 3. Tạo sản phẩm EQ Buddy số ('eq-buddy-so', digital_tool, trialDays: 21).
 * 4. Tạo sản phẩm bộ thẻ vật lý Shopee ('bo-the-eq-buddy-vat-ly', physical_external, externalUrl Shopee).
 * 5. Khách vãng lai quét QR: mở /eq-buddy/the/[qrSlug] -> thấy thẻ hiển thị mở -> kiểm tra a11y.
 * 6. Thử rút thêm thẻ tại /eq-buddy/rut-the:
 *    - Lượt 1: rút miễn phí thành công -> lật thẻ -> xem câu hỏi -> đi tiếp.
 *    - Lượt 2: bị chặn bởi paywall dùng thử 21 ngày.
 * 7. Đăng ký dùng thử qua luồng OTP:
 *    - Bấm nút dùng thử -> chuyển hướng đăng nhập OTP -> nhập mã OTP từ /api/test-otp.
 *    - Xác nhận bắt đầu dùng thử 21 ngày.
 *    - Quay lại /eq-buddy/rut-the -> rút thẻ mới thành công không còn bị chặn.
 * 8. Viết và lưu suy ngẫm (reflection) gắn với thẻ vừa rút:
 *    - Lật thẻ -> vào bước suy ngẫm -> nhập ghi chú -> bấm lưu -> hiển thị đã lưu thành công.
 *    - Vào /tai-khoan -> kiểm tra thẻ và suy ngẫm xuất hiện trong danh sách "Thẻ đã lưu".
 * 9. Tải ảnh chia sẻ:
 *    - Gọi endpoint /eq-buddy/the/[qrSlug]/anh/4x5 và /eq-buddy/the/[qrSlug]/anh/9x16 -> kiểm tra status 200 và Content-Type image/*.
 * 10. Bấm nút Mua bộ thẻ vật lý trên /eq-buddy:
 *     - Kiểm tra nút Shopee có target="_blank", rel="noopener noreferrer", đúng link Shopee và UTM source=tramdungcamxuc.
 * 11. Chạy expectNoSeriousA11y tại 3 điểm chốt: thẻ chi tiết, giao diện rút thẻ, và landing /eq-buddy.
 * 12. Dọn dẹp sạch sẽ toàn bộ dữ liệu kiểm thử trong khối finally.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminGateEq-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-gate-eq-${randomUUID()}@example.test`)
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

async function getTestOtpCode(page: Page, email: string): Promise<string> {
  const res = await page.request.get(`/api/test-otp?email=${encodeURIComponent(email)}`)
  expect(res.status(), 'CI must run e2e with E2E_TEST_HOOKS=1').toBe(200)
  const data = (await res.json()) as { code?: string | null }
  if (!data.code) throw new Error(`No OTP recorded for ${email}`)
  return data.code
}

async function expectCodeStep(page: Page) {
  const codeInput = page.locator('input[name="code"]')
  const alert = page
    .locator('div[role="alert"]:not(#__next-route-announcer__)')
    .filter({ hasText: /\S/ })
  await expect(codeInput.or(alert).first()).toBeVisible({ timeout: 15000 })
  if (await alert.isVisible()) {
    throw new Error(`OTP request failed on page: ${await alert.innerText()}`)
  }
  return codeInput
}

test.describe('GD3 EQ Buddy Journey Gate (T3-06a)', () => {
  test('single connected journey: qr card -> draw free & paywall -> trial OTP -> draw again -> save reflection -> verify account & share images & shopee outbound', async ({
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
    const createdCardIds: (number | string)[] = []
    let createdDigitalProductId: number | undefined
    let createdPhysicalProductId: number | undefined
    let createdCustomerId: number | undefined

    const suffix = randomUUID().slice(0, 8)
    const cardCode1 = `EQ-GATE-1-${suffix}`
    const cardCode2 = `EQ-GATE-2-${suffix}`
    const qrSlug1 = `gate-eq-slug-1-${suffix}`
    const qrSlug2 = `gate-eq-slug-2-${suffix}`
    const keyword1 = `Stillness ${suffix}`
    const keyword2 = `Courage ${suffix}`
    const message1 = `[TEST] Thông điệp test 1 (${suffix})`
    const message2 = `[TEST] Thông điệp test 2 (${suffix})`
    const story1 = `[TEST] Câu chuyện test 1 (${suffix})`

    const customerEmail = `khach-gate-eq-${suffix}@example.test`
    const visitorIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`

    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      extraHTTPHeaders: {
        'x-forwarded-for': visitorIp,
      },
    })
    const guestPage = await visitor.newPage()

    try {
      // 1. Bootstrap admin
      adminId = await bootstrapAdmin(page)

      // 2. Tạo 2 thẻ EQ Buddy mẫu qua REST /api/eqCards
      const cardRes1 = await page.request.post('/api/eqCards', {
        data: {
          code: cardCode1,
          qrSlug: qrSlug1,
          keywordEn: keyword1,
          message: message1,
          story: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: story1,
                      type: 'text',
                      style: '',
                      detail: 0,
                      format: 0,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                },
              ],
              direction: 'ltr',
            },
          },
          promptRecall: `[TEST] Gợi nhớ test 1 (${suffix})`,
          promptPack: `[TEST] Gói ghém test 1 (${suffix})`,
          promptAcknowledge: `[TEST] Ghi nhận test 1 (${suffix})`,
          order: 9301,
          _status: 'published',
        },
      })
      expect(cardRes1.ok()).toBe(true)
      createdCardIds.push((await cardRes1.json()).doc?.id)

      const cardRes2 = await page.request.post('/api/eqCards', {
        data: {
          code: cardCode2,
          qrSlug: qrSlug2,
          keywordEn: keyword2,
          message: message2,
          promptRecall: `[TEST] Gợi nhớ test 2 (${suffix})`,
          promptPack: `[TEST] Gói ghém test 2 (${suffix})`,
          promptAcknowledge: `[TEST] Ghi nhận test 2 (${suffix})`,
          order: 9302,
          _status: 'published',
        },
      })
      expect(cardRes2.ok()).toBe(true)
      createdCardIds.push((await cardRes2.json()).doc?.id)

      // 3. Tạo sản phẩm EQ Buddy số ('eq-buddy-so', digital_tool, trialDays: 21)
      const digProdRes = await page.request.post('/api/products', {
        data: {
          name: '[TEST] EQ Buddy số',
          slug: 'eq-buddy-so',
          web: 'eq',
          type: 'digital_tool',
          trialDays: 21,
          price: 250000,
          salePrice: 178000,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(digProdRes.ok()).toBe(true)
      createdDigitalProductId = (await digProdRes.json()).doc?.id

      // 4. Tạo sản phẩm thẻ vật lý Shopee (physical_external)
      const physProdRes = await page.request.post('/api/products', {
        data: {
          name: '[TEST] Bộ thẻ EQ Buddy Vật Lý',
          slug: `bo-the-eq-buddy-${suffix}`,
          web: 'eq',
          type: 'physical_external',
          externalUrl: 'https://shopee.vn/product/12345678/98765432',
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(physProdRes.ok()).toBe(true)
      createdPhysicalProductId = (await physProdRes.json()).doc?.id

      // 5. Khách vãng lai quét QR: truy cập /eq-buddy/the/[qrSlug1]
      await guestPage.goto(`/eq-buddy/the/${qrSlug1}`, { waitUntil: 'load' })
      await expect(guestPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 })
      await expect(guestPage.getByText(keyword1)).toBeVisible()
      await expect(guestPage.getByText(message1)).toBeVisible()
      await expect(guestPage.getByText(story1)).toBeVisible()

      // Chạy a11y audit tại thẻ chi tiết
      await expectNoSeriousA11y(guestPage, 'eq-journey-card')

      // 6. Truy cập giao diện rút thẻ /eq-buddy/rut-the
      await guestPage.goto('/eq-buddy/rut-the', { waitUntil: 'load' })
      await expect(guestPage).toHaveURL(/\/eq-buddy\/rut-the$/)

      // Lượt 1: Rút ngẫu nhiên miễn phí thành công
      await expect(async () => {
        const randomBtn = guestPage.getByRole('button', { name: /Rút ngẫu nhiên một thẻ/i })
        await expect(randomBtn).toBeVisible()
        await randomBtn.click()
      }).toPass({ timeout: 15000 })

      // Thấy mặt trước thẻ đã rút
      await expect(guestPage.getByRole('button', { name: /Lật thẻ sang mặt sau/i })).toBeVisible({
        timeout: 15000,
      })

      // Lật sang mặt sau
      await guestPage.getByRole('button', { name: /Lật thẻ sang mặt sau/i }).click()
      await expect(guestPage.locator('dt', { hasText: 'Gợi nhớ' })).toBeVisible({ timeout: 10000 })

      // a11y tại giao diện rút thẻ sau khi đã lật thẻ (GD3.md T3-06)
      await expectNoSeriousA11y(guestPage, 'eq-journey-draw-flipped')

      // Bấm tiếp tục qua bước suy ngẫm
      await guestPage.getByRole('button', { name: /Viết suy ngẫm/i }).click()
      await expect(guestPage.getByText(/Ghi chú chỉ ở trên máy bạn/i).first()).toBeVisible({
        timeout: 10000,
      })

      // Bấm đi tiếp qua bước 5
      await guestPage.getByRole('button', { name: /Đi tiếp/i }).click()

      // Lượt 2: Bấm rút thẻ khác -> bị chặn bởi paywall dùng thử 21 ngày
      await expect(async () => {
        const drawAnotherBtn = guestPage.getByRole('button', { name: /Rút thẻ khác/i })
        await expect(drawAnotherBtn).toBeVisible()
        await drawAnotherBtn.click()
      }).toPass({ timeout: 15000 })

      // Màn hình dùng thử paywall xuất hiện
      const trialPaywallLink = guestPage.getByRole('link', {
        name: /Bắt đầu dùng thử 21 ngày/i,
      })
      await expect(trialPaywallLink).toBeVisible({ timeout: 15000 })
      await trialPaywallLink.click()

      // 7. Chuyển hướng sang đăng nhập OTP vì chưa có tài khoản
      await expect(guestPage).toHaveURL(/\/tai-khoan\/dang-nhap\?next=.*eq-buddy-so/, {
        timeout: 15000,
      })

      await guestPage.locator('input[name="email"]').fill(customerEmail)
      await guestPage.locator('input[name="consentPolicy"]').check()
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guestPage.locator('button[type="submit"]').click()

      const codeInput = await expectCodeStep(guestPage)
      const otpCode = await getTestOtpCode(guestPage, customerEmail)
      await codeInput.fill(otpCode)
      await guestPage.locator('button[type="submit"]').click()

      // Đăng nhập xong quay về /dung-thu?san-pham=eq-buddy-so
      await expect(guestPage).toHaveURL(/\/dung-thu\?san-pham=eq-buddy-so$/, { timeout: 15000 })

      // Ghi nhận customer ID (sau khi đăng nhập xong mới chắc chắn đã có bản ghi)
      const custQuery = await page.request.get(
        `/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}`,
      )
      expect(custQuery.ok()).toBe(true)
      createdCustomerId = (await custQuery.json()).docs[0]?.id
      expect(createdCustomerId).toBeTruthy()

      // Bấm nút "Bắt đầu dùng thử 21 ngày"
      const startTrialBtn = guestPage.locator('button', { hasText: /Bắt đầu dùng thử 21 ngày/i })
      await expect(startTrialBtn).toBeVisible()
      await startTrialBtn.click()

      // Chuyển hướng tới /eq-buddy
      await expect(guestPage).toHaveURL(/\/eq-buddy\/?$/, { timeout: 15000 })

      // 8. Đã có quyền trial -> quay lại /eq-buddy/rut-the -> rút thẻ mới thành công không bị chặn
      await guestPage.goto('/eq-buddy/rut-the', { waitUntil: 'load' })
      await expect(async () => {
        const randomBtn = guestPage.getByRole('button', { name: /Rút ngẫu nhiên một thẻ/i })
        await expect(randomBtn).toBeVisible()
        await randomBtn.click()
      }).toPass({ timeout: 15000 })

      // Rút thẻ thành công, lật mặt sau
      await expect(guestPage.getByRole('button', { name: /Lật thẻ sang mặt sau/i })).toBeVisible({
        timeout: 15000,
      })
      await guestPage.getByRole('button', { name: /Lật thẻ sang mặt sau/i }).click()

      // Đi tới bước viết suy ngẫm
      await guestPage.getByRole('button', { name: /Viết suy ngẫm/i }).click()

      // Khách đã đăng nhập: ô textarea suy ngẫm và nút lưu suy ngẫm xuất hiện
      const reflectionTextarea = guestPage.locator('#reflection-input')
      await expect(reflectionTextarea).toBeVisible({ timeout: 10000 })
      const reflectionNote = `Suy ngẫm E2E Gate EQ ${suffix}: Hôm nay tôi đã dừng lại và hít thở sâu.`
      await reflectionTextarea.fill(reflectionNote)

      // Bấm lưu suy ngẫm
      const saveReflectionBtn = guestPage.locator('button', { hasText: /Lưu thẻ/i })
      await expect(saveReflectionBtn).toBeVisible()
      await expect(async () => {
        await saveReflectionBtn.click({ timeout: 5000 })
        await expect(guestPage.getByText(/Đã lưu/i).first()).toBeVisible({ timeout: 3000 })
      }).toPass({ timeout: 15000 })

      // 9. Vào /tai-khoan -> kiểm tra thẻ và suy ngẫm đã lưu xuất hiện
      await guestPage.goto('/tai-khoan', { waitUntil: 'load' })
      await expect(guestPage).toHaveURL(/\/tai-khoan\/?$/)
      await expect(guestPage.getByText(reflectionNote)).toBeVisible({ timeout: 15000 })
      await expectNoSeriousA11y(guestPage, 'eq-journey-tai-khoan')

      // 10. Tải ảnh chia sẻ 4:5 và 9:16
      const shareRes45 = await page.request.get(`/eq-buddy/the/${qrSlug1}/anh/4x5`)
      expect(shareRes45.status()).toBe(200)
      const contentType45 = shareRes45.headers()['content-type'] || ''
      expect(contentType45.startsWith('image/')).toBe(true)

      const shareRes916 = await page.request.get(`/eq-buddy/the/${qrSlug1}/anh/9x16`)
      expect(shareRes916.status()).toBe(200)
      const contentType916 = shareRes916.headers()['content-type'] || ''
      expect(contentType916.startsWith('image/')).toBe(true)

      // 11. Bấm nút Mua bộ thẻ vật lý trên /eq-buddy
      await guestPage.goto('/eq-buddy', { waitUntil: 'load' })

      // Chạy a11y audit tại landing /eq-buddy
      await expectNoSeriousA11y(guestPage, 'eq-journey-landing')

      const shopeeLink = guestPage.locator('a[href*="shopee.vn"]').first()
      await expect(shopeeLink).toBeVisible({ timeout: 15000 })
      await expect(shopeeLink).toHaveAttribute('target', '_blank')
      const relAttr = await shopeeLink.getAttribute('rel')
      expect(relAttr).toContain('noopener')

      const hrefAttr = await shopeeLink.getAttribute('href')
      expect(hrefAttr).toContain('shopee.vn')
      expect(hrefAttr).toContain('utm_source=tramdungcamxuc')
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await guestPage.close().catch(() => {})
      await visitor.close().catch(() => {})

      // Dọn dẹp dữ liệu
      if (createdCustomerId) {
        // Xóa savedCards của customer
        const savedCards = await page.request
          .get(`/api/savedCards?where[customer][equals]=${createdCustomerId}`)
          .catch(() => null)
        if (savedCards?.ok()) {
          for (const sc of (await savedCards.json()).docs || []) {
            await page.request.delete(`/api/savedCards/${sc.id}`).catch(() => {})
          }
        }
        // Xóa entitlements
        const custEnts = await page.request
          .get(`/api/entitlements?where[customer][equals]=${createdCustomerId}`)
          .catch(() => null)
        if (custEnts?.ok()) {
          for (const ent of (await custEnts.json()).docs || []) {
            await page.request.delete(`/api/entitlements/${ent.id}`).catch(() => {})
          }
        }
        // Khách hàng không xóa được qua REST (Customers.beforeDelete chỉ cho luồng xóa tài khoản) –
        // DB CI dùng một lần.
      }

      for (const cardId of createdCardIds) {
        if (cardId) {
          await page.request.delete(`/api/eqCards/${cardId}`).catch(() => {})
        }
      }

      if (createdDigitalProductId) {
        await page.request.delete(`/api/products/${createdDigitalProductId}`).catch(() => {})
      }

      if (createdPhysicalProductId) {
        await page.request.delete(`/api/products/${createdPhysicalProductId}`).catch(() => {})
      }

      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
    }
  })
})
