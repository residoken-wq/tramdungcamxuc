import { expect, test } from '@playwright/test'

test.describe('Site Shell E2E: Navbar, Footer, FloatingChat, Legal Pages (T1-05)', () => {
  test('Menu có mục quiz chẩn đoán ở cả màn hình 1440px (Desktop) và 375px (Mobile)', async ({
    page,
  }) => {
    // 1. Kiểm tra màn hình Desktop (1440px)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const desktopQuizLink = page
      .locator('header nav')
      .getByRole('link', { name: /Test thói quen 5 phút|Quiz 5 phút/i })
      .first()
    await expect(desktopQuizLink).toBeVisible()
    await expect(desktopQuizLink).toHaveAttribute('href', '/habit/chan-doan')

    // 2. Kiểm tra màn hình Mobile (375px - iPhone SE / kích thước tối thiểu Brand Book)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Nút quiz nổi bật phải hiện trên thanh top bar ngay cạnh nút mở menu (không cần mở drawer)
    const mobileQuizLink = page
      .locator('header .flex.lg\\:hidden')
      .getByRole('link', { name: /Test thói quen 5 phút|Quiz 5 phút/i })
      .first()
    await expect(mobileQuizLink).toBeVisible()
    await expect(mobileQuizLink).toHaveAttribute('href', '/habit/chan-doan')
  })

  test('Mở trang /dieu-khoan-su-dung thấy tiêu đề đúng và nội dung trang pháp lý', async ({
    page,
  }) => {
    const response = await page.goto('/dieu-khoan-su-dung')
    expect(response?.status()).toBeLessThan(400)

    const heading = page.getByRole('heading', { level: 1, name: /Điều khoản sử dụng/i })
    await expect(heading).toBeVisible()

    // Kiểm tra title của tài liệu
    await expect(page).toHaveTitle(/Điều khoản sử dụng/i)
  })

  test('Nút Zalo chat nổi không che nút hoặc nội dung cuối trang ở màn hình 375px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const chatButton = page.locator('aside a[aria-label*="Zalo"], a[aria-label*="Zalo"]').first()

    // Nếu FloatingChat được bật trong CMS
    if (await chatButton.isVisible()) {
      // Cuộn xuống cuối trang
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(300)

      const chatBox = await chatButton.boundingBox()
      expect(chatBox, 'Nút Zalo chat nổi phải có tọa độ hợp lệ').not.toBeNull()

      // Lấy phần tử tương tác cuối trang trong footer hoặc trang chủ
      const lastInteractiveElement = page
        .locator('footer a, footer button, main button:last-of-type')
        .last()

      if (await lastInteractiveElement.isVisible()) {
        const elemBox = await lastInteractiveElement.boundingBox()
        if (elemBox && chatBox) {
          // Kiểm tra xem nút Zalo có đè trùng hoàn toàn lên phần tử cuối không
          const isOverlapping =
            chatBox.x < elemBox.x + elemBox.width &&
            chatBox.x + chatBox.width > elemBox.x &&
            chatBox.y < elemBox.y + elemBox.height &&
            chatBox.y + chatBox.height > elemBox.y

          expect(
            isOverlapping,
            'Nút Zalo chat không được che khuất phần tử tương tác ở cuối trang trên mobile',
          ).toBe(false)
        }
      }
    }
  })
})
