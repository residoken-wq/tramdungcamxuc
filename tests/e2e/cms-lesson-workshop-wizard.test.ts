import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test cho Wizard "Thêm bài học" và "Lên lịch workshop" (CM-06).
 */

async function bootstrapAdmin(
  page: Page,
  onCreated: (id: number) => void,
): Promise<{ id: number; email: string }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  const email = `admin-cm06-${randomUUID()}@example.test`
  await page.locator('#field-email').fill(email)
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
  const id = ((await response.json()) as { user: { id: number } }).user.id
  onCreated(id)
  await expect(page).toHaveURL(/\/admin\/?$/)
  return { id, email }
}

test.describe('Lesson & Workshop Creation Wizards (CM-06)', () => {
  test('Tạo bài học và lên lịch workshop qua wizard, xem trước và lưu vào hệ thống', async ({
    page,
  }) => {
    test.setTimeout(240000)

    let adminId: number | undefined
    const createdLessonIds: number[] = []
    const createdWorkshopIds: number[] = []
    const createdModuleIds: number[] = []
    const createdProductIds: number[] = []

    try {
      // 1. Khởi tạo tài khoản admin đầu tiên
      await bootstrapAdmin(page, (id) => {
        adminId = id
      })

      // ==========================================
      // LUỒNG 1: TẠO BÀI HỌC QUA WIZARD (/admin/them-bai-hoc)
      // ==========================================
      const uniqueLesson = randomUUID().slice(0, 6)
      const lessonTitle = `Bài học E2E ${uniqueLesson}`

      await page.goto('/admin/them-bai-hoc', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Thêm bài học mới')

      // Bước 1: Chọn nhóm bài học (hoặc tạo nhanh nhóm nếu chưa có)
      const hasModules = await page.locator('button[aria-pressed]').count()
      if (hasModules === 0) {
        // Tạo nhanh nhóm bài học
        const toggleBtn = page.getByRole('button', { name: /Tạo nhóm bài học mới/i })
        await toggleBtn.click()
        await page.locator('input[placeholder*="Chương 1"]').fill(`Chương E2E ${uniqueLesson}`)
        await page.getByRole('button', { name: /Tạo nhóm ngay/i }).click()
      } else {
        const firstModule = page.locator('button[aria-pressed]').first()
        await firstModule.click()
        await expect(firstModule).toHaveAttribute('aria-pressed', 'true')
      }

      // Tiếp tục sang Bước 2
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 2: Thông tin bài học')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 2: Nhập thông tin chi tiết bài học
      await page.locator('input[placeholder*="Nhập tên bài học"]').fill(lessonTitle)
      await page.locator('textarea').fill('Tóm tắt nội dung bài học E2E test')
      // Chọn giai đoạn "Khao khát (Craving)"
      const cravingBtn = page.getByRole('button', { name: /Khao khát/i })
      await cravingBtn.click()

      // Tiếp tục sang Bước 3
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 3: Video bài học')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 3: Video Bunny ID và thời lượng
      await page
        .locator('input[placeholder*="vd: 4a2b3c4d"]')
        .fill('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
      await page.locator('input[placeholder*="12:30"]').fill('08:45')
      await page.locator('input[type="checkbox"]').check()

      // Tiếp tục sang Bước 4 (Xem trước & Lưu)
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 4: Xem trước và lưu bài học')).toBeVisible()
      }).toPass({ timeout: 25000 })

      // Bấm Lưu nháp
      await expect(async () => {
        const saveDraftBtn = page.getByRole('button', { name: /Lưu nháp/i }).last()
        await expect(saveDraftBtn).toBeEnabled()
        await saveDraftBtn.click()
      }).toPass({ timeout: 15000 })

      await expect(page).toHaveURL(/\/admin\/collections\/lessons\/\d+/, { timeout: 30000 })
      const lessonMatch = page.url().match(/\/lessons\/(\d+)/)
      if (lessonMatch) {
        createdLessonIds.push(parseInt(lessonMatch[1], 10))
      }

      // ==========================================
      // LUỒNG 2: LÊN LỊCH WORKSHOP QUA WIZARD (/admin/len-lich-workshop)
      // ==========================================
      // Tạo trước 1 package product qua API để có audience product
      const productRes = await page.request.post('/api/products', {
        data: {
          name: `Gói CLEAR E2E ${uniqueLesson}`,
          slug: `goi-clear-e2e-${uniqueLesson}`,
          type: 'package',
          web: 'site',
          price: 1750000,
          isSample: false,
          _status: 'draft',
        },
      })
      if (productRes.ok()) {
        const prodData = (await productRes.json()) as { doc: { id: number } }
        createdProductIds.push(prodData.doc.id)
      }

      await page.goto('/admin/len-lich-workshop', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Lên lịch workshop mới')

      // Bước 1: Tiêu đề & Chọn audience
      const workshopTitle = `Workshop E2E ${uniqueLesson}`
      await page.locator('input[placeholder*="Workshop Tập thương cảm xúc"]').fill(workshopTitle)

      const audienceCard = page.locator('button[aria-pressed]').first()
      await expect(audienceCard).toBeVisible()
      await audienceCard.click()

      // Tiếp tục sang Bước 2
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 2: Thời gian và địa điểm')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 2: Nhập ngày giờ VN và link họp
      await page.locator('input[type="date"]').fill('2026-11-20')
      await page.locator('input[type="time"]').fill('20:00')
      await page
        .locator('input[type="url"]')
        .fill('https://meet.google.com/abc-test-meet')

      // Tiếp tục sang Bước 3 (Xem trước email)
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 3: Xem trước thông báo và lưu')).toBeVisible()
      }).toPass({ timeout: 25000 })

      // Kiểm tra iframe xem trước email hiển thị
      await expect(page.locator('iframe')).toBeVisible()

      // Bấm Lưu nháp / Xuất bản
      await expect(async () => {
        const saveDraftBtn = page.getByRole('button', { name: /Lưu nháp/i }).last()
        await expect(saveDraftBtn).toBeEnabled()
        await saveDraftBtn.click()
      }).toPass({ timeout: 15000 })

      await expect(page).toHaveURL(/\/admin\/collections\/workshops\/\d+/, { timeout: 30000 })
      const workshopMatch = page.url().match(/\/workshops\/(\d+)/)
      if (workshopMatch) {
        createdWorkshopIds.push(parseInt(workshopMatch[1], 10))
      }

      // ==========================================
      // LUỒNG 3: KIỂM TRA NÚT BANNER TRÊN LIST TABLE
      // ==========================================
      await page.goto('/admin/collections/lessons', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Thêm bài học bằng Wizard')).toBeVisible()

      await page.goto('/admin/collections/workshops', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('Lên lịch bằng Wizard')).toBeVisible()
    } finally {
      // Dọn dẹp dữ liệu
      for (const id of createdLessonIds) {
        try {
          await page.request.delete(`/api/lessons/${id}`)
        } catch {}
      }
      for (const id of createdWorkshopIds) {
        try {
          await page.request.delete(`/api/workshops/${id}`)
        } catch {}
      }
      for (const id of createdProductIds) {
        try {
          await page.request.delete(`/api/products/${id}`)
        } catch {}
      }
      for (const id of createdModuleIds) {
        try {
          await page.request.delete(`/api/courseModules/${id}`)
        } catch {}
      }
      if (adminId) {
        try {
          await page.request.delete(`/api/users/${adminId}`)
        } catch {}
      }
    }
  })
})
