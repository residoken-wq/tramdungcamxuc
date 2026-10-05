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

  test('UI Primitives (T0-04) hiển thị đầy đủ trên /styleguide và kiểm tra trạng thái tương tác', async ({
    page,
  }) => {
    await page.goto('/styleguide')

    // 1. Kiểm tra Section 6 UI Primitives
    await expect(page.getByText('6. Bộ UI Primitives nền tảng')).toBeVisible()

    // 2. Button variants & states
    await expect(page.getByRole('button', { name: 'Nút Primary (CTA)' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nút Secondary' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nút Ghost' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đang xử lý' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Bị vô hiệu hóa' })).toBeDisabled()
    await expect(page.getByRole('link', { name: 'Nút dạng Link (Next.js)' })).toBeVisible()

    // 3. Card variants
    await expect(page.getByText('Variant White')).toBeVisible()
    await expect(page.getByText('Variant Soft Pink')).toBeVisible()
    await expect(page.getByText('Variant Lavender Mist')).toBeVisible()

    // 4. SectionHeader
    await expect(page.getByText('CHUỖI BÀI HỌC CẢM XÚC')).toBeVisible()
    await expect(page.getByText('Nhận diện cơn bão.')).toBeVisible()
    await expect(page.getByText('Tìm về điểm tựa.')).toBeVisible()

    // 5. QuoteBlock
    await expect(page.getByText(/Cảm xúc không phải là kẻ thù cần chế ngự/)).toBeVisible()
    await expect(page.getByText('[MẪU] Tên tác giả').first()).toBeVisible()

    // 6. PriceTag & StatusBadge
    await expect(page.getByText('120.000đ', { exact: true })).toBeVisible()
    await expect(page.getByText('90.000đ', { exact: true })).toBeVisible()
    await expect(page.getByText('Sắp ra mắt', { exact: true })).toBeVisible()
    await expect(page.getByText('Đang mở bán', { exact: true })).toBeVisible()
    await expect(page.getByText('Miễn phí', { exact: true })).toBeVisible()
    await expect(page.getByText('Tư vấn', { exact: true })).toBeVisible()
    await expect(page.getByText('Ẩn', { exact: true })).toBeVisible()
  })

  test('Kiểm tra A11y & Phím tắt (T0-04): mở Modal bằng bàn phím → Esc đóng → focus về nút mở; Tab thấy focus ring', async ({
    page,
  }) => {
    await page.goto('/styleguide')

    const modalTrigger = page.locator('#open-modal-demo-btn')
    await expect(modalTrigger).toBeVisible()

    // 1. Focus vào nút mở Modal bằng bàn phím và kiểm tra focus ring
    await modalTrigger.focus()
    await expect(modalTrigger).toBeFocused()

    // 2. Mở Modal bằng phím Enter
    await page.keyboard.press('Enter')

    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Trạm Dừng Nhận Diện Cảm Xúc')).toBeVisible()

    // 3. Đóng Modal bằng phím Escape
    await page.keyboard.press('Escape')

    // 4. Modal phải ẩn hoàn toàn
    await expect(dialog).not.toBeVisible()

    // 5. Focus phải tự động quay trở về nút mở Modal
    await expect(modalTrigger).toBeFocused()

    // 6. Tab qua các nút để xác minh trạng thái focus-visible
    await page.keyboard.press('Tab')
    const toastSuccessBtn = page.getByRole('button', { name: 'Bật Toast Thành công' })
    await expect(toastSuccessBtn).toBeFocused()

    // Kích hoạt Toast và kiểm tra vai trò role="status"
    await page.keyboard.press('Enter')
    const toast = page.locator('div[role="status"]')
    await expect(toast).toBeVisible()
    await expect(toast.getByText('Đã lưu thói quen thành công!')).toBeVisible()
  })

  test('B1 Guardrail: Tải /styleguide không bị cướp focus và không bị cuộn trang xuống nút mở Modal', async ({
    page,
  }) => {
    await page.goto('/styleguide')
    await page.waitForTimeout(200)

    const scrollY = await page.evaluate(() => window.scrollY)
    const activeId = await page.evaluate(() => document.activeElement?.id)

    expect(activeId, 'Nút mở modal không được cướp focus khi trang vừa tải').not.toBe('open-modal-demo-btn')
    expect(scrollY, 'Trang không được tự động cuộn khi vừa tải').toBe(0)
  })

  test('B2 Guardrail: Modal chứa input do cha giữ state cho phép gõ liên tục mà không làm giật focus về nút đóng', async ({
    page,
  }) => {
    await page.goto('/styleguide')

    const modalTrigger = page.locator('#open-modal-demo-btn')
    await modalTrigger.click()

    const dialog = page.locator('div[role="dialog"]')
    await expect(dialog).toBeVisible()

    const input = page.locator('#modal-feedback-input')
    await expect(input).toBeVisible()

    // Click vào input để bắt đầu gõ
    await input.click()
    await expect(input).toBeFocused()

    // Gõ liên tiếp 5 ký tự "hello"
    await page.keyboard.type('hello')

    // Kiểm tra focus vẫn nằm ở ô input và giá trị đủ 5 ký tự
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('hello')
  })
})
