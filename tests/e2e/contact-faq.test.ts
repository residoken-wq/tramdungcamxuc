import { expect, test } from '@playwright/test'

test.describe('SM-06: Trang Liên hệ (/lien-he) và Câu hỏi thường gặp (/cau-hoi-thuong-gap)', () => {
  test.describe('Trang Liên hệ (/lien-he)', () => {
    test('hiển thị thông tin liên hệ từ CMS và khối form liên hệ', async ({ page }) => {
      await page.goto('/lien-he')

      // 1. Kiểm tra tiêu đề trang
      await expect(page).toHaveTitle(/Liên hệ|Trạm Dừng Cảm Xúc/i)

      // 2. Kiểm tra thông tin liên hệ (email, hotline từ siteSettings)
      const emailLink = page.locator('a[href^="mailto:"]')
      await expect(emailLink.first()).toBeVisible()

      const telLink = page.locator('a[href^="tel:"]')
      await expect(telLink.first()).toBeVisible()

      // 3. Kiểm tra form liên hệ (ContactForms)
      const personalSection = page.getByText(/Dành cho Cá nhân/i)
      await expect(personalSection.first()).toBeVisible()

      // Kiểm tra các trường form B2C
      const nameInput = page.locator('input[placeholder*="Họ và tên của bạn"]')
      await expect(nameInput.first()).toBeVisible()

      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput.first()).toBeVisible()

      // 4. Nếu có tabs, kiểm tra chuyển đổi tab Cá nhân / Doanh nghiệp
      const tabBusiness = page.getByRole('tab', { name: /Doanh nghiệp/i })
      if (await tabBusiness.isVisible()) {
        await tabBusiness.click()
        await expect(tabBusiness).toHaveAttribute('aria-selected', 'true')
        await expect(page.getByText(/Dành cho Doanh nghiệp/i)).toBeVisible()
      }
    })

    test('không bị tràn ngang trên màn hình di động 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/lien-he')

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(isOverflowing).toBe(false)
    })
  })

  test.describe('Trang Câu hỏi thường gặp (/cau-hoi-thuong-gap)', () => {
    test('hiển thị tiêu đề, anchor nhóm, ô tìm kiếm và CTA liên hệ', async ({ page }) => {
      await page.goto('/cau-hoi-thuong-gap')

      // 1. Kiểm tra tiêu đề và SEO metadata
      await expect(page).toHaveTitle(/Câu hỏi thường gặp/i)
      const mainHeading = page.locator('h1')
      await expect(mainHeading).toContainText(/CÂU HỎI THƯỜNG GẶP/i)

      // 2. Kiểm tra ô tìm kiếm
      const searchInput = page.locator('#faq-search-input')
      await expect(searchInput).toBeVisible()

      // 3. Kiểm tra anchor link theo nhóm (nếu có câu hỏi)
      const groupPills = page.locator('nav[aria-label="Nhóm câu hỏi"] a')
      const pillCount = await groupPills.count()
      if (pillCount > 0) {
        const firstPill = groupPills.first()
        const href = await firstPill.getAttribute('href')
        expect(href).toMatch(/^#[a-z0-9_-]+$/)
      }

      // 4. Tìm kiếm từ khóa và kiểm tra kết quả
      await searchInput.fill('cảm xúc')
      await page.locator('button[type="submit"]:has-text("Tìm kiếm")').click()
      await expect(page).toHaveURL(/\/cau-hoi-thuong-gap\?q=/)

      // 5. Kiểm tra nút xóa tìm kiếm
      const clearButton = page.getByRole('link', { name: /Xóa tìm kiếm/i })
      if (await clearButton.isVisible()) {
        await clearButton.click()
        await expect(page).toHaveURL(/\/cau-hoi-thuong-gap$/)
      }

      // 6. Kiểm tra CTA strip ở cuối trang dẫn về /lien-he
      const ctaButton = page.getByRole('link', { name: /Liên hệ với Trạm/i })
      await expect(ctaButton).toBeVisible()
      await expect(ctaButton).toHaveAttribute('href', '/lien-he')
    })

    test('không bị tràn ngang trên màn hình di động 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/cau-hoi-thuong-gap')

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(isOverflowing).toBe(false)
    })
  })
})
