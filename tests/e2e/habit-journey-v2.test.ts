import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

/**
 * HB-15: E2E toàn bộ hành trình Habit v2 (6 bước + tracker + check-in + CSV + suy ngẫm + đồng hành).
 *
 * Chạy trên cả 2 project: desktop-1440 và mobile-375.
 *
 * Kịch bản:
 * 1. Bootstrap admin trên database CI độc lập (DB trống, chưa có tài khoản admin).
 * 2. Tạo kỹ thuật [MẪU] cho 4 giai đoạn cue, craving, response, reward (để bước 5 có kỹ thuật chọn).
 * 3. Tạo sản phẩm Habit Tracker số (slug: 'habit-tracker-so', type: 'digital_tool', trialDays: 28).
 * 4. Khách vãng lai truy cập /habit/5-phut và đi qua 6 bước:
 *    - Bước 1 (Khám): Nhấn 'Bỏ qua phần khám' (hoặc 'Tiếp tục').
 *    - Bước 2 (1% Better): Nhấn 'Sang giai đoạn 2'.
 *    - Bước 3 (Tìm Mentor): Nhập việc hiện tại, gắn nhãn (+), chọn thói quen neo -> Nhấn 'Tiếp tục'.
 *    - Bước 4 (Gọi tên): Nhập hành động, mục tiêu định danh, chọn nhịp tuần (ví dụ bỏ Chủ nhật),
 *      nhập bản tối giản, chọn ngày bắt đầu startDate = today + 2 -> Nhấn 'Tiếp tục'.
 *    - Bước 5 (Vòng lặp): Chọn kỹ thuật ở 4 giai đoạn, nhập hành động cam kết -> Nhấn 'Tiếp tục'.
 *    - Bước 6 (Boarding Pass): Kiểm tra hiển thị Boarding Pass, điền họ tên + email mới,
 *      tick đồng thuận (consent) -> Nhấn nút chính 'Lên chuyến · Bắt đầu 28 ngày →'.
 * 5. Màn hình chúc mừng xuất hiện: bấm nút chính dẫn tới /tai-khoan/dang-nhap?next=/habit/tracker.
 * 6. Luồng đăng nhập OTP: Lấy mã OTP qua /api/test-otp?email=..., nhập code -> chuyển hướng tới /habit/tracker.
 * 7. Kiểm tra giao diện Tracker:
 *    - Khởi hành đúng ngày lịch (ngày lịch startDate = today + 2).
 * 8. Fixture cập nhật startDate về hôm nay:
 *    - Reload trang -> Ngày 1 mở (enabled).
 *    - Check-in Ngày 1: Chọn 'Bỏ phiếu', chọn cảm xúc 'Bình an', bấm 'Lưu check-in'.
 *    - Kiểm tra ô Ngày 1 đã hoàn thành.
 * 9. Tải bảng 28 ngày (.csv):
 *    - Bấm 'Tải bảng 28 ngày (.csv)' và kiểm tra tên tệp tải về có định dạng chuẩn.
 * 10. Fixture lùi ngày để mở suy ngẫm trạm 1:
 *     - Cấu hình câu hỏi suy ngẫm cho Trạm 1 qua global habitJourneyContent (nếu chưa có).
 *     - Dời startDate lùi 8 ngày (để Trạm 1 kết thúc, hiện đang ở ngày 9) -> reload trang.
 *     - Card Trạm 1 hiện nút 'Suy ngẫm trạm' -> bấm mở modal, điền 2 câu trả lời, bấm 'Lưu suy ngẫm'.
 *     - Trạm 1 hiện huy hiệu 'Đã suy ngẫm' và nút 'Xem / sửa suy ngẫm'.
 * 11. Khối "Đồng hành sau 28 ngày" (HB-14):
 *     - Cấu hình link coach trong siteSettings.
 *     - Reload trang -> Khối "Đồng hành sau 28 ngày" xuất hiện với nút 'Đặt lịch với Habit Coach'
 *       (CF-02: không còn nút Ủng hộ – đã chuyển sang widget ly cà phê).
 * 12. Dọn dẹp an toàn trong finally: xóa dữ liệu test đã tạo, khôi phục globals.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminHb15-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-hb15-${randomUUID()}@example.test`)
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

test.describe('Habit Journey V2 Full E2E Flow (HB-15)', () => {
  test('khách mới đi 6 bước -> chọn startDate +2 -> lên chuyến OTP -> tracker lịch đúng -> check-in -> tải CSV -> suy ngẫm trạm 1 -> đồng hành sau 28 ngày', async ({
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
    let previousSettings: Record<string, unknown> | undefined
    let previousJourneyContent: Record<string, unknown> | undefined

    const customerEmail = `khach-hb15-${randomUUID().slice(0, 6)}@example.test`
    const productSlug = 'habit-tracker-so'

    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: testInfo.project.use.viewport,
      // IP riêng mỗi lần chạy để không dính rate limit form (như gate-habit-journey)
      extraHTTPHeaders: {
        'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 200) + 10}`,
      },
    })
    const guestPage = await visitor.newPage()

    try {
      // 1. Tạo admin nếu DB chưa có
      adminId = await bootstrapAdmin(page)

      // 2. Tạo kỹ thuật cho 4 giai đoạn
      const stages = ['cue', 'craving', 'response', 'reward'] as const
      for (const stg of stages) {
        const res = await page.request.post('/api/techniques', {
          data: {
            name: `[MẪU] Kỹ thuật ${stg} HB15-${randomUUID().slice(0, 4)}`,
            stage: stg,
            _status: 'published',
          },
        })
        const doc = await res.json()
        createdTechniqueIds.push(doc.doc.id)
      }

      // 3. Tạo sản phẩm Habit Tracker số nếu chưa có
      const existingProductRes = await page.request.get(
        `/api/products?where[slug][equals]=${productSlug}`,
      )
      const existingProduct = await existingProductRes.json()
      if (!existingProduct.docs?.length) {
        const prodRes = await page.request.post('/api/products', {
          data: {
            name: '[TEST] Habit Tracker (HB-15 E2E)',
            slug: productSlug,
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
        expect(prodRes.status()).toBe(201)
        createdProductId = (await prodRes.json()).doc.id
      }

      // 4. Khách vãng lai truy cập /habit/5-phut
      await guestPage.goto('/habit/5-phut')
      await expect(
        guestPage.getByText(/Khám đúng nút thắt|Khám đúng bệnh/i).first(),
      ).toBeVisible({ timeout: 20000 })

      // ===== BƯỚC 1: Khám đúng bệnh =====
      const skipDiagnoseBtn = guestPage.getByRole('button', { name: /Bỏ qua phần khám/i })
      if (await skipDiagnoseBtn.isVisible()) {
        await skipDiagnoseBtn.click()
      } else {
        await guestPage.getByRole('button', { name: /Tiếp tục/i }).click()
      }

      // ===== BƯỚC 2: Nguyên lý 1% =====
      await expect(guestPage.getByText(/Nguyên lý 1%/i).first()).toBeVisible({ timeout: 15000 })
      await guestPage.getByRole('button', { name: /Sang giai đoạn 2/i }).click()

      // ===== BƯỚC 3: Tìm Mentor =====
      await expect(guestPage.getByText(/Tìm "Mentor"|Tìm Mentor/i).first()).toBeVisible({ timeout: 15000 })
      await guestPage
        .getByPlaceholder(/Đánh răng|thói quen/i)
        .fill('[MẪU] Uống cốc nước ấm sau khi thức dậy')
      await guestPage.getByRole('button', { name: /Thêm một việc|Thêm thói quen/i }).click()
      await guestPage
        .getByRole('button', { name: /Có ích \(\+\)|đánh giá tốt/i })
        .first()
        .click()
      await guestPage.locator('input[type="radio"][name="anchorHabit"]').first().check()
      await guestPage.getByRole('button', { name: /Tiếp tục/i }).click()

      // ===== BƯỚC 4: Gọi tên =====
      await expect(guestPage.getByText(/Gọi tên thói quen/i).first()).toBeVisible({ timeout: 15000 })
      await guestPage.getByPlaceholder(/thiền 5 phút/i).fill('viết nhật ký 5 phút')
      await guestPage.getByPlaceholder(/người điềm tĩnh/i).fill('người thấu hiểu chính mình')

      // Chọn nhịp tuần (ví dụ bỏ Chủ nhật để kiểm tra nhịp 6 ngày/tuần)
      const rhythmButton = guestPage.getByRole('button', { name: /Chọn nhịp 6 lần mỗi tuần/i })
      if (await rhythmButton.isVisible()) {
        await rhythmButton.click()
        const sundayBtn = guestPage.getByRole('button', { name: 'Chủ nhật' })
        if (await sundayBtn.isVisible()) {
          await sundayBtn.click()
        }
      }

      // Nhập hành động dưới 2 phút (bản tối giản)
      await guestPage.getByPlaceholder(/Mở sách đọc đúng 1 trang/i).fill('Mở sổ viết 1 dòng')

      // Chọn ngày bắt đầu startDate = today + 2 ngày
      const now = new Date()
      const plusTwoDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      const plusTwoYmd = plusTwoDate.toISOString().split('T')[0]
      const startDateInput = guestPage.locator('#field-start-date')
      await expect(startDateInput).toBeVisible()
      await startDateInput.fill(plusTwoYmd)

      await guestPage.getByRole('button', { name: /Tiếp tục/i }).click()

      // ===== BƯỚC 5: Vòng lặp thói quen =====
      await expect(guestPage.getByText(/Thiết kế vòng lặp|Vòng lặp/i).first()).toBeVisible({ timeout: 15000 })
      const techCheckboxes = guestPage.locator('label:has(button.w-5.h-5)')
      const count = await techCheckboxes.count()
      for (let i = 0; i < Math.min(count, 4); i++) {
        await techCheckboxes.nth(i).click()
      }
      await guestPage.getByRole('button', { name: /Tiếp tục|Xem kế hoạch/i }).click()

      // ===== BƯỚC 6: Boarding Pass & Lên chuyến =====
      await expect(guestPage.getByText(/Boarding Pass/i).first()).toBeVisible({ timeout: 15000 })
      await expect(
        guestPage.getByText(/Boarding Pass của bạn|TẤM VÉ CHUYỂN MÌNH/i).first(),
      ).toBeVisible()

      // Điền thông tin cá nhân
      await guestPage.getByLabel(/Họ và tên/i).fill('Học viên HB15')
      await guestPage.getByLabel(/Email/i).fill(customerEmail)

      // Tick đồng thuận chính sách bảo mật
      const consentCheckbox = guestPage.locator('input[type="checkbox"][required]')
      await consentCheckbox.check()

      // Chờ token Turnstile sẵn sàng trước khi gửi (như habit-loop.test.ts)
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })

      // Bấm nút chính "Lên chuyến · Bắt đầu 28 ngày →"
      const startJourneyBtn = guestPage.getByRole('button', {
        name: /Lên chuyến · Bắt đầu 28 ngày/i,
      })
      await startJourneyBtn.click()

      // Màn hình chúc mừng xuất hiện
      await expect(guestPage.getByRole('heading', { name: vi.hb22.successTitle })).toBeVisible({
        timeout: 20000,
      })

      // Bấm nút chính để đi vào Tracker (dẫn tới /tai-khoan/dang-nhap?next=/habit/tracker)
      const trackerLink = guestPage.getByTestId('success-tracker-link')
      await expect(trackerLink).toBeVisible()
      await trackerLink.click()

      // Chuyển tới trang đăng nhập OTP
      await expect(guestPage).toHaveURL(/\/tai-khoan\/dang-nhap/, { timeout: 15000 })

      // Nhập email, đồng ý chính sách (ND 13: mặc định chưa tick), gửi mã
      const emailInput = guestPage.locator('input[name="email"]')
      await expect(emailInput).toBeVisible()
      await emailInput.fill(customerEmail)
      await guestPage.locator('input[name="consentPolicy"]').check()
      await expect(guestPage.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guestPage.getByRole('button', { name: vi.auth.sendOtpButton }).click()

      // Đợi bước nhập mã OTP
      const codeInput = await expectCodeStep(guestPage)
      const otpCode = await getTestOtpCode(page, customerEmail)
      await codeInput.fill(otpCode)
      await guestPage.locator('button[type="submit"]', { hasText: /Đăng nhập/i }).click()

      // Chuyển hướng tới /habit/tracker
      await expect(guestPage).toHaveURL(/\/habit\/tracker\/?$/, { timeout: 25000 })

      // Khách mới chưa có quyền dùng: tracker mời dùng thử -> /dung-thu -> kích hoạt -> quay lại tracker
      await guestPage.getByRole('link', { name: /Bắt đầu dùng thử 28 ngày/i }).click()
      await expect(guestPage).toHaveURL(/\/dung-thu\?san-pham=habit-tracker-so/, { timeout: 15000 })
      await guestPage.locator('button', { hasText: /Bắt đầu dùng thử 28 ngày/i }).click()
      await expect(guestPage).toHaveURL(/\/habit\/hoc\/?$/, { timeout: 15000 })
      await guestPage.goto('/habit/tracker')
      await expect(guestPage.getByRole('heading', { name: vi.tracker.pageTitle })).toBeVisible()

      // Ghi nhận customer ID của học viên vừa tạo
      const custQuery = await page.request.get(
        `/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}`,
      )
      expect(custQuery.ok()).toBe(true)
      const custDocs = (await custQuery.json()).docs
      createdCustomerId = custDocs[0]?.id
      expect(createdCustomerId).toBeTruthy()

      // 7. Kiểm tra ngày lịch hiển thị đúng (Khởi hành theo startDate = today + 2)
      const [py, pm, pd] = plusTwoYmd.split('-')
      const formattedStartDateStr = `${pd}/${pm}/${py}`
      await expect(
        guestPage.getByText(new RegExp(`Khởi hành: ${formattedStartDateStr}`, 'i')),
      ).toBeVisible({ timeout: 10000 })

      // 8. Fixture cập nhật startDate về hôm nay để mở check-in ngày 1
      const customerPlansRes = await page.request.get(
        `/api/habitPlans?where[customer][equals]=${createdCustomerId}`,
      )
      const customerPlans = await customerPlansRes.json()
      const planId = customerPlans.docs[0].id

      const todayYmd = now.toISOString().split('T')[0]
      await page.request.patch(`/api/habitPlans/${planId}`, {
        data: {
          startDate: todayYmd,
        },
      })

      // Reload trang để cập nhật startDate
      await guestPage.reload()

      // Ô Ngày 1 mở -> Click để mở modal check-in
      const day1Btn = guestPage.getByRole('button', { name: /^Ngày 1:/ }).first()
      await expect(day1Btn).toBeEnabled()
      await day1Btn.click()

      const checkInModal = guestPage.locator('div[role="dialog"]')
      await expect(checkInModal).toBeVisible()

      // Chọn trạng thái "Đã làm" và cảm xúc
      const votedBtn = checkInModal
        .getByRole('button', { name: /Đã làm|Bỏ phiếu/i })
        .or(checkInModal.getByRole('radio', { name: /Bỏ phiếu/i }))
        .first()
      await votedBtn.click()

      const peacefulBtn = checkInModal
        .getByRole('button', { name: /Hơi tự tin|Bình an/i })
        .or(checkInModal.getByRole('radio', { name: /Bình an/i }))
        .first()
      if (await peacefulBtn.isVisible()) {
        await peacefulBtn.click()
      }

      // Bấm Lưu check-in
      const saveCheckinBtn = checkInModal.getByRole('button', {
        name: /Lưu/i,
      })
      await saveCheckinBtn.click()
      await expect(checkInModal).toBeHidden({ timeout: 10000 })

      // Kiểm tra Ngày 1 đã hoàn thành
      const day1Completed = guestPage.getByRole('button', {
        name: /^Ngày 1:.*(Bỏ phiếu|Đã hoàn thành|Đã làm|Bản tối giản)/i,
      })
      await expect(day1Completed).toBeVisible()

      // 9. Tải bảng 28 ngày (.csv)
      const downloadPromise = guestPage.waitForEvent('download', { timeout: 15000 })
      await guestPage.getByRole('button', { name: /Tải bảng 28 ngày \(\.csv\)/i }).click()
      const csvDownload = await downloadPromise
      expect(csvDownload.suggestedFilename()).toMatch(/^tram-dung-cam-xuc-habit-.*\.csv$/)

      // 10. Fixture lùi ngày để mở suy ngẫm trạm 1
      // Lưu và cấu hình câu hỏi suy ngẫm cho Trạm 1
      const journeyRes = await page.request.get('/api/globals/habitJourneyContent')
      if (journeyRes.ok()) {
        previousJourneyContent = await journeyRes.json()
      }
      await page.request.post('/api/globals/habitJourneyContent', {
        data: {
          stations: [
            {
              name: 'Khởi động & Nhận diện',
              reflectionQuestions: [
                { question: 'Điều gì đã giúp bạn duy trì đều đặn 7 ngày qua?' },
                { question: 'Cảm xúc chủ đạo của bạn khi hoàn thành trạm 1 là gì?' },
              ],
            },
            {
              name: 'Định hình & Vượt dốc',
              reflectionQuestions: [],
            },
            {
              name: 'Củng cố & Lan tỏa',
              reflectionQuestions: [],
            },
            {
              name: 'Về đích & Tự hào',
              reflectionQuestions: [],
            },
          ],
        },
      })

      // Dời ngày bắt đầu của kế hoạch lùi 8 ngày (để trạm 1 kết thúc)
      const eightDaysAgoYmd = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      await page.request.patch(`/api/habitPlans/${planId}`, {
        data: {
          startDate: eightDaysAgoYmd,
        },
      })

      // Reload trang để cập nhật trạm 1 đã kết thúc
      await guestPage.reload()

      // Card Trạm 1 hiện nút "Suy ngẫm trạm"
      const station1ReflectBtn = guestPage.getByRole('button', { name: /Suy ngẫm trạm/i }).first()
      await expect(station1ReflectBtn).toBeVisible({ timeout: 15000 })
      await station1ReflectBtn.click()

      const reflectionModal = guestPage.locator('div[role="dialog"]')
      await expect(reflectionModal).toBeVisible()
      await expect(reflectionModal).toContainText('Điều gì đã giúp bạn duy trì đều đặn 7 ngày qua?')

      const textareas = reflectionModal.locator('textarea')
      await textareas.nth(0).fill('Sự kiên trì và đặt lời nhắc nhẹ nhàng.')
      if ((await textareas.count()) > 1) {
        await textareas.nth(1).fill('Cảm giác bình an và tự tin hơn.')
      }

      const saveReflectionBtn = reflectionModal.getByRole('button', { name: /Lưu suy ngẫm/i })
      await saveReflectionBtn.click()
      await expect(reflectionModal).toBeHidden({ timeout: 10000 })

      // Trạm 1 hiển thị huy hiệu "Đã suy ngẫm"
      await expect(guestPage.getByText(/Đã suy ngẫm/i).first()).toBeVisible()

      // 11. Khối "Đồng hành sau 28 ngày" (HB-14)
      const settingsRes = await page.request.get('/api/globals/siteSettings')
      if (settingsRes.ok()) {
        previousSettings = await settingsRes.json()
      }
      await page.request.post('/api/globals/siteSettings', {
        data: {
          habitCoachBookingUrl: 'https://cal.com/tramdungcamxuc/habit-coach',
        },
      })

      // Reload trang để hiển thị khối đồng hành
      await guestPage.reload()

      // Kiểm tra xuất hiện khối "Đồng hành sau 28 ngày"
      const afterJourneyPanel = guestPage.getByTestId('after-journey-panel')
      await expect(afterJourneyPanel).toBeVisible({ timeout: 15000 })

      const coachBookingLink = guestPage.getByRole('link', {
        name: /Đặt lịch với Habit Coach/i,
      })
      await expect(coachBookingLink).toBeVisible()
      expect(await coachBookingLink.getAttribute('href')).toBe(
        'https://cal.com/tramdungcamxuc/habit-coach',
      )

      // CF-02: khối không còn nút Ủng hộ
      await expect(afterJourneyPanel.getByRole('link', { name: /Ủng hộ/i })).toHaveCount(0)
    } finally {
      await visitor.close()

      test.setTimeout(testInfo.timeout + 30000)

      // HB-15c: dọn dữ liệu của khách thử (suy ngẫm, check-in, kế hoạch, quyền dùng, lead).
      // Khách hàng không xoá được qua REST (Customers.beforeDelete) – như gate-habit-journey.
      const q = encodeURIComponent(customerEmail)
      const plansRes = await page.request
        .get(`/api/habitPlans?where[leadEmail][equals]=${q}&limit=50&depth=0`)
        .catch(() => null)
      const planIds = new Set<number>(
        plansRes?.ok() ? ((await plansRes.json()).docs ?? []).map((d: { id: number }) => d.id) : [],
      )
      if (createdCustomerId) {
        const ownRes = await page.request
          .get(`/api/habitPlans?where[customer][equals]=${createdCustomerId}&limit=50&depth=0`)
          .catch(() => null)
        if (ownRes?.ok()) {
          for (const d of (await ownRes.json()).docs ?? []) planIds.add(d.id)
        }
      }
      for (const planId of planIds) {
        await page.request
          .delete(`/api/habitReflections?where[plan][equals]=${planId}`)
          .catch(() => {})
        await page.request
          .delete(`/api/habitCheckins?where[plan][equals]=${planId}`)
          .catch(() => {})
        await page.request.delete(`/api/habitPlans/${planId}`).catch(() => {})
      }
      if (createdCustomerId) {
        await page.request
          .delete(`/api/entitlements?where[customer][equals]=${createdCustomerId}`)
          .catch(() => {})
      }
      await page.request.delete(`/api/leads?where[email][equals]=${q}`).catch(() => {})

      // Dọn dẹp kỹ thuật test
      for (const id of createdTechniqueIds) {
        await page.request.delete(`/api/techniques/${id}`).catch(() => {})
      }

      // Dọn dẹp sản phẩm test nếu tạo mới
      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }

      // Khôi phục siteSettings và habitJourneyContent
      if (previousSettings) {
        await page.request
          .post('/api/globals/siteSettings', { data: previousSettings })
          .catch(() => {})
      }
      if (previousJourneyContent) {
        await page.request
          .post('/api/globals/habitJourneyContent', { data: previousJourneyContent })
          .catch(() => {})
      }

      // Xóa admin nếu tạo
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
    }
  })
})
