import { test, expect } from '@playwright/test'

// E2E test cho PK-30: Trang /habit/1-percent-better đọc dữ liệu tùy biến từ sản phẩm habit-tracker-so
test.describe('PK-30: Habit Offer CMS Customization', () => {
  test('trang /habit/1-percent-better hiển thị đầy đủ và không lỗi tràn ngang ở 375px', async ({
    page,
  }) => {
    // 1. Kiểm tra ở màn hình desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 })
    const res = await page.goto('/habit/1-percent-better')
    expect(res?.status()).toBeLessThan(400)

    // Kiểm tra các phần tử cốt lõi xuất hiện
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByText('Module lộ trình tinh gọn')).toBeVisible()

    // 2. Tự lặp kiểm tra ở màn hình mobile 375px
    await page.setViewportSize({ width: 375, height: 812 })
    await page.reload()

    // Kiểm tra không cuộn ngang (horizontal overflow)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })
})
