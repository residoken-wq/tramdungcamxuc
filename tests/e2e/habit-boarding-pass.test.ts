import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * E2E tests cho Habit Boarding Pass (HB-10).
 * Quy tắc: Viết theo chuẩn, không networkidle, dọn dẹp dữ liệu trong finally.
 * Luồng: đi hết 4 bước của /habit/5-phut với dữ liệu [MẪU], ở bước 4 bấm "Tải ảnh 4:5"
 * và chờ nhận file .png từ sự kiện download.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`hb-10-${randomUUID()}@example.test`)
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
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 30000 })
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('Habit Boarding Pass Download (HB-10)', () => {
  test('hoàn thành 4 bước Habit Loop và tải ảnh Boarding Pass 4:5 thành công', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let userId: number | undefined
    const createdTechniqueIds: number[] = []

    try {
      userId = await bootstrapAdmin(page)

      // Tạo kỹ thuật cho 4 giai đoạn
      const stages = ['cue', 'craving', 'response', 'reward'] as const
      for (const stg of stages) {
        const res = await page.request.post('/api/techniques', {
          data: {
            name: `[MẪU] Kỹ thuật ${stg} ${randomUUID().slice(0, 6)}`,
            stage: stg,
            _status: 'published',
          },
        })
        const doc = await res.json()
        createdTechniqueIds.push(doc.doc.id)
      }

      const visitor = await browser.newContext({
        viewport: { width: 375, height: 667 },
      })
      const guest = await visitor.newPage()

      try {
        await guest.goto('/habit/5-phut')
        await expect(
          guest.getByText(/Khám đúng nút thắt|Khám đúng bệnh/i).first(),
        ).toBeVisible({ timeout: 15000 })

        // BƯỚC 1: Khám đúng bệnh -> Tiếp tục (DB trống: Tiếp tục bật sẵn; DB có câu: bấm Bỏ qua phần khám)
        const skipDiagnoseBtn = guest.getByRole('button', { name: /Bỏ qua phần khám/i })
        if (await skipDiagnoseBtn.isVisible()) {
          await skipDiagnoseBtn.click()
        } else {
          await guest.getByRole('button', { name: /Tiếp tục/i }).click()
        }

        // BƯỚC 2: Nguyên lý 1% -> Sang giai đoạn 2
        await expect(guest.getByText(/Nguyên lý 1%/i).first()).toBeVisible()
        await guest.getByRole('button', { name: /Sang giai đoạn 2/i }).click()

        // BƯỚC 3: Tìm Mentor – Thêm việc mẫu, đánh dấu (+) và chọn Mentor
        await expect(guest.getByText(/Tìm "Mentor"|Tìm Mentor/i).first()).toBeVisible()
        await guest.getByPlaceholder(/Đánh răng|thói quen/i).fill('[MẪU] Uống nước ấm sáng')
        await guest.getByRole('button', { name: /Thêm một việc|Thêm thói quen/i }).click()
        await guest
          .getByRole('button', { name: /Có ích \(\+\)|đánh giá tốt/i })
          .first()
          .click()
        await guest.locator('input[type="radio"][name="anchorHabit"]').first().check()
        await guest.getByRole('button', { name: /Tiếp tục/i }).click()

        // BƯỚC 4: Gọi tên – Nhập hành động & mục tiêu định danh, tắt Chủ Nhật
        await expect(guest.getByText(/Gọi tên thói quen/i).first()).toBeVisible()
        await guest.getByPlaceholder(/thiền 5 phút/i).fill('[MẪU] chạy bộ 15 phút')
        await guest.getByPlaceholder(/người điềm tĩnh/i).fill('[MẪU] người khỏe khoắn')

        // Tắt Chủ nhật
        await guest.getByRole('button', { name: 'Chọn nhịp 6 lần mỗi tuần' }).click()
        await guest.getByRole('button', { name: 'Chủ nhật' }).click()
        // Nhập bản tối giản
        await guest.getByPlaceholder(/Mở sách đọc đúng 1 trang/i).fill('[MẪU] Xỏ giày thể thao')
        await guest.getByRole('button', { name: /Tiếp tục/i }).click()

        // BƯỚC 5: Vòng lặp – Chọn kỹ thuật
        await expect(guest.getByText(/Thiết kế vòng lặp|Vòng lặp/i).first()).toBeVisible()
        const techCheckboxes = guest.locator('label:has(button.w-5.h-5)')
        const count = await techCheckboxes.count()
        for (let i = 0; i < Math.min(4, count); i++) {
          await techCheckboxes.nth(i).click()
        }
        await guest.getByRole('button', { name: /Tiếp tục|Xem kế hoạch/i }).click()

        // BƯỚC 6: Xem trước Boarding Pass và Tải ảnh 4:5
        await expect(guest.getByText(/Boarding Pass/i).first()).toBeVisible()
        await expect(
          guest.getByText(/Boarding Pass của bạn|TẤM VÉ CHUYỂN MÌNH/i).first(),
        ).toBeVisible()

        // Bấm nút Tải ảnh đăng bài (4:5) và chờ sự kiện download
        const downloadPromise = guest.waitForEvent('download', { timeout: 30000 })
        const download45Btn = guest.getByRole('button', { name: /Tải ảnh đăng bài|Tải ảnh 4:5/i })
        await download45Btn.click()

        const download = await downloadPromise
        expect(download.suggestedFilename()).toBe('tdcx-boarding-pass-4x5.png')
      } finally {
        await visitor.close()
      }
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      for (const id of createdTechniqueIds) {
        await page.request.delete(`/api/techniques/${id}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
