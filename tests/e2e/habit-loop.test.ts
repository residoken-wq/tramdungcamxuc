import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import * as zip from './helpers/habit-zip'

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
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 30000 })
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('Habit Loop 5 phút & Offer Page (T2-03)', () => {
  test('luồng 4 bước Habit Loop 375px và trang offer tải dữ liệu từ CMS', async ({
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
      if (productRes.status() === 400) {
        const existing = await (
          await page.request.get('/api/products?where[slug][equals]=habit-tracker-so')
        ).json()
        if (existing.docs?.[0]) {
          createdProductId = existing.docs[0].id
          await page.request.patch(`/api/products/${createdProductId}`, {
            data: {
              price: 250000,
              salePrice: 178000,
              saleStatus: 'on_sale',
              trialDays: 21,
              _status: 'published',
            },
          })
        } else {
          expect(productRes.status(), await productRes.text()).toBe(201)
        }
      } else {
        expect(productRes.status(), await productRes.text()).toBe(201)
        createdProductId = (await productRes.json()).doc.id
      }

      // Khởi tạo ngữ cảnh khách vãng lai (không đăng nhập) với màn hình mobile 375px
      // IP giả riêng (dải tài liệu 203.0.113.0/24): giới hạn tần suất form dùng chung 127.0.0.1 trên CI
      const visitor = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
        viewport: { width: 375, height: 667 },
        extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 254) + 1}` },
      })

      try {
        const guest = await visitor.newPage()

        // ===== 1. Luồng Habit Loop 5 phút (/habit/5-phut) – 3 giai đoạn / 6 bước (HB-16, DP-03) =====
        await zip.loginHabitCustomer(guest, leadEmail, '/habit/5-phut')
        await expect(guest.getByRole('heading', { level: 1 })).toBeVisible()

        // Bước 1–6 theo giao diện zip (DP-01, helpers/habit-zip.ts)
        await zip.answerDiagnose(guest)
        await zip.passPercent(guest)

        // BƯỚC 3: Tìm Mentor – việc có ích (+), chọn Mentor, giờ tùy chọn (HB-19, AU-01)
        const mentorActivity = 'Uống 1 cốc nước ấm'
        const firstRoutine = guest.getByPlaceholder('Thức dậy, uống một ly nước')
        await expect(firstRoutine).toBeVisible({ timeout: 15000 })
        await firstRoutine.fill(mentorActivity)
        await guest.getByTitle('Có ích (+)').first().click()
        await guest.getByRole('button', { name: mentorActivity, exact: true }).click()
        await guest.getByLabel('Giờ', { exact: true }).selectOption('6')
        await guest.getByLabel('Phút', { exact: true }).selectOption('30')
        await guest.getByLabel('Buổi (AM hoặc PM)', { exact: true }).selectOption('AM')
        await expect(guest.getByText(/· lúc 6:30 AM/)).toBeVisible()
        await guest.getByRole('button', { name: /Tiếp • Gọi tên thói quen/ }).click()

        // BƯỚC 4: Gọi tên, nhịp tuần (HB-09: bỏ Chủ nhật), bản tối giản; nháp còn sau khi tải lại
        await zip.fillIdentity(guest, {
          action: 'uống nước ấm mỗi sáng',
          role: 'người khỏe mạnh và yêu bản thân',
          atomic: 'Rót 1 cốc nước ấm sẵn',
        })
        await zip.setRhythm(guest, 'Mỗi ngày', ['CN'])
        await expect(guest.getByRole('button', { name: 'CN', exact: true })).toHaveAttribute(
          'aria-pressed',
          'false',
        )

        await guest.reload()
        await expect(guest.getByPlaceholder('đọc sách mỗi ngày')).toHaveValue(
          'uống nước ấm mỗi sáng',
          { timeout: 15000 },
        )
        await expect(guest.getByPlaceholder('đọc 1 trang sách')).toHaveValue(
          'Rót 1 cốc nước ấm sẵn',
        )
        await zip.nextFromIdentity(guest)

        // BƯỚC 5: chọn 4 kỹ thuật
        const techBoxes = guest.getByRole('checkbox')
        expect(await techBoxes.count()).toBeGreaterThanOrEqual(4)
        const techNames = await techBoxes.evaluateAll((els) =>
          els.slice(0, 4).map((e) => e.getAttribute('aria-label') ?? ''),
        )
        await zip.pickTechniques(
          guest,
          techNames.map((name) => ({ name })),
        )
        await zip.nextFromLoop(guest)

        // BƯỚC 6: nhận kế hoạch qua email (Turnstile phải có token trước khi gửi)
        await zip.fillBoarding(guest, { name: 'Học viên Test 01', email: leadEmail })
        await zip.submitBoarding(guest)

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
      // DP-03: the guest signs in first, so saving the plan starts a trial on this product.
      // Delete its entitlements before the product (NOT NULL product column), else the product
      // stays behind and later tests fail creating `habit-tracker-so` again.
      if (createdProductId) {
        await zip.deleteTestProduct(page, createdProductId)
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
