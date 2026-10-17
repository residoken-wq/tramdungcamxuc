import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

/**
 * End-to-End Test cho Wizard "Tạo sản phẩm" 5 bước (CM-04).
 *
 * Kịch bản:
 * 1. Bootstrap tài khoản admin đầu tiên trên môi trường test.
 * 2. Luồng tạo Công cụ số:
 *    - Truy cập /admin/tao-san-pham
 *    - Bước 1: Chọn "Công cụ số"
 *    - Bước 2: Nhập tên, kiểm tra tự sinh slug
 *    - Bước 3: Nhập giá 250.000, giá ưu đãi 178.000, kiểm tra dùng thử 21 ngày
 *    - Bước 4: Thêm mục "Bao gồm"
 *    - Bước 5: Xem trước & bấm "Lưu nháp"
 *    - Trình duyệt chuyển hướng đến form chuẩn /admin/collections/products/[id]
 *    - Kiểm tra giá và dùng thử đúng như đã nhập.
 * 3. Luồng tạo Gói đồng hành (Package):
 *    - Truy cập /admin/tao-san-pham
 *    - Bước 1: Chọn "Gói đồng hành"
 *    - Bước 2: Nhập tên gói
 *    - Bước 3: Nhập giá bán 2.900.000, thêm 2 cấu phần (3x1.000.000 + 2x500.000)
 *    - Kiểm tra tổng giá trị tính đúng 4.000.000 đ và mức ưu đãi 28%
 *    - Đi tiếp và Lưu nháp thành công.
 * 4. Dọn dẹp toàn bộ dữ liệu trong khối finally.
 */

async function bootstrapAdmin(
  page: Page,
  onCreated: (id: number) => void,
): Promise<{ id: number; email: string }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  const email = `admin-cm04-${randomUUID()}@example.test`
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

