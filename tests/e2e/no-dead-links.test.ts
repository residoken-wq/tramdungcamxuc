import { expect, test } from '@playwright/test'

// E2E test (T1-18): Kiểm tra toàn bộ liên kết nội bộ trên trang chủ và thư viện không bị 404
// và kịch bản để lại thông tin trên trang /sap-ra-mat.
// LƯU Ý: File này viết theo spec T1-18, không chạy trong task T1-18 (chạy ở pipeline Planning/CI).

test.describe('No dead links & Coming soon lead form (T1-18)', () => {
  test('all internal links on landing page and library tabs return non-404', async ({
    page,
    request,
  }) => {
    const urlsToCrawl = ['/', '/thu-vien?tab=khoa-hoc', '/thu-vien?tab=noi-dung']
    const collectedHrefs = new Set<string>()

    for (const url of urlsToCrawl) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })

      // Gom toàn bộ liên kết bắt đầu bằng '/'
      const links = await page.locator('a[href^="/"]').evaluateAll((anchors: HTMLAnchorElement[]) =>
        anchors
          .map((a) => a.getAttribute('href') || '')
          .filter((href) => href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\')),
      )

      for (const href of links) {
        // Loại trừ luồng checkout /thanh-toan? (T2-08 chưa làm)
        if (href.startsWith('/thanh-toan?') || href === '/thanh-toan') {
          continue
        }
        collectedHrefs.add(href)
      }
    }

    expect(collectedHrefs.size).toBeGreaterThan(0)

    // Kiểm tra từng link không trả về lỗi 404
    for (const href of collectedHrefs) {
      const response = await request.get(href)
      expect(
        response.status(),
        `Đường dẫn nội bộ "${href}" không được trả về 404 Not Found`,
      ).not.toBe(404)
    }
  })

  test('coming soon page loads product and successfully submits lead form', async ({ page }) => {
    // Sản phẩm habit-loop-5-phut đã được seed với saleStatus = 'coming_soon'
    await page.goto('/sap-ra-mat?san-pham=habit-loop-5-phut', { waitUntil: 'networkidle' })

    // Kiểm tra tiêu đề và thông tin sản phẩm hiển thị đúng
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText('Habit Loop trong 5 phút')).toBeVisible()

    // Điền form LeadForm
    const testName = 'Khách Thử Nghiệm'
    const testEmail = `lead-${Date.now()}@example.test`

    await page.locator('input[name="name"]').fill(testName)
    await page.locator('input[name="email"]').fill(testEmail)
    await page.locator('input[name="consent"]').check()

    // Bấm gửi form
    await page.locator('button[type="submit"]').click()

    // Kiểm tra thông báo thành công xuất hiện
    await expect(page.getByRole('status')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Gửi thông tin thành công!')).toBeVisible()
  })
})
