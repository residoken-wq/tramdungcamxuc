import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import * as zip from './helpers/habit-zip'

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
        await expect(guest.getByText(/Khám đúng nút thắt|Khám đúng bệnh/i).first()).toBeVisible({
          timeout: 15000,
        })

        // Bước 1–5 theo giao diện zip (helpers/habit-zip.ts)
        await zip.answerDiagnose(guest)
        await zip.passPercent(guest)
        await zip.fillMentor(guest, '[MẪU] Uống nước ấm sáng')
        await zip.fillIdentity(guest, {
          action: '[MẪU] chạy bộ 15 phút',
          role: '[MẪU] người khỏe khoắn',
          atomic: '[MẪU] Xỏ giày thể thao',
        })
        await zip.setRhythm(guest, 'Mỗi ngày', ['CN'])
        await zip.nextFromIdentity(guest)
        const techBoxes = guest.getByRole('checkbox')
        const techNames = await techBoxes.evaluateAll((els) =>
          els.slice(0, 4).map((e) => e.getAttribute('aria-label') ?? ''),
        )
        await zip.pickTechniques(
          guest,
          techNames.map((name) => ({ name })),
        )
        await zip.nextFromLoop(guest)

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
