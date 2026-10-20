import { expect, test } from './fixtures'

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
      page
        .getByText(
          'Trạm Dừng Cảm Xúc – Hiểu mình rõ. Hành động bền bỉ. Tỏa sáng bằng thế mạnh riêng.',
        )
        .first(),
    ).toBeVisible()

    // 3. Kiểm tra dòng kiểm tra dấu tiếng Việt đặc thù (Anton diacritics check)
    await expect(page.getByText('Ữ Ộ Ặ Ỷ Ẫ Ỡ ữ ộ ặ ỷ')).toBeVisible()

    // 4. Kiểm tra tiêu đề 2 tầng màu
    await expect(page.getByText('Hiểu mình rõ.', { exact: true })).toBeVisible()
    await expect(page.getByText('Hành động bền bỉ.', { exact: true })).toBeVisible()

    // 5. Kiểm tra các icon nhận diện thương hiệu
    await expect(page.getByText('HeartLine', { exact: true })).toBeVisible()
    await expect(page.getByText('Valve', { exact: true })).toBeVisible()
    await expect(page.getByText('Butterfly', { exact: true })).toBeVisible()
    await expect(page.getByText('Leaf', { exact: true })).toBeVisible()
    await expect(page.getByText('ThinLine', { exact: true })).toBeVisible()
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
    await expect(page.getByText(/Cảm xúc không phải là kẻ thù cần chế ngự, mà là/)).toBeVisible()
    await expect(page.getByText('[MẪU] Tên tác giả').first()).toBeVisible()

    // 6. PriceTag & StatusBadge
    const primitivesSection = page.locator('section[aria-labelledby="heading-primitives"]')
    await expect(primitivesSection.getByText('120.000đ', { exact: true })).toBeVisible()
    await expect(primitivesSection.getByText('90.000đ', { exact: true })).toBeVisible()
    await expect(primitivesSection.getByText('Sắp ra mắt', { exact: true })).toBeVisible()
    await expect(primitivesSection.getByText('Đang mở bán', { exact: true })).toBeVisible()
    await expect(primitivesSection.getByText('Miễn phí', { exact: true })).toBeVisible()
    await expect(primitivesSection.getByText('Tư vấn', { exact: true })).toBeVisible()
    await expect(primitivesSection.getByText('Ẩn', { exact: true })).toBeVisible()
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
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName)

    expect(activeTagName, 'Phần tử active khi vừa tải trang phải là BODY').toBe('BODY')
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