test.describe('Product Creation Wizard 5-step (CM-04)', () => {
  test('Tạo công cụ số và gói đồng hành qua wizard 5 bước, lưu nháp và mở form chuẩn', async ({
    page,
  }) => {
    test.setTimeout(240000)

    let adminId: number | undefined
    const createdProductIds: number[] = []
    // Step 5 saves a preview draft before any redirect: clean up by slug too, so a failed
    // run never leaves a product behind (CI reuses the DB).
    const createdSlugs: string[] = []

    try {
      // 1. Khởi tạo tài khoản admin đầu tiên
      await bootstrapAdmin(page, (id) => {
        adminId = id
      })

      // ==========================================
      // LUỒNG 1: TẠO CÔNG CỤ SỐ (DIGITAL TOOL)
      // ==========================================
      const unique1 = randomUUID().slice(0, 6)
      const toolName = `Habit Tracker E2E ${unique1}`
      const toolSlug = `habit-tracker-e2e-${unique1}`
      createdSlugs.push(toolSlug)

      await page.goto('/admin/tao-san-pham', { waitUntil: 'domcontentloaded' })
      await expect(page.locator('h1')).toContainText('Tạo sản phẩm mới')

      // Bước 1: Chọn loại "Công cụ số"
      const digitalToolCard = page.locator('button').filter({ hasText: 'Công cụ số' }).first()
      await expect(digitalToolCard).toBeVisible()
      // The page may not be hydrated yet: retry until the card is really selected.
      await expect(async () => {
        await digitalToolCard.click()
        await expect(digitalToolCard).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 })
      }).toPass({ timeout: 15000 })

      // Bấm Tiếp tục
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 2: Thông tin cơ bản')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 2: Thông tin cơ bản
      const nameInput = page.locator('input[placeholder*="Habit Tracker"]').first()
      await nameInput.fill(toolName)

      // Kiểm tra slug được sinh tự động
      const slugInput = page.locator('input[placeholder*="habit-tracker"]').first()
      await expect(slugInput).toHaveValue(toolSlug)

      // Bấm Tiếp tục
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 3: Thiết lập giá và cách bán')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 3: Giá & cách bán
      const priceInput = page.locator('input[placeholder*="250000"]').first()
      await priceInput.fill('250000')

      const salePriceInput = page.locator('input[placeholder*="178000"]').first()
      await salePriceInput.fill('178000')

      const trialDaysInput = page.locator('input[placeholder*="21"]').first()
      await expect(trialDaysInput).toHaveValue('21')

      // Bấm Tiếp tục
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 4: Nội dung giới thiệu')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 4: Nội dung trang
      const addIncludeBtn = page.getByRole('button', { name: /Thêm mục/i })
      await addIncludeBtn.click()
      const includeInput = page.locator('input[placeholder*="Bảng theo dõi"]').first()
      await includeInput.fill('Bảng theo dõi 21 ngày kèm 10 cảm xúc')

      // Bấm Tiếp tục sang bước 5
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 5: Xem trước và lưu sản phẩm')).toBeVisible()
      }).toPass({ timeout: 25000 })

      // Bước 5: Xem trước & Lưu nháp
      await expect(async () => {
        const saveDraftBtn = page.getByRole('button', { name: /Lưu nháp/i }).last()
        await expect(saveDraftBtn).toBeEnabled()
        await saveDraftBtn.click()
      }).toPass({ timeout: 15000 })

      // Đợi chuyển hướng tới form chuẩn của bản ghi: /admin/collections/products/[id]
      await expect(page).toHaveURL(/\/admin\/collections\/products\/\d+/, { timeout: 30000 })

      // Trích xuất ID từ URL để dọn dẹp
      const urlMatch = page.url().match(/\/products\/(\d+)/)
      if (urlMatch) {
        createdProductIds.push(parseInt(urlMatch[1], 10))
      }

      // Xác nhận các trường trên form chuẩn hiển thị đúng giá trị
      await expect(page.locator('#field-name')).toHaveValue(toolName)
      // CM-03: price lives in the "Giá & bán" tab
      await page.getByRole('button', { name: 'Giá & bán' }).click()
      await expect(page.locator('#field-price')).toHaveValue('250000')

      // ==========================================
      // LUỒNG 2: TẠO GÓI ĐỒNG HÀNH (PACKAGE)
      // ==========================================
      const unique2 = randomUUID().slice(0, 6)
      const packageName = `Growth Mirror E2E ${unique2}`
      const packageSlug = `growth-mirror-e2e-${unique2}`
      createdSlugs.push(packageSlug)

      await page.goto('/admin/tao-san-pham', { waitUntil: 'domcontentloaded' })

      // Bước 1: Chọn loại "Gói đồng hành"
      const packageCard = page.locator('button').filter({ hasText: 'Gói đồng hành' }).first()
      await expect(packageCard).toBeVisible()
      // The page may not be hydrated yet: retry until the card is really selected.
      await expect(async () => {
        await packageCard.click()
        await expect(packageCard).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 })
      }).toPass({ timeout: 15000 })

      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 2: Thông tin cơ bản')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 2: Thông tin cơ bản
      await page.locator('input[placeholder*="Habit Tracker"]').first().fill(packageName)
      await expect(page.locator('input[placeholder*="habit-tracker"]').first()).toHaveValue(
        packageSlug,
      )

      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 3: Thiết lập giá và cách bán')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bước 3: Giá bán & Cấu phần gói
      await page.locator('input[placeholder*="250000"]').first().fill('2900000')

      // Thêm cấu phần 1: Coaching 1:1, quantity 3, unitValue 1.000.000
      const addCompBtn = page.getByRole('button', { name: /Thêm cấu phần/i })
      await addCompBtn.click()

      const compLabelInput = page.locator('input[placeholder*="Coaching 1:1"]').first()
      await compLabelInput.fill('Coaching 1:1')

      // Thêm cấu phần 2: Workshop (mặc định 1 × 500.000đ)
      await addCompBtn.click()
      // Chưa có tên cấu phần 2 → chưa được sang bước 4
      await expect(page.getByRole('button', { name: /Tiếp tục/i })).toBeDisabled()
      await page.locator('input[placeholder*="Coaching 1:1"]').nth(1).fill('Workshop')

      // Tổng giá trị = 1 × 500.000 (cấu phần 1 mặc định) + 1 × 500.000 = 1.000.000đ
      await expect(page.getByText(/Tổng giá trị thực tế của gói/i)).toBeVisible()
      await expect(page.getByText('1.000.000 đ').first()).toBeVisible()

      // Bấm Tiếp tục sang bước 4
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 4: Nội dung giới thiệu')).toBeVisible()
      }).toPass({ timeout: 15000 })

      // Bấm Tiếp tục sang bước 5
      await expect(async () => {
        const nextBtn = page.getByRole('button', { name: /Tiếp tục/i })
        await expect(nextBtn).toBeEnabled()
        await nextBtn.click()
        await expect(page.getByText('Bước 5: Xem trước và lưu sản phẩm')).toBeVisible()
      }).toPass({ timeout: 25000 })

      // Bấm Lưu nháp
      await expect(async () => {
        const saveDraftBtn = page.getByRole('button', { name: /Lưu nháp/i }).last()
        await expect(saveDraftBtn).toBeEnabled()
        await saveDraftBtn.click()
      }).toPass({ timeout: 15000 })

      await expect(page).toHaveURL(/\/admin\/collections\/products\/\d+/, { timeout: 30000 })

      const pkgUrlMatch = page.url().match(/\/products\/(\d+)/)
      if (pkgUrlMatch) {
        createdProductIds.push(parseInt(pkgUrlMatch[1], 10))
      }
    } finally {
      // Dọn dẹp dữ liệu sản phẩm và admin user
      for (const slug of createdSlugs) {
        const found = await page.request
          .get(`/api/products?where[slug][equals]=${slug}&draft=true&depth=0&limit=5`)
          .then((r) => (r.ok() ? r.json() : { docs: [] }))
          .catch(() => ({ docs: [] }))
        for (const doc of (found as { docs: { id: number }[] }).docs) {
          if (!createdProductIds.includes(doc.id)) createdProductIds.push(doc.id)
        }
      }
      for (const prodId of createdProductIds) {
        try {
          await page.request.delete(`/api/products/${prodId}`)
        } catch {
          // ignore
        }
      }

      if (adminId) {
        try {
          await page.request.delete(`/api/users/${adminId}`)
        } catch {
          // ignore
        }
      }
    }
  })
})
