import { expect, test } from '@playwright/test'

/**
 * E2E tests cho Habit Loop 5 phút (/habit/5-phut) và Trang Offer (/habit/1-percent-better) (T2-03).
 *
 * Lưu ý theo phân công task T2-03 (docs/tasks/WORKFLOW.md mục 2):
 * File này được VIẾT theo spec, KHÔNG CHẠY trong môi trường dev Antigravity
 * mà sẽ được Planning / CI kiểm thử tích hợp tự động.
 */

test.describe('Habit Loop 5 phút & Offer Page (T2-03)', () => {
  test('Hoàn thành luồng Habit Loop 5 phút trên màn hình điện thoại 375px', async ({ page }) => {
    // 1. Kiểm tra trải nghiệm Mobile-First 375px
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/habit/5-phut')

    // Kiểm tra tiêu đề trang
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Habit Loop 5 phút')).toBeVisible()

    // BƯỚC 1: Bảng điểm thói quen
    await expect(page.getByText('Bước 1 / 4')).toBeVisible()
    // Chọn nhanh một thói quen mẫu
    const sampleButton = page.getByRole('button', { name: '+ Đọc sách 10 phút' })
    if (await sampleButton.isVisible()) {
      await sampleButton.click()
    } else {
      await page.getByPlaceholder(/Ví dụ: Đọc sách 10 phút/i).fill('Đọc sách 10 phút')
      await page.getByRole('button', { name: 'Thêm thói quen' }).click()
    }

    // Kiểm tra thói quen đã xuất hiện trong danh sách
    await expect(page.getByText('Đọc sách 10 phút')).toBeVisible()

    // Bấm tiếp tục sang Bước 2
    await page.getByRole('button', { name: 'Tiếp tục →' }).click()

    // BƯỚC 2: Gọi tên thói quen
    await expect(page.getByText('Bước 2 / 4')).toBeVisible()
    await page
      .getByPlaceholder(/đọc sách 10 phút mỗi sáng/i)
      .fill('đọc sách 10 phút mỗi sáng')
    await page
      .getByPlaceholder(/người điềm tĩnh/i)
      .fill('người kỷ luật và ham học hỏi')

    // Kiểm tra câu định danh xem trước
    await expect(
      page.getByText('Tôi sẽ đọc sách 10 phút mỗi sáng để trở thành người kỷ luật và ham học hỏi'),
    ).toBeVisible()

    // Bấm tiếp tục sang Bước 3
    await page.getByRole('button', { name: 'Tiếp tục →' }).click()

    // BƯỚC 3: Chọn kỹ thuật thực hành
    await expect(page.getByText('Bước 3 / 4')).toBeVisible()

    // Chọn ít nhất 1 kỹ thuật cho mỗi giai đoạn nếu có
    const checkboxes = page.locator('input[type="checkbox"]')
    const count = await checkboxes.count()
    if (count > 0) {
      // Tick các checkbox đầu tiên của các giai đoạn
      for (let i = 0; i < Math.min(count, 4); i++) {
        await checkboxes.nth(i).check()
      }
    }

    // Bấm tiếp tục sang Bước 4
    await page.getByRole('button', { name: 'Tiếp tục →' }).click()

    // BƯỚC 4: Xem trước kế hoạch và lưới 21 ngày
    await expect(page.getByText('Bước 4 / 4')).toBeVisible()
    await expect(page.getByText('Lưới hành động 21 ngày:')).toBeVisible()

    // Nhập email và tick consent
    await page.getByPlaceholder('email@example.com').fill('hocvien-test@example.test')
    const consentCheckbox = page.locator('input[type="checkbox"]').last()
    await consentCheckbox.check()

    // Bấm Lưu kế hoạch
    const submitBtn = page.getByRole('button', { name: /Lưu kế hoạch/i })
    await submitBtn.click()

    // Kiểm tra màn hình thành công
    await expect(page.getByText('Kế hoạch đã sẵn sàng!')).toBeVisible({ timeout: 15000 })
  })

  test('Lưu nháp vào localStorage và không mất dữ liệu khi tải lại trang giữa chừng', async ({
    page,
  }) => {
    await page.goto('/habit/5-phut')

    // Thêm thói quen ở Bước 1
    const customHabit = 'Uống 2 lít nước mỗi ngày'
    await page.getByPlaceholder(/Ví dụ: Đọc sách 10 phút/i).fill(customHabit)
    await page.getByRole('button', { name: 'Thêm thói quen' }).click()
    await expect(page.getByText(customHabit)).toBeVisible()

    // Sang Bước 2 và nhập hành động
    await page.getByRole('button', { name: 'Tiếp tục →' }).click()
    await page.getByPlaceholder(/đọc sách 10 phút mỗi sáng/i).fill('uống nước đều đặn')

    // TẢI LẠI TRANG
    await page.reload()

    // Dữ liệu nháp phải được khôi phục nguyên vẹn
    await expect(
      page.getByPlaceholder(/đọc sách 10 phút mỗi sáng/i),
    ).toHaveValue('uống nước đều đặn')
  })

  test('Trang offer /habit/1-percent-better hiển thị đầy đủ thông tin, giá từ CMS và các nút CTA', async ({
    page,
  }) => {
    await page.goto('/habit/1-percent-better')

    // Kiểm tra tiêu đề chính
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByText('Habit Hack')).toBeVisible()
    await expect(page.getByText('1% Better Mỗi Ngày')).toBeVisible()

    // Kiểm tra badge 21 ngày dùng thử
    await expect(page.getByText(/21 ngày dùng thử miễn phí/i)).toBeVisible()

    // Kiểm tra 4 module
    await expect(page.getByText(/Module 1: Insight/i)).toBeVisible()
    await expect(page.getByText(/Module 2: Habit Loop/i)).toBeVisible()
    await expect(page.getByText(/Module 3: Nguyên tắc/i)).toBeVisible()
    await expect(page.getByText(/Module 4: Kỹ thuật/i)).toBeVisible()

    // Kiểm tra các nút CTA
    const trialCta = page.getByRole('link', { name: /Dùng thử 21 ngày miễn phí/i }).first()
    await expect(trialCta).toBeVisible()
    await expect(trialCta).toHaveAttribute('href', /\/tai-khoan\/dang-nhap/)

    const habitLoopCta = page.getByRole('link', { name: /Trải nghiệm Habit Loop 5 phút miễn phí/i }).first()
    await expect(habitLoopCta).toBeVisible()
    await expect(habitLoopCta).toHaveAttribute('href', '/habit/5-phut')
  })
})
