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
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('Habit Boarding Pass Download (HB-10)', () => {
  test('hoàn thành 4 bước Habit Loop và tải ảnh Boarding Pass 4:5 thành công', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

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
        await expect(guest.getByText('Bước 1 / 4')).toBeVisible({ timeout: 15000 })

        // BƯỚC 1: Thêm thói quen mẫu và chọn neo
        await guest.getByPlaceholder(/Nhập thói quen hàng ngày/i).fill('[MẪU] Uống nước ấm sáng')
        await guest.getByRole('button', { name: 'Thêm thói quen' }).click()
        await guest
          .getByRole('button', { name: /đánh giá tốt/i })
          .first()
          .click()
        await guest.locator('input[type="radio"][name="anchorHabit"]').first().check()
        await guest.getByRole('button', { name: /Tiếp tục/i }).click()

        // BƯỚC 2: Nhập hành động & mục tiêu định danh, tắt Chủ Nhật
        await expect(guest.getByText('Bước 2 / 4')).toBeVisible()
        await guest.getByPlaceholder(/đọc sách 10 phút/i).fill('[MẪU] chạy bộ 15 phút')
        await guest.getByPlaceholder(/người điềm tĩnh/i).fill('[MẪU] người khỏe khoắn')

        // Tắt Chủ nhật
        await guest.getByRole('button', { name: 'Chủ nhật' }).click()
        // Nhập bản tối giản
        await guest.getByPlaceholder(/Mở sách đọc 1 trang/i).fill('[MẪU] Xỏ giày thể thao')
        await guest.getByRole('button', { name: /Tiếp tục/i }).click()

        // BƯỚC 3: Chọn kỹ thuật
        await expect(guest.getByText('Bước 3 / 4')).toBeVisible()
        const stageSections = guest.locator('.p-5.rounded-card')
        for (let i = 0; i < 4; i++) {
          const section = stageSections.nth(i)
          const checkbox = section.locator('input[type="checkbox"]').first()
          await checkbox.check()
          const actionInput = section.locator('input[type="text"]').first()
          await actionInput.fill(`[MẪU] Hành động cho bước ${i + 1}`)
        }
        await guest.getByRole('button', { name: /Tiếp tục|Xem kế hoạch/i }).click()

        // BƯỚC 4: Xem trước Boarding Pass và Tải ảnh 4:5
        await expect(guest.getByText('Bước 4 / 4')).toBeVisible()
        await expect(guest.getByText(/Boarding Pass của bạn/i)).toBeVisible()

        // Bấm nút Tải ảnh 4:5 và chờ sự kiện download
        const downloadPromise = guest.waitForEvent('download', { timeout: 30000 })
        const download45Btn = guest.getByRole('button', { name: /Tải ảnh 4:5/i })
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
