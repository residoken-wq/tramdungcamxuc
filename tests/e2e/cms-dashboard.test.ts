import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * End-to-End Test cho Dashboard "Hôm nay" trong Admin CMS (CM-02).
 *
 * Kịch bản:
 * 1. Bootstrap tài khoản admin đầu tiên trên môi trường test.
 * 2. Tạo 1 sản phẩm + 1 khách hàng -> Tạo 1 đơn hàng pending.
 * 3. Tạo 1 khách tiềm năng (lead) với followUpStatus = 'new'.
 * 4. Truy cập trang /admin:
 *    - Xác nhận hiển thị Dashboard "Hôm nay tại Trạm Dừng Cảm Xúc".
 *    - Thẻ "Đơn chờ xác nhận" hiển thị số 1.
 *    - Thẻ "Khách tiềm năng mới" hiển thị số 1.
 * 5. Bấm vào thẻ "Đơn chờ xác nhận" -> trình duyệt điều hướng tới /admin/collections/orders
 *    với tham số lọc where[paymentStatus][equals]=pending.
 * 6. Dọn dẹp toàn bộ dữ liệu mẫu trong khối finally.
 */

async function bootstrapAdmin(
  page: Page,
  onCreated: (id: number) => void,
): Promise<{ id: number; email: string }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  const email = `admin-cm02-${randomUUID()}@example.test`
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
  // Take the id from the registration response and hand it to the caller before any further
  // request: if a later step fails, the test's finally block can still delete this admin
  // (a leftover admin breaks every e2e spec that needs an empty admin table).
  const id = ((await response.json()) as { user: { id: number } }).user.id
  onCreated(id)
  await expect(page).toHaveURL(/\/admin\/?$/)
  return { id, email }
}

test.describe('CMS Dashboard "Hôm nay" (CM-02)', () => {
  test('Dashboard hiển thị đúng số việc cần làm và mở danh sách đã lọc', async ({ page }) => {
    test.setTimeout(180000)

    let adminId: number | undefined
    let createdCustomerId: number | undefined
    let createdProductId: number | undefined
    let createdOrderId: number | undefined
    let createdLeadId: number | undefined

    try {
      // 1. Khởi tạo tài khoản admin đầu tiên
      await bootstrapAdmin(page, (id) => {
        adminId = id
      })

      // Other e2e tests share this DB (leads from lead forms, orders from checkout),
      // so assert "baseline + 1" instead of an absolute number.
      const countDocs = async (path: string) => {
        const res = await page.request.get(`${path}&limit=1&depth=0`)
        expect(res.ok()).toBe(true)
        return ((await res.json()) as { totalDocs: number }).totalDocs
      }
      const pendingBefore = await countDocs('/api/orders?where[paymentStatus][equals]=pending')
      const leadsBefore = await countDocs('/api/leads?where[followUpStatus][equals]=new')

      // 2. Tạo 1 sản phẩm
      const prodRes = await page.request.post('/api/products', {
        data: {
          name: `Sản phẩm Test CM02 ${randomUUID().slice(0, 6)}`,
          slug: `prod-cm02-${randomUUID().slice(0, 6)}`,
          web: 'habit',
          type: 'digital_tool',
          price: 250000,
          saleStatus: 'on_sale',
          isSample: true,
          _status: 'published',
        },
      })
      expect(prodRes.ok()).toBe(true)
      const prodData = await prodRes.json()
      createdProductId = prodData.doc.id

      // 3. Tạo 1 khách hàng
      const custRes = await page.request.post('/api/customers', {
        data: {
          email: `customer-cm02-${randomUUID().slice(0, 6)}@example.test`,
          name: 'Học viên CM02',
        },
      })
      expect(custRes.ok()).toBe(true)
      const custData = await custRes.json()
      createdCustomerId = custData.doc.id

      // 4. Tạo 1 đơn hàng pending
      const orderRes = await page.request.post('/api/orders', {
        data: {
          customer: createdCustomerId,
          items: [{ product: createdProductId, price: 250000 }],
          total: 250000,
          paymentStatus: 'pending',
        },
      })
      expect(orderRes.ok()).toBe(true)
      const orderData = await orderRes.json()
      createdOrderId = orderData.doc.id

      // 5. Tạo 1 lead mới (followUpStatus = 'new')
      const leadRes = await page.request.post('/api/leads', {
        data: {
          email: `lead-cm02-${randomUUID().slice(0, 6)}@example.test`,
          name: 'Lead CM02',
          followUpStatus: 'new',
        },
      })
      expect(leadRes.ok()).toBe(true)
      const leadData = await leadRes.json()
      createdLeadId = leadData.doc.id

      // 6. Truy cập vào trang quản trị /admin
      await page.goto('/admin', { waitUntil: 'domcontentloaded' })

      // Tiêu đề Dashboard xuất hiện
      const heading = page.locator('h1', { hasText: 'Trạm Dừng Cảm Xúc' })
      await expect(heading).toBeVisible({ timeout: 15000 })

      // Thẻ "Đơn chờ xác nhận" tăng đúng 1
      const orderTodoCard = page.locator('[data-testid="cms-todo-pendingOrders"]')
      await expect(orderTodoCard).toBeVisible()
      await expect(page.getByTestId('cms-todo-pendingOrders-count')).toHaveText(
        String(pendingBefore + 1),
      )

      // Thẻ "Khách tiềm năng mới" tăng đúng 1
      const leadTodoCard = page.locator('[data-testid="cms-todo-newLeads"]')
      await expect(leadTodoCard).toBeVisible()
      await expect(page.getByTestId('cms-todo-newLeads-count')).toHaveText(String(leadsBefore + 1))

      // 7. Bấm vào thẻ "Đơn chờ xác nhận" -> mở danh sách đã lọc
      await orderTodoCard.click()
      await expect(page).toHaveURL(/.*\/admin\/collections\/orders.*paymentStatus.*pending.*/, {
        timeout: 15000,
      })
    } finally {
      // Dọn dẹp dữ liệu theo thứ tự an toàn
      if (createdOrderId) {
        await page.request.delete(`/api/orders/${createdOrderId}`).catch(() => {})
      }
      if (createdLeadId) {
        await page.request.delete(`/api/leads/${createdLeadId}`).catch(() => {})
      }
      if (createdCustomerId) {
        await page.request.delete(`/api/customers/${createdCustomerId}`).catch(() => {})
      }
      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
    }
  })
})
