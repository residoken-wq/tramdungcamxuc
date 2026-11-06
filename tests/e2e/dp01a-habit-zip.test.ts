import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import * as zip from './helpers/habit-zip'
import { vi } from '@/lib/i18n/vi'
import { getVietnamYmd } from '@/lib/habit/tracker-stats'

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
      // Sản phẩm có sẵn thì dùng lại và không xoá khi dọn dẹp
      if (!prodQuery.docs?.length) {
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

      // 2. Tạo 3 kỹ thuật Cue riêng cho lần chạy này
      const cueNames: string[] = []
      for (let i = 1; i <= 3; i++) {
        const name = `[TEST] Kỹ thuật Cue #${i} - ${suffix}`
        const res = await page.request.post('/api/techniques', {
          data: {
            name,
            stage: 'cue',
            order: i,
            description: `Mô tả kỹ thuật cue ${i}`,
            examples: ['Ví dụ 1', 'Ví dụ 2'],
            applyTemplate: 'Tôi sẽ làm việc này vào buổi sáng',
            _status: 'published',
          },
        })
        expect(res.ok(), await res.text()).toBe(true)
        createdTechniqueIds.push((await res.json()).doc.id)
        cueNames.push(name)
      }

      // 3. Khách đăng nhập và đi 6 bước zip (helpers/habit-zip.ts, DP-03)
      await zip.loginHabitCustomer(guestPage, customerEmail, '/habit/5-phut')

      // Bước 1: đúng 8 câu hỏi của bản zip (mặc định hoặc từ CMS)
      const questionGroups = guestPage
        .getByRole('group')
        .filter({ has: guestPage.getByRole('button', { name: '1', exact: true }) })
      await expect(questionGroups.first()).toBeVisible({ timeout: 20000 })
      await expect(questionGroups).toHaveCount(8)
      await zip.answerDiagnose(guestPage)
      await zip.passPercent(guestPage)
      await zip.fillMentor(guestPage, '[TEST] Uống nước ấm sáng')
      await zip.fillIdentity(guestPage, {
        action: 'tập thể dục 15 phút',
        role: 'người khỏe mạnh và kỷ luật',
        atomic: 'Xỏ giày thể thao',
      })
      await zip.setRhythm(guestPage, '5 lần một tuần')
      await zip.nextFromIdentity(guestPage)

      // Bước 5: 3 kỹ thuật Cue (không còn giới hạn 2 / giai đoạn), 1 kỹ thuật để trống ghi chú
      expect(cueNames.length).toBe(3)
      await zip.pickTechniques(guestPage, [
        { name: cueNames[0] },
        { name: cueNames[1], note: '[TEST] Ghi chú áp dụng kỹ thuật 2' },
        { name: cueNames[2], note: '[TEST] Ghi chú áp dụng kỹ thuật 3' },
      ])
      await zip.nextFromLoop(guestPage)

      // Bước 6: lên chuyến (lưu kế hoạch), rồi vào tracker qua OTP
      await zip.fillBoarding(guestPage, { name: 'Học viên Test DP01', email: customerEmail })
      await zip.submitBoarding(guestPage)
      await guestPage.getByRole('link', { name: /Vào bảng theo dõi 28 ngày/ }).click()

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

      // Khách mới chưa có quyền dùng: tracker mời dùng thử -> /dung-thu -> kích hoạt -> quay lại tracker
      await guestPage.getByRole('link', { name: /Bắt đầu dùng thử 28 ngày/i }).click()
      await expect(guestPage).toHaveURL(/\/dung-thu/, { timeout: 15000 })
      await guestPage.locator('button', { hasText: /Bắt đầu dùng thử 28 ngày/i }).click()
      await expect(guestPage).toHaveURL(/\/habit\/hoc\/?$/, { timeout: 15000 })
      await guestPage.goto('/habit/tracker')
      await expect(guestPage.getByText('Lưới 28 ngày theo dõi')).toBeVisible({ timeout: 15000 })
      // Z1: Tiêu đề tracker là "28 NGÀY THÀNH {personText}"
      await expect(
        guestPage.getByRole('heading', {
          level: 2,
          name: /28 ngày thành người khỏe mạnh và kỷ luật/i,
        }),
      ).toBeVisible({ timeout: 15000 })

      // Ghi nhận customer ID
      const custQuery = await (
        await page.request.get(
          `/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}`,
        )
      ).json()
      createdCustomerId = custQuery.docs?.[0]?.id

      // Đảm bảo plan startDate là hôm nay để ô Ngày 1 bật
      if (createdCustomerId) {
        const planRes = await (
          await page.request.get(`/api/habitPlans?where[customer][equals]=${createdCustomerId}`)
        ).json()
        if (planRes.docs?.[0]) {
          // Tracker counts days in Vietnam time (DP-02c): a UTC date is yesterday after 17:00 UTC.
          const todayYmd = getVietnamYmd()
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
      const doneBtn = checkInModal.getByRole('button', { name: vi.dp01.statusDone })
      await doneBtn.click()
      await checkInModal.getByRole('button', { name: /Hơi tự tin/ }).click()

      const saveModalBtn = checkInModal.getByRole('button', { name: vi.dp01.save, exact: true })
      await saveModalBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // Kiểm tra Ngày 1 đã hoàn thành
      await expect(
        guestPage
          .getByRole('button', { name: /^Ngày 1:.*(Bỏ phiếu|Đã hoàn thành|Đã làm)/i })
          .first(),
      ).toBeVisible()

      // ===== RESET / XÓA NGÀY 1 =====
      await guestPage
        .getByRole('button', { name: /^Ngày 1:/ })
        .first()
        .click()
      await expect(checkInModal).toBeVisible({ timeout: 10000 })

      const deleteBtn = checkInModal.getByRole('button', { name: vi.dp01.deleteCheckinButton })
      await deleteBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // Ngày 1 trở về trạng thái chưa hoàn thành
      await expect(
        guestPage.getByRole('button', { name: /^Ngày 1: Bỏ phiếu/i }).first(),
      ).toBeVisible({ timeout: 10000 })

      // Check-in lại Ngày 1
      await guestPage
        .getByRole('button', { name: /^Ngày 1: Bỏ phiếu/i })
        .first()
        .click()
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
      expect(download.suggestedFilename()).toMatch(/\.csv$/i)

      // ===== TẢI LẠI TRANG (RELOAD) CÒN DỮ LIỆU =====
      await guestPage.reload()
      await expect(
        guestPage
          .getByRole('button', { name: /^Ngày 1:.*(Bỏ phiếu|Đã hoàn thành|Đã làm)/i })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      // ===== KHÔI PHỤC TỪ FILE (CÓ HỘP THOẠI XÁC NHẬN - DP-02) =====
      const backupPayload = JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        habitPlan: {
          identityStatement: 'Tôi sẽ tập thể dục 15 phút để trở thành người khỏe mạnh và kỷ luật',
          rhythm: '5_per_week',
        },
        checkins: [
          {
            dayNumber: 1,
            status: 'minimal',
            emotion: 'confident',
            emotionLabel: 'Tự tin',
            note: 'Khôi phục từ file backup zip',
          },
        ],
      })

      await guestPage.locator('input[type="file"][accept*="application/json"]').setInputFiles({
        name: 'backup-dp02.json',
        mimeType: 'application/json',
        buffer: Buffer.from(backupPayload, 'utf-8'),
      })

      const restoreModal = guestPage.locator('div[role="dialog"]').filter({
        hasText: vi.hb13.restoreModal.title,
      })
      await expect(restoreModal).toBeVisible({ timeout: 10000 })
      await expect(restoreModal).toContainText('ghi đè tối đa 1 ngày check-in')

      const confirmRestoreBtn = restoreModal.getByRole('button', {
        name: vi.hb13.restoreModal.confirmButton,
      })
      await confirmRestoreBtn.click()
      await expect(restoreModal).toBeHidden({ timeout: 10000 })
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      for (const id of createdTechniqueIds) {
        await page.request.delete(`/api/techniques/${id}`).catch(() => {})
      }
      if (createdProductId) {
        await zip.deleteTestProduct(page, createdProductId)
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await visitor.close()
    }
  })
})
