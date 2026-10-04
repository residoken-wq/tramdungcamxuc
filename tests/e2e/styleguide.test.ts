import { expect, test } from '@playwright/test'

test.describe('Brand Tokens, Styleguide & Homepage Cleanup (T0-03)', () => {
  test('Trang chủ sạch template Payload và có lang="vi"', async ({ page }) => {
    await page.goto('/')

    // 1. Kiểm tra thuộc tính lang="vi"
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBe('vi')

    // 2. Tiêu đề trang
    await expect(page).toHaveTitle(/Trạm Dừng Cảm Xúc/)

    // 3. Hiển thị thương hiệu Trạm Dừng Cảm Xúc
    const heading = page.locator('h1')
    await expect(heading).toContainText('Trạm Dừng Cảm Xúc')

    // 4. Tuyệt đối không còn chữ Payload hay template mặc định
    const pageContent = await page.content()
    expect(pageContent).not.toContain('Payload Blank Template')
    expect(pageContent).not.toContain('Welcome to your new project')
    expect(pageContent).not.toContain('app/(frontend)/page.tsx')
  })

  test('Trang /styleguide hiển thị đầy đủ 8 token màu và câu mẫu tiếng Việt', async ({ page }) => {
    await page.goto('/styleguide')
    await expect(page).toHaveTitle(/Brand Styleguide/)

    // 1. Kiểm tra hiển thị đủ 8 tên token màu
    const expectedTokens = [
      'deep-navy',
      'bright-magenta',
      'accent-pink',
      'soft-pink',
      'lavender-mist',
      'mint-haze',
      'butter-cream',
      'warm-ivory',
    ]

    for (const token of expectedTokens) {
      await expect(page.getByText(token, { exact: true })).toBeVisible()
    }

    // 2. Kiểm tra câu mẫu tiếng Việt
    await expect(
      page.getByText('Trạm Dừng Cảm Xúc – Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.').first()
    ).toBeVisible()

    // 3. Kiểm tra dòng kiểm tra dấu tiếng Việt đặc thù (Anton diacritics check)
    await expect(page.getByText('Ữ Ộ Ặ Ỷ Ẫ Ỡ ữ ộ ặ ỷ')).toBeVisible()

    // 4. Kiểm tra tiêu đề 2 tầng màu
    await expect(page.getByText('Hiểu mình rõ.', { exact: true })).toBeVisible()
    await expect(page.getByText('Hành động bền bỉ.', { exact: true })).toBeVisible()

    // 5. Kiểm tra các icon nhận diện thương hiệu
    await expect(page.getByText('HeartLine')).toBeVisible()
    await expect(page.getByText('Valve')).toBeVisible()
    await expect(page.getByText('Butterfly')).toBeVisible()
    await expect(page.getByText('Leaf')).toBeVisible()
    await expect(page.getByText('ThinLine')).toBeVisible()
  })
})