test.describe('UI Composites (T0-05)', () => {
  test('Hiển thị đầy đủ 7 composite components trên /styleguide với dữ liệu mẫu', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/styleguide')

    // 1. Kiểm tra Section 7 UI Composites
    await expect(page.getByText('7. Bộ UI Composites')).toBeVisible()

    // 2. Navbar component
    if (isMobile) {
      await expect(page.locator('#mobile-nav-toggle')).toBeVisible()
      await expect(
        page.getByRole('link', { name: /\[MẪU\] Test 5p|Test thói quen/i }).first(),
      ).toBeVisible()
    } else {
      await expect(page.getByRole('link', { name: /\[MẪU\] Về Trạm/i }).first()).toBeVisible()
      await expect(
        page.getByRole('link', { name: /\[MẪU\] Đặt phiên trải nghiệm/i }).first(),
      ).toBeVisible()
    }

    // 3. ProductCard component
    await expect(page.getByText('[MẪU] Sổ tay Thói quen 21 Ngày')).toBeVisible()
    await expect(page.getByText('[MẪU] Bộ Thẻ Cảm Xúc EQ Buddy')).toBeVisible()
    await expect(page.getByText('[MẪU] Chương trình Coaching 1:1')).toBeVisible()

    // 4. TestimonialCard component
    await expect(
      page.getByText(/Sau phiên đồng hành, tôi nhận diện được những nút thắt/),
    ).toBeVisible()
    await expect(page.getByText('[MẪU] Chị Phương Mai')).toBeVisible()

    // 5. LeadForm component
    await expect(page.getByText('[MẪU] Đăng ký nhận cẩm nang cảm xúc')).toBeVisible()
    // Scope to the LeadForm: /styleguide also shows ContactForms (SM-06) with similar labels.
    const leadForm = page
      .locator('form')
      .filter({ has: page.getByPlaceholder('Nhập họ và tên của bạn') })
    await expect(leadForm.getByLabel(/Họ và tên/i)).toBeVisible()
    await expect(leadForm.getByLabel(/Địa chỉ email/i)).toBeVisible()
    await expect(leadForm.getByRole('button', { name: /Gửi thông tin/i })).toBeVisible()

    // 6. EmotionPicker component
    await expect(page.getByText('Chọn cảm xúc hôm nay').first()).toBeVisible()
    await expect(page.getByRole('radiogroup').first()).toBeVisible()

    // 7. ProgressGrid component
    await expect(page.getByRole('region', { name: 'Lưới tiến trình 21 ngày' })).toBeVisible()

    // 8. Footer component
    await expect(page.getByText('Chính sách & Quy định').first()).toBeVisible()
    await expect(page.getByText(/\[MẪU\] Thông tin pháp lý/).first()).toBeVisible()
    await expect(page.getByText(/\[MẪU\] Chính sách bảo mật/).first()).toBeVisible()
    await expect(page.getByText('[MẪU] contact@vi-du.vn').first()).toBeVisible()
  })

  test('Navbar mobile mở/đóng bằng bàn phím và giữ nút quiz nổi bật trên thanh', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/styleguide')

    const mobileToggle = page.locator('#mobile-nav-toggle')
    if (isMobile || (await mobileToggle.isVisible())) {
      // Quiz link phải nhìn thấy trên mobile bar bên ngoài drawer
      const quizLink = page.getByRole('link', { name: /\[MẪU\] Test 5p|Test thói quen/i }).first()
      await expect(quizLink).toBeVisible()

      // Focus và bấm Enter để mở drawer
      await mobileToggle.focus()
      await expect(mobileToggle).toBeFocused()
      await page.keyboard.press('Enter')

      const drawer = page.locator('#mobile-nav-drawer')
      await expect(drawer).toBeVisible()
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true')

      // Bấm Escape để đóng drawer và trả focus về nút mở
      await page.keyboard.press('Escape')
      await expect(drawer).not.toBeVisible()
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')
      await expect(mobileToggle).toBeFocused()
    }
  })

  test('Tab qua LeadForm theo thứ tự hợp lý và bỏ qua honeypot ẩn', async ({ page }) => {
    await page.goto('/styleguide')

    // Scope to the LeadForm: /styleguide also shows ContactForms (SM-06) with similar labels.
    const leadForm = page
      .locator('form')
      .filter({ has: page.getByPlaceholder('Nhập họ và tên của bạn') })
    const nameInput = leadForm.getByLabel(/Họ và tên/i)
    await nameInput.scrollIntoViewIfNeeded()
    await nameInput.focus()
    await expect(nameInput).toBeFocused()

    // Tab tới Email
    await page.keyboard.press('Tab')
    const emailInput = leadForm.getByLabel(/Địa chỉ email/i)
    await expect(emailInput).toBeFocused()

    // Tab bỏ qua Honeypot và tới checkbox đồng ý nhận tin
    await page.keyboard.press('Tab')
    const consentCheckbox = leadForm.getByRole('checkbox')
    await expect(consentCheckbox).toBeFocused()

    // Tab tới link Chính sách bảo mật
    await page.keyboard.press('Tab')
    const privacyLink = leadForm.getByRole('link', { name: /Chính sách bảo mật/i }).first()
    await expect(privacyLink).toBeFocused()

    // Tab tới nút Submit. Widget Turnstile (iframe Cloudflare) là điểm dừng Tab hợp lệ nằm giữa;
    // nó chỉ có khi trình duyệt tải được script Cloudflare, nên cho phép tối đa 3 điểm dừng
    // trung gian, với điều kiện focus không rời khỏi form.
    const submitBtn = leadForm.getByRole('button', { name: /Gửi thông tin/i })
    const submitHasFocus = () => submitBtn.evaluate((el) => el === document.activeElement)
    for (let stops = 0; stops < 4; stops++) {
      await page.keyboard.press('Tab')
      if (await submitHasFocus()) break
      const stillInForm = await submitBtn.evaluate((el) => {
        const active = document.activeElement
        return !!active && active !== document.body && el.closest('form')?.contains(active) === true
      })
      expect(stillInForm, 'Focus rời khỏi form trước khi tới nút Gửi').toBe(true)
    }
    await expect(submitBtn).toBeFocused()
  })

  test('B5: Navbar ở màn hình 375px với nhãn đầy đủ không tràn ngang và nút #mobile-nav-toggle nằm trọn trong màn hình', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/styleguide')

    const mobileToggle = page.locator('#mobile-nav-toggle')
    await expect(mobileToggle).toBeVisible()

    // 1. Nhãn đầy đủ không dùng shortLabel vẫn hiển thị trọn vẹn
    const quizLink = page.getByRole('link', { name: /Test thói quen 5 phút/i }).first()
    await expect(quizLink).toBeVisible()

    // 2. Toàn bộ document không bị tràn ngang ở 375px
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)

    // 3. Nút #mobile-nav-toggle nằm trọn trong màn hình 375px (x >= 0 và x + width <= 375)
    const toggleBox = await mobileToggle.boundingBox()
    expect(toggleBox).not.toBeNull()
    if (toggleBox) {
      expect(toggleBox.x).toBeGreaterThanOrEqual(0)
      expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(375)
    }
  })
})
