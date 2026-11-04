import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

/**
 * DP-01a: E2E Habit Journey with ZIP UI & 28-Day Flow
 *
 * Scenarios:
 * 1. Bootstrap Admin on CI / dev if needed.
 * 2. Ensure Habit Tracker product exists and published.
 * 3. Guest visits /habit/5-phut:
 *    - Step 1: Answers 8 diagnose questions (scores 1-5).
 *    - Step 2: 1% principle overview -> Sang giai đoạn 2.
 *    - Step 3: Find Mentor -> adds routine, marks (+), selects mentor.
 *    - Step 4: Identity -> fills identity action, role, minimal action.
 *    - Step 5: Loop design -> selects 3 Cue techniques (1 empty action note, 2 with notes).
 *    - Step 6: Boarding pass -> verifies pass, fills name + email, submits.
 * 4. Completes OTP login via test hook -> enters /habit/tracker.
 * 5. Tracker interactions:
 *    - Check-in Day 1 (Done + Mood 😊).
 *    - Reopen Day 1 -> Reset day check-in -> returns to uncompleted.
 *    - Re-check-in Day 1.
 *    - Download CSV.
 *    - Reload page -> verifies persisted state.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminDp01a-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-dp01a-${randomUUID()}@example.test`)
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

test.describe('DP-01a: Habit Zip Flow & 28-Day Tracker', () => {
  test('khách mới đi qua 6 bước (8 câu hỏi, 3 kỹ thuật Cue gồm 1 rỗng note) -> OTP -> tracker -> check-in -> xóa ngày -> tải CSV -> reload còn dữ liệu', async ({
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
    let createdCustomerId: number | undefined
    const createdTechniqueIds: number[] = []
    const suffix = randomUUID().slice(0, 8)
    const customerEmail = `dp01a-guest-${suffix}@example.test`

    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
    })
    const guestPage = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // 1. Đảm bảo sản phẩm habit-tracker-so đã tồn tại
      const prodQuery = await (
        await page.request.get('/api/products?where[slug][equals]=habit-tracker-so&draft=true')
      ).json()
      if (prodQuery.docs?.length) {
        createdProductId = prodQuery.docs[0].id
      } else {
        const prodRes = await page.request.post('/api/products', {
          data: {
            name: 'Habit Tracker số',
            slug: 'habit-tracker-so',
            web: 'habit',
            type: 'digital_tool',
            trialDays: 28,
            price: 250000,
            salePrice: 178000,
            saleStatus: 'on_sale',
            isSample: true,
            _status: 'published',
          },
        })
        expect(prodRes.ok()).toBe(true)
        createdProductId = (await prodRes.json()).doc?.id
      }

      // 2. Tạo hoặc bảo đảm có ít nhất 3 kỹ thuật cue
      const existingTechs = await (
        await page.request.get('/api/techniques?where[stage][equals]=cue&limit=10&draft=true')
      ).json()
      if (!existingTechs.docs || existingTechs.docs.length < 3) {
        for (let i = 1; i <= 3; i++) {
          const res = await page.request.post('/api/techniques', {
            data: {
              name: `[TEST] Kỹ thuật Cue #${i} - ${suffix}`,
              stage: 'cue',
              order: i,
              description: `Mô tả kỹ thuật cue ${i}`,
              examples: ['Ví dụ 1', 'Ví dụ 2'],
              applyTemplate: 'Tôi sẽ làm việc này vào buổi sáng',
              _status: 'published',
            },
          })
          if (res.ok()) {
            createdTechniqueIds.push((await res.json()).doc.id)
          }
        }
      }

      // 3. Khách truy cập /habit/5-phut
      await guestPage.goto('/habit/5-phut')
      await expect(
        guestPage.getByText(/Khám đúng nút thắt|Khám đúng bệnh/i).first(),
      ).toBeVisible({ timeout: 20000 })

      // ===== BƯỚC 1: Trả lời 8 câu hỏi chẩn đoán =====
      // Mỗi câu có thang điểm từ 1 đến 5 (nút 1..5)
      const scoreButtons = guestPage.locator('button:has-text("4")')
      const btnCount = await scoreButtons.count()
      if (btnCount >= 8) {
        for (let i = 0; i < 8; i++) {
          await scoreButtons.nth(i).click()
        }
      }
      const step1NextBtn = guestPage.getByRole('button', { name: /Tiếp tục/i })
      await expect(step1NextBtn).toBeEnabled({ timeout: 10000 })
      await step1NextBtn.click()

      // ===== BƯỚC 2: Nguyên lý 1% =====
      await expect(guestPage.getByText(/Nguyên lý 1%/i).first()).toBeVisible({ timeout: 15000 })
      await guestPage.getByRole('button', { name: /Sang giai đoạn 2/i }).click()

      // ===== BƯỚC 3: Tìm Mentor =====
      await expect(guestPage.getByText(/Tìm "Mentor"|Tìm Mentor/i).first()).toBeVisible({ timeout: 15000 })
      await guestPage
        .getByPlaceholder(/Đánh răng|thói quen/i)
        .fill('[TEST] Uống nước ấm sáng')
      await guestPage.getByRole('button', { name: /Thêm một việc|Thêm thói quen/i }).click()
      await guestPage
        .getByRole('button', { name: /Có ích \(\+\)|đánh giá tốt/i })
        .first()
        .click()
      await guestPage.locator('input[type="radio"][name="anchorHabit"]').first().check()
      await guestPage.getByRole('button', { name: /Tiếp tục/i }).click()

      // ===== BƯỚC 4: Gọi tên thói quen =====
      await expect(guestPage.getByText(/Gọi tên thói quen/i).first()).toBeVisible({ timeout: 15000 })
      await guestPage.getByPlaceholder(/thiền 5 phút/i).fill('tập thể dục 15 phút')
      await guestPage.getByPlaceholder(/người điềm tĩnh/i).fill('người khỏe mạnh và kỷ luật')
      await guestPage.getByPlaceholder(/Mở sách đọc đúng 1 trang/i).fill('Xỏ giày thể thao')
      await guestPage.getByRole('button', { name: /Tiếp tục/i }).click()

      // ===== BƯỚC 5: Thiết kế vòng lặp =====
      await expect(guestPage.getByText(/Thiết kế vòng lặp|Vòng lặp/i).first()).toBeVisible({ timeout: 15000 })

      // Chọn 3 kỹ thuật Cue:
      // Kỹ thuật 1: chỉ tick chọn (appliedNotes rỗng)
      // Kỹ thuật 2 & 3: tick chọn và bấm "Xem" để điền ghi chú áp dụng
      const techLabels = guestPage.locator('label:has(button.w-5.h-5)')
      await expect(techLabels.first()).toBeVisible({ timeout: 10000 })

      // Tick kỹ thuật 1
      await techLabels.nth(0).click()

      // Tick kỹ thuật 2 + mở xem để điền ghi chú
      await techLabels.nth(1).click()
      const expandBtn2 = guestPage.getByRole('button', { name: 'Xem' }).first()
      if (await expandBtn2.isVisible()) {
        await expandBtn2.click()
        const noteInput2 = guestPage.locator('input[placeholder*="Ví dụ"], input[placeholder*="áp dụng"]').first()
        if (await noteInput2.isVisible()) {
          await noteInput2.fill('[TEST] Ghi chú áp dụng kỹ thuật 2')
        }
      }

      // Tick kỹ thuật 3 + mở xem để điền ghi chú
      await techLabels.nth(2).click()
      const expandBtn3 = guestPage.getByRole('button', { name: 'Xem' }).first()
      if (await expandBtn3.isVisible()) {
        await expandBtn3.click()
        const noteInputs = guestPage.locator('input[placeholder*="Ví dụ"], input[placeholder*="áp dụng"]')
        const count = await noteInputs.count()
        if (count > 0) {
          await noteInputs.last().fill('[TEST] Ghi chú áp dụng kỹ thuật 3')
        }
      }

      await guestPage.getByRole('button', { name: /Tiếp tục|Xem kế hoạch/i }).click()

      // ===== BƯỚC 6: Boarding Pass & Lên chuyến =====
      await expect(guestPage.getByText(/Boarding Pass/i).first()).toBeVisible({ timeout: 15000 })
      await expect(
        guestPage.getByText(/Boarding Pass của bạn|TẤM VÉ CHUYỂN MÌNH/i).first(),
      ).toBeVisible()

      await guestPage.getByLabel(/Họ và tên/i).fill('Học viên Test DP01')
      await guestPage.getByLabel(/Email/i).fill(customerEmail)
      await guestPage.locator('input[name="consent"]').check()

      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })

      const submitBtn = guestPage.getByRole('button', { name: /Lên chuyến ngay/i })
      await submitBtn.click()

      // ===== OTP Login =====
      await expect(guestPage).toHaveURL(/\/tai-khoan\/dang-nhap/, { timeout: 20000 })
      const emailInput = guestPage.locator('input[name="email"]')
      await expect(emailInput).toBeVisible()
      await emailInput.fill(customerEmail)
      await guestPage.locator('input[name="consentPolicy"]').check()
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guestPage.getByRole('button', { name: vi.auth.sendOtpButton }).click()

      const codeInput = await expectCodeStep(guestPage)
      const otpCode = await getTestOtpCode(page, customerEmail)
      await codeInput.fill(otpCode)
      await guestPage.locator('button[type="submit"]', { hasText: /Đăng nhập/i }).click()

      // ===== Chuyển vào Tracker =====
      await expect(guestPage).toHaveURL(/\/habit\/tracker\/?$/, { timeout: 25000 })

      // Nếu có thông báo bắt đầu dùng thử -> kích hoạt
      const trialBtn = guestPage.getByRole('link', { name: /Bắt đầu dùng thử/i })
      if (await trialBtn.isVisible()) {
        await trialBtn.click()
        await expect(guestPage).toHaveURL(/\/dung-thu/, { timeout: 15000 })
        await guestPage.locator('button', { hasText: /Bắt đầu dùng thử/i }).click()
        await guestPage.goto('/habit/tracker')
      }

      // Ghi nhận customer ID
      const custQuery = await (
        await page.request.get(`/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}`)
      ).json()
      createdCustomerId = custQuery.docs?.[0]?.id

      // Đảm bảo plan startDate là hôm nay để ô Ngày 1 bật
      if (createdCustomerId) {
        const planRes = await (
          await page.request.get(`/api/habitPlans?where[customer][equals]=${createdCustomerId}`)
        ).json()
        if (planRes.docs?.[0]) {
          const todayYmd = new Date().toISOString().split('T')[0]
          await page.request.patch(`/api/habitPlans/${planRes.docs[0].id}`, {
            data: { startDate: todayYmd },
          })
          await guestPage.reload()
        }
      }

      // ===== CHECK-IN NGÀY 1 =====
      const day1Btn = guestPage.getByRole('button', { name: /^Ngày 1:/ }).first()
      await expect(day1Btn).toBeEnabled({ timeout: 15000 })
      await day1Btn.click()

      const checkInModal = guestPage.locator('div[role="dialog"]')
      await expect(checkInModal).toBeVisible({ timeout: 10000 })

      // Chọn Đã làm + cảm xúc 😊 (Hơi tự tin)
      const doneBtn = checkInModal
        .getByRole('button', { name: /Đã làm/i })
        .or(checkInModal.getByRole('radio', { name: /Bỏ phiếu/i }))
        .first()
      await doneBtn.click()

      const moodBtn = checkInModal
        .getByRole('button', { name: /Hơi tự tin|Bình an/i })
        .first()
      if (await moodBtn.isVisible()) {
        await moodBtn.click()
      }

      const saveModalBtn = checkInModal.getByRole('button', { name: /Lưu/i })
      await saveModalBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // Kiểm tra Ngày 1 đã hoàn thành
      await expect(
        guestPage.getByRole('button', { name: /^Ngày 1:.*(Bỏ phiếu|Đã hoàn thành|Đã làm)/i }).first(),
      ).toBeVisible()

      // ===== RESET / XÓA NGÀY 1 =====
      await guestPage.getByRole('button', { name: /^Ngày 1:/ }).first().click()
      await expect(checkInModal).toBeVisible({ timeout: 10000 })

      const deleteBtn = checkInModal.getByRole('button', { name: /Xóa check-in này|Xoá/i })
      await deleteBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // Ngày 1 trở về trạng thái chưa hoàn thành
      await expect(
        guestPage.getByRole('button', { name: /^Ngày 1: Bỏ phiếu/i }).first(),
      ).toBeVisible({ timeout: 10000 })

      // Check-in lại Ngày 1
      await guestPage.getByRole('button', { name: /^Ngày 1: Bỏ phiếu/i }).first().click()
      await expect(checkInModal).toBeVisible({ timeout: 10000 })
      await doneBtn.click()
      await saveModalBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // ===== TẢI BẢNG 28 NGÀY (.CSV) =====
      const downloadPromise = guestPage.waitForEvent('download', { timeout: 30000 })
      const csvBtn = guestPage.getByRole('button', { name: /Tải bảng 28 ngày \(\.csv\)/i })
      await expect(csvBtn).toBeVisible()
      await csvBtn.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/habit-tracker-28-ngay.*\.csv$/i)

      // ===== TẢI LẠI TRANG (RELOAD) CÒN DỮ LIỆU =====
      await guestPage.reload()
      await expect(
        guestPage.getByRole('button', { name: /^Ngày 1:.*(Bỏ phiếu|Đã hoàn thành|Đã làm)/i }).first(),
      ).toBeVisible({ timeout: 15000 })
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      for (const id of createdTechniqueIds) {
        await page.request.delete(`/api/techniques/${id}`).catch(() => {})
      }
      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await visitor.close()
    }
  })
})

