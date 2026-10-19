import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

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
    const uniqueLesson = randomUUID().slice(0, 6)
    const lessonTitle = `Bài học E2E ${uniqueLesson}`
    const workshopTitle = `Workshop E2E ${uniqueLesson}`
    const moduleTitle = `Chương E2E ${uniqueLesson}`

    try {
      // 1. Khởi tạo tài khoản admin đầu tiên
      await bootstrapAdmin(page, (id) => {
        adminId = id
      })

      // ==========================================
      // LUỒNG 1: TẠO BÀI HỌC QUA WIZARD (/admin/them-bai-hoc)
      // ==========================================

      await page.goto('/admin/them-bai-hoc', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Thêm bài học mới')

      // Bước 1: Chọn nhóm bài học (hoặc tạo nhanh nhóm nếu chưa có)
      const hasModules = await page.locator('button[aria-pressed]').count()
      if (hasModules === 0) {
        // Tạo nhanh nhóm bài học
        const toggleBtn = page.getByRole('button', { name: /Tạo nhóm bài học mới/i })
        const newModuleInput = page.locator('input[placeholder*="Chặng 1"]')
        // The page may not be hydrated yet: retry the click until the form really opens.
        await expect(async () => {
          if (!(await newModuleInput.isVisible())) await toggleBtn.click()
          await expect(newModuleInput).toBeVisible({ timeout: 1000 })
        }).toPass({ timeout: 20000 })
        await newModuleInput.fill(moduleTitle)
        await page.getByRole('button', { name: 'Tạo nhóm mới', exact: true }).click()
      } else {
        const firstModule = page.locator('button[aria-pressed]').first()
        await expect(async () => {
          await firstModule.click()
          await expect(firstModule).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 })
        }).toPass({ timeout: 20000 })
      }

      // Tiếp tục sang Bước 2
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 2: Thông tin bài học')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 2: Nhập thông tin chi tiết bài học
      await page.locator('input[placeholder*="Nhận biết van xả"]').fill(lessonTitle)
      await page.locator('textarea').fill('Tóm tắt nội dung bài học E2E test')
      // Chọn giai đoạn "Khao khát (Craving)"
      const cravingBtn = page.getByRole('button', { name: /Cơn thèm/i })
      await cravingBtn.click()

      // Tiếp tục sang Bước 3
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 3: Video bài giảng & Xem thử')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 3: Video Bunny ID và thời lượng
      await page
        .locator('input[placeholder*="xxxxxxxx-xxxx"]')
        .fill('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')
      await page.locator('input[placeholder*="05:30 hoặc 330"]').fill('08:45')
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
      const workshopTitleInput = page.locator('input[placeholder^="Ví dụ: Workshop"]')
      const audienceCard = page.locator('button[aria-pressed]').first()
      await expect(audienceCard).toBeVisible()
      // Typing/clicking before hydration is lost: retry until the state really changed.
      await expect(async () => {
        await workshopTitleInput.fill(workshopTitle)
        if ((await audienceCard.getAttribute('aria-pressed')) !== 'true') await audienceCard.click()
        await expect(workshopTitleInput).toHaveValue(workshopTitle, { timeout: 1000 })
        await expect(audienceCard).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 })
      }).toPass({ timeout: 20000 })

      // Tiếp tục sang Bước 2
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 2: Thời gian & Phòng họp')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 2: Nhập ngày giờ VN và link họp
      await page.locator('input[type="date"]').fill('2026-11-20')
      await page.locator('input[type="time"]').fill('20:00')
      await page.locator('input[type="url"]').fill('https://meet.google.com/abc-test-meet')

      // Tiếp tục sang Bước 3 (Xem trước email)
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 3: Xem trước email nhắc 24h & Lưu')).toBeVisible()
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
      await expect(page.getByText(vi.cms.wizard.listButtons.lesson)).toBeVisible()

      await page.goto('/admin/collections/workshops', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText(vi.cms.wizard.listButtons.workshop)).toBeVisible()
    } finally {
      // Records created through the UI may exist even when the redirect never happened:
      // find them by their unique title before deleting.
      const findIds = async (collection: string, field: string, value: string) => {
        const res = await page.request
          .get(
            `/api/${collection}?where[${field}][equals]=${encodeURIComponent(value)}&draft=true&depth=0&limit=5`,
          )
          .catch(() => null)
        if (!res || !res.ok()) return [] as number[]
        return ((await res.json()) as { docs: { id: number }[] }).docs.map((d) => d.id)
      }
      for (const id of await findIds('lessons', 'title', lessonTitle))
        if (!createdLessonIds.includes(id)) createdLessonIds.push(id)
      for (const id of await findIds('workshops', 'title', workshopTitle))
        if (!createdWorkshopIds.includes(id)) createdWorkshopIds.push(id)
      for (const id of await findIds('courseModules', 'title', moduleTitle))
        if (!createdModuleIds.includes(id)) createdModuleIds.push(id)
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
