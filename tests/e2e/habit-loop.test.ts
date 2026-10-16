import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * E2E tests cho Habit Loop 5 phút (/habit/5-phut) và Trang Offer (/habit/1-percent-better) (T2-03).
 * Viết theo mẫu tests/e2e/no-dead-links.test.ts:
 * - Một test duy nhất tự tạo admin + dữ liệu độc lập (4 kỹ thuật cho 4 stage + 1 sản phẩm).
 * - Không networkidle, không test.skip khi thiếu dữ liệu, chờ cf-turnstile-response.
 * - Dọn dẹp toàn bộ dữ liệu trong finally.
 */

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
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
  test('luồng 4 bước Habit Loop 375px và trang offer tải dữ liệu từ CMS', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let userId: number | undefined
    let createdProductId: number | undefined
    const createdTechniqueIds: number[] = []
    const leadEmail = `e2e-habit-${randomUUID().slice(0, 8)}@example.test`

    try {
      userId = await bootstrapAdmin(page)

      // Tạo 4 kỹ thuật đại diện cho 4 giai đoạn cue, craving, response, reward
      const stages = ['cue', 'craving', 'response', 'reward'] as const
      for (const stg of stages) {
        const res = await page.request.post('/api/techniques', {
          data: {
            name: `Kỹ thuật E2E ${stg} ${randomUUID().slice(0, 6)}`,
            stage: stg,
            _status: 'published',
          },
        })
        expect(res.status(), await res.text()).toBe(201)
        const doc = (await res.json()).doc
        createdTechniqueIds.push(doc.id)
      }

      // Tạo sản phẩm habit-tracker-so đã xuất bản
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
          isSample: true,
          _status: 'published',
        },
      })
      expect(productRes.status(), await productRes.text()).toBe(201)
      createdProductId = (await productRes.json()).doc.id

      // Khởi tạo ngữ cảnh khách vãng lai (không đăng nhập) với màn hình mobile 375px
      // IP giả riêng (dải tài liệu 203.0.113.0/24): giới hạn tần suất form dùng chung 127.0.0.1 trên CI
      const visitor = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width: 375, height: 667 },
        extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
      })

      try {
        const guest = await visitor.newPage()

        // ===== 1. Luồng Habit Loop 5 phút (/habit/5-phut) =====
        await guest.goto('/habit/5-phut')
        await expect(guest.getByRole('heading', { level: 1 })).toBeVisible()

        // BƯỚC 1: Bảng điểm thói quen
        await expect(guest.getByText('Bước 1 / 4')).toBeVisible()
        await guest.getByPlaceholder(/Nhập thói quen hàng ngày/i).fill('Uống 1 cốc nước ấm')
        await guest.getByRole('button', { name: 'Thêm thói quen' }).click()
        await guest.getByRole('button', { name: /Tiếp tục/i }).click()

        // BƯỚC 2: Gọi tên thói quen & kiểm tra khôi phục nháp sau khi tải lại trang
        await expect(guest.getByText('Bước 2 / 4')).toBeVisible()
        await guest.getByPlaceholder(/đọc sách 10 phút/i).fill('uống nước ấm mỗi sáng')
        await guest.getByPlaceholder(/người điềm tĩnh/i).fill('người khỏe mạnh và yêu bản thân')

        await guest.reload()
        await expect(guest.getByText('Bước 2 / 4')).toBeVisible()
        await expect(guest.getByPlaceholder(/đọc sách 10 phút/i)).toHaveValue(
          'uống nước ấm mỗi sáng',
        )

        await guest.getByRole('button', { name: /Tiếp tục/i }).click()

        // BƯỚC 3: Chọn kỹ thuật (mỗi giai đoạn chọn 1 kỹ thuật và nhập hành động cụ thể)
        await expect(guest.getByText('Bước 3 / 4')).toBeVisible()
        const stageSections = guest.locator('.p-5.rounded-card')
        const stageCount = await stageSections.count()
        expect(stageCount).toBeGreaterThanOrEqual(4)

        for (let i = 0; i < 4; i++) {
          const section = stageSections.nth(i)
          const checkbox = section.locator('input[type="checkbox"]').first()
          await checkbox.check()
          const actionInput = section.locator('input[type="text"]').first()
          await actionInput.fill(`Hành động mẫu cho giai đoạn ${i + 1}`)
        }

        await guest.getByRole('button', { name: /Tiếp tục|Xem kế hoạch/i }).click()

        // BƯỚC 4: Xem trước kế hoạch, nhập email, consent và chờ Turnstile
        await expect(guest.getByText('Bước 4 / 4')).toBeVisible()
        await expect(guest.getByRole('region').first()).toBeVisible() // ProgressGrid

        await guest.getByPlaceholder('email@example.com').fill(leadEmail)
        const consentBox = guest.locator('input[type="checkbox"]').last()
        await consentBox.check()

        // Chờ token Turnstile sẵn sàng trước khi nhấn gửi (tránh Turnstile long-poll timeout)
        await expect(guest.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
          timeout: 20000,
        })

        const submitBtn = guest.getByRole('button', { name: /Lưu kế hoạch/i })
        await submitBtn.click()

        await expect(guest.getByText('Kế hoạch đã sẵn sàng!')).toBeVisible({
          timeout: 20000,
        })

        // ===== 2. Trang Offer (/habit/1-percent-better) =====
        await guest.goto('/habit/1-percent-better')
        await expect(guest.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(guest.getByText(/^178\.000/).first()).toBeVisible()

        const ctaBtn = guest.getByRole('link', { name: /Dùng thử 21 ngày/i })
        await expect(ctaBtn.first()).toBeVisible()

        const loopLink = guest.getByRole('link', { name: /Habit Loop 5 phút/i })
        await expect(loopLink.first()).toBeVisible()
        await expect(loopLink.first()).toHaveAttribute('href', '/habit/5-phut')
      } finally {
        await visitor.close()
      }
    } finally {
      // Đủ thời gian dọn dẹp kể cả khi phần thân đã dùng hết thời gian test
      test.setTimeout(testInfo.timeout + 30000)
      // Xóa lead đã tạo bởi email test
      const leadsRes = await page.request
        .get(`/api/leads?where[email][equals]=${encodeURIComponent(leadEmail)}&limit=1`)
        .catch(() => null)
      if (leadsRes?.ok()) {
        const leadDocs = (await leadsRes.json()).docs
        if (leadDocs && leadDocs[0]) {
          await page.request.delete(`/api/leads/${leadDocs[0].id}`).catch(() => {})
        }
      }

      // Xóa kế hoạch habitPlans đã tạo bởi email test
      const plansRes = await page.request
        .get(`/api/habitPlans?where[leadEmail][equals]=${encodeURIComponent(leadEmail)}&limit=5`)
        .catch(() => null)
      if (plansRes?.ok()) {
        const planDocs = (await plansRes.json()).docs
        if (planDocs && Array.isArray(planDocs)) {
          for (const plan of planDocs) {
            await page.request.delete(`/api/habitPlans/${plan.id}`).catch(() => {})
          }
        }
      }
      // Dọn dẹp toàn bộ dữ liệu đã tạo (admin xóa cuối cùng)
      for (const id of createdTechniqueIds) {
        await page.request.delete(`/api/techniques/${id}`).catch(() => {})
      }
      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
