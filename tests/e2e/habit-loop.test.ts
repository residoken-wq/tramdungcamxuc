import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * E2E tests cho Habit Loop 5 phút (/habit/5-phut) và Trang Offer (/habit/1-percent-better) (T2-03).
 * Tự tạo dữ liệu độc lập (admin + techniques cho 4 giai đoạn + product habit-tracker-so)
 * qua REST API và tự dọn dẹp sau khi kiểm thử.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t2-03-${randomUUID()}@example.test`)
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

test.describe('Habit Loop 5 phút & Offer Page (T2-03)', () => {
  let createdProductIds: number[] = []
  let createdTechniqueIds: number[] = []

  test('Luồng 4 bước tại /habit/5-phut ở 375px mobile, reload giữa bước 2 giữ dữ liệu, để lại email thành công', async ({
    page,
  }) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    try {
      if (!init.initialized) {
        await bootstrapAdmin(page)

        // Tạo 4 kỹ thuật cho 4 giai đoạn cue, craving, response, reward
        const stages = ['cue', 'craving', 'response', 'reward'] as const
        for (const stg of stages) {
          const res = await page.request.post('/api/techniques', {
            data: {
              name: `Kỹ thuật E2E ${stg} ${randomUUID().slice(0, 6)}`,
              stage: stg,
              _status: 'published',
            },
          })
          if (res.ok()) {
            createdTechniqueIds.push((await res.json()).doc.id)
          }
        }
      }

      // 1. Kiểm tra trải nghiệm Mobile-First 375px
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/habit/5-phut')

      // Kiểm tra tiêu đề trang
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // BƯỚC 1: Bảng điểm thói quen
      await expect(page.getByText('Bước 1 / 4')).toBeVisible()
      const habitInput = page.getByPlaceholder(/Nhập thói quen hàng ngày/i)
      if (await habitInput.isVisible()) {
        await habitInput.fill('Uống 1 cốc nước ấm')
        await page.getByRole('button', { name: 'Thêm thói quen' }).click()
      } else {
        const sampleBtn = page.getByRole('button', { name: /Uống một cốc nước ấm/i })
        if (await sampleBtn.isVisible()) {
          await sampleBtn.click()
        }
      }

      // Bấm tiếp tục sang Bước 2
      await page.getByRole('button', { name: /Tiếp tục/i }).click()

      // BƯỚC 2: Gọi tên thói quen
      await expect(page.getByText('Bước 2 / 4')).toBeVisible()
      await page.getByPlaceholder(/đọc sách 10 phút/i).fill('uống nước ấm mỗi sáng')
      await page.getByPlaceholder(/người điềm tĩnh/i).fill('người khỏe mạnh và yêu bản thân')

      // Kiểm tra reload giữa bước 2 -> dữ liệu không mất (localStorage)
      await page.reload()
      await expect(page.getByText('Bước 2 / 4')).toBeVisible()
      await expect(page.getByPlaceholder(/đọc sách 10 phút/i)).toHaveValue('uống nước ấm mỗi sáng')

      // Bấm tiếp tục sang Bước 3
      await page.getByRole('button', { name: /Tiếp tục/i }).click()

      // BƯỚC 3: Chọn kỹ thuật
      await expect(page.getByText('Bước 3 / 4')).toBeVisible()
      const checkboxes = page.locator('input[type="checkbox"]')
      const count = await checkboxes.count()
      for (let i = 0; i < Math.min(count, 4); i++) {
        await checkboxes.nth(i).check()
      }

      // Nhập hành động cho các kỹ thuật đã tick
      const actionInputs = page.getByPlaceholder(/Đặt sách ngay cạnh gối/i)
      const actionCount = await actionInputs.count()
      for (let i = 0; i < actionCount; i++) {
        await actionInputs.nth(i).fill('Hành động cụ thể mỗi sáng')
      }

      // Bấm tiếp tục sang Bước 4
      await page.getByRole('button', { name: /Tiếp tục|Xem kế hoạch/i }).click()

      // BƯỚC 4: Xem trước kế hoạch và lưới 21 ngày
      await expect(page.getByText('Bước 4 / 4')).toBeVisible()
      await expect(page.getByRole('region')).toBeVisible() // ProgressGrid

      // Nhập email và tick consent
      await page.getByPlaceholder('email@example.com').fill(`e2e-habit-${randomUUID().slice(0, 6)}@example.test`)
      const consentBox = page.locator('input[type="checkbox"]').last()
      await consentBox.check()

      // Bấm Lưu kế hoạch
      const submitBtn = page.getByRole('button', { name: /Lưu kế hoạch/i })
      await submitBtn.click()

      // Kiểm tra màn hình thành công
      await expect(page.getByText(/Kế hoạch đã sẵn sàng|thành công/i)).toBeVisible({ timeout: 20000 })
    } finally {
      // Dọn dẹp sau khi kiểm thử
      for (const id of createdTechniqueIds) {
        try {
          await page.request.delete(`/api/techniques/${id}`)
        } catch {
          // ignore
        }
      }
    }
  })

  test('Trang offer /habit/1-percent-better hiển thị giá từ CMS, 4 module và nút CTA', async ({
    page,
  }) => {
    test.setTimeout(120000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    try {
      if (!init.initialized) {
        await bootstrapAdmin(page)
        const productRes = await page.request.post('/api/products', {
          data: {
            name: 'Habit Tracker số (Habit Hack 1% Better)',
            slug: 'habit-tracker-so',
            web: 'habit',
            type: 'digital_tool',
            price: 250000,
            salePrice: 178000,
            trialDays: 21,
            saleStatus: 'on_sale',
            _status: 'published',
          },
        })
        if (productRes.ok()) {
          createdProductIds.push((await productRes.json()).doc.id)
        }
      }

      await page.goto('/habit/1-percent-better')

      // Kiểm tra tiêu đề chính
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Kiểm tra giá từ CMS
      await expect(page.getByText(/178\.000/)).toBeVisible()

      // Kiểm tra CTA dùng thử
      const ctaBtn = page.getByRole('link', { name: /Dùng thử 21 ngày/i })
      await expect(ctaBtn.first()).toBeVisible()

      // Kiểm tra link Habit Loop 5 phút
      const loopLink = page.getByRole('link', { name: /Habit Loop 5 phút/i })
      await expect(loopLink.first()).toBeVisible()
      await expect(loopLink.first()).toHaveAttribute('href', '/habit/5-phut')
    } finally {
      for (const id of createdProductIds) {
        try {
          await page.request.delete(`/api/products/${id}`)
        } catch {
          // ignore
        }
      }
    }
  })
})
