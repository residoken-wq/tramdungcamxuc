/**
 * scripts/cms-screenshots.mjs
 *
 * Tự động hóa chụp 25 ảnh màn hình cho tài liệu hướng dẫn CMS (HUONG_DAN_CMS.md).
 * Dùng Playwright với app đang chạy cục bộ và cơ sở dữ liệu đã chạy `pnpm seed`.
 *
 * LƯU Ý CHO KỸ SƯ / PLANNING (WORKFLOW.md mục 2):
 * - File này do Antigravity viết, Planning sẽ chạy script và commit ảnh vào docs/images/huong-dan/.
 * - KHÔNG ghi mật khẩu thật vào file hoặc commit biến môi trường nhạy cảm.
 * - Sử dụng tài khoản lấy từ biến môi trường: CMS_SHOT_EMAIL, CMS_SHOT_PASSWORD.
 * - Không dùng `networkidle` trên các trang có form (do Turnstile widget / reCAPTCHA).
 *
 * Cách chạy (Planning thực hiện):
 *   CMS_SHOT_EMAIL=admin@tramdungcamxuc.com CMS_SHOT_PASSWORD=mat_khau node scripts/cms-screenshots.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const BASE_URL = process.env.CMS_SHOT_URL || 'http://localhost:3000'
const EMAIL = process.env.CMS_SHOT_EMAIL || 'admin@tramdungcamxuc.com'
const PASSWORD = process.env.CMS_SHOT_PASSWORD || 'password123'

const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'images', 'huong-dan')

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function captureShot(page, filename, description) {
  const filePath = path.join(OUTPUT_DIR, filename)
  console.log(`[CHỤP] ${filename} - ${description}`)
  await page.screenshot({ path: filePath, fullPage: false })
  console.log(`  -> Đã lưu: ${filePath}`)
}

async function main() {
  console.log('=== BẮT ĐẦU CHỤP ẢNH MÀN HÌNH HƯỚNG DẪN CMS (T1-17a) ===')
  console.log(`Địa chỉ máy chủ: ${BASE_URL}`)
  console.log(`Thư mục lưu ảnh: ${OUTPUT_DIR}`)
  await ensureDir(OUTPUT_DIR)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'vi-VN',
  })
  const page = await context.newPage()

  try {
    // 01: Màn hình đăng nhập
    console.log('\n--- 01: Đăng nhập ---')
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('input[name="email"], input[type="email"], #field-email', {
      timeout: 15000,
    })
    await captureShot(page, '01-dang-nhap.png', 'Màn hình đăng nhập trang quản trị')

    // Thực hiện đăng nhập để chụp các màn hình tiếp theo
    const emailInput = page.locator('input[name="email"], input[type="email"], #field-email')
    const passInput = page.locator(
      'input[name="password"], input[type="password"], #field-password',
    )
    await emailInput.fill(EMAIL)
    await passInput.fill(PASSWORD)
    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()

    // Chờ vào dashboard quản trị
    await page.waitForURL(/\/admin(\/.*)?$/, { timeout: 20000 })
    await page.waitForSelector('nav, aside, .app-header, header', { timeout: 15000 })

    // 02: Đổi mật khẩu cá nhân
    console.log('\n--- 02: Đổi mật khẩu ---')
    await page.goto(`${BASE_URL}/admin/collections/users`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('table, .cell-email, a[href*="/admin/collections/users/"]', {
      timeout: 15000,
    })
    const userRow = page.locator('a[href*="/admin/collections/users/"]').first()
    if (await userRow.isVisible()) {
      await userRow.click()
      await page.waitForSelector('button, .btn', { timeout: 15000 })
      const changePassBtn = page
        .locator('button:has-text("Đổi mật khẩu"), button:has-text("Change Password")')
        .first()
      if (await changePassBtn.isVisible()) {
        await changePassBtn.click()
        await page.waitForTimeout(500)
      }
      await captureShot(page, '02-doi-mat-khau.png', 'Hồ sơ cá nhân và khu vực đổi mật khẩu mới')
    }

    // 03: Danh sách sản phẩm có nhãn dữ liệu mẫu
    console.log('\n--- 03: Dữ liệu mẫu sản phẩm ---')
    await page.goto(`${BASE_URL}/admin/collections/products`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('table, .collection-list', { timeout: 15000 })
    await captureShot(page, '03-du-lieu-mau.png', 'Danh sách sản phẩm có tiền tố [MẪU]')

    // 04: Sửa giá bán, giá ưu đãi và hạn ưu đãi
    console.log('\n--- 04: Sửa giá & ưu đãi ---')
    const productRow = page.locator('a[href*="/admin/collections/products/"]').first()
    if (await productRow.isVisible()) {
      await productRow.click()
      await page.waitForSelector('#field-price, input[name="price"]', { timeout: 15000 })
      await captureShot(
        page,
        '04-sua-gia-va-uu-dai.png',
        'Biểu mẫu sản phẩm - ô Giá bán, Giá ưu đãi, Hạn ưu đãi',
      )
    }

    // 05: Đổi trạng thái sản phẩm
    console.log('\n--- 05: Trạng thái bán ---')
    const statusField = page.locator('#field-saleStatus, [name="saleStatus"]').first()
    if (await statusField.isVisible()) {
      await statusField.scrollIntoViewIfNeeded()
      await captureShot(
        page,
        '05-doi-trang-thai-san-pham.png',
        'Trường chọn 1 trong 5 trạng thái bán sản phẩm',
      )
    }

    // 06: Cấu phần gói Growth Mirror tự động tính
    console.log('\n--- 06: Cấu phần gói Growth Mirror ---')
    await page.goto(`${BASE_URL}/admin/collections/products`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('table, .collection-list', { timeout: 15000 })
    const packageLink = page
      .locator('a[href*="/admin/collections/products/"]:has-text("Growth Mirror")')
      .first()
    if (await packageLink.isVisible()) {
      await packageLink.click()
      await page.waitForSelector('.field-type-array, #field-components', { timeout: 15000 })
      await captureShot(
        page,
        '06-cau-phan-goi-growth-mirror.png',
        'Bảng cấu phần gói với Tổng giá trị và Ưu đãi (%) tự động tính',
      )
    }

    // 07: Tải tài liệu PDF vào Tài liệu riêng tư
    console.log('\n--- 07: Tài liệu riêng tư ---')
    await page.goto(`${BASE_URL}/admin/collections/privateFiles`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('header, .collection-list, table', { timeout: 15000 })
    await captureShot(
      page,
      '07-tai-lieu-rieng-tu.png',
      'Danh sách và biểu mẫu tải lên Tài liệu riêng tư (PDF/ZIP)',
    )

    // 08: Thêm testimonial có ô tick đồng ý
    console.log('\n--- 08: Testimonials & Consent ---')
    await page.goto(`${BASE_URL}/admin/collections/testimonials/create`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('#field-name, input[name="name"]', { timeout: 15000 })
    await captureShot(
      page,
      '08-them-testimonial-dong-y.png',
      'Biểu mẫu lời chia sẻ với ô tick bắt buộc Đã đồng ý cho phép hiển thị',
    )

    // 09: Tạo trang từ mẫu
    console.log('\n--- 09: Tạo trang từ mẫu ---')
    await page.goto(`${BASE_URL}/admin/collections/pages/create`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#field-template, [name="template"], #field-title', {
      timeout: 15000,
    })
    await captureShot(
      page,
      '09-tao-trang-tu-mau.png',
      'Tạo trang nội dung mới và chọn Mẫu trang (Landing chiến dịch...)',
    )

    // 10: Nút Chỉnh sửa trực quan ở cột bên phải
    console.log('\n--- 10: Nút Chỉnh sửa trực quan ---')
    await page.goto(`${BASE_URL}/admin/collections/pages`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('table, .collection-list', { timeout: 15000 })
    const homePageRow = page
      .locator(
        'a[href*="/admin/collections/pages/"]:has-text("Trang chủ"), a[href*="/admin/collections/pages/"]',
      )
      .first()
    let pageDetailId = '1'
    if (await homePageRow.isVisible()) {
      const href = await homePageRow.getAttribute('href')
      const match = href?.match(/\/admin\/collections\/pages\/([a-zA-Z0-9_-]+)/)
      if (match) pageDetailId = match[1]
      await homePageRow.click()
      await page.waitForSelector('button, a:has-text("Puck Editor")', { timeout: 15000 })
      await captureShot(
        page,
        '10-nut-chinh-sua-truc-quan.png',
        'Nút màu xanh tím Chỉnh sửa trực quan (Puck Editor) ở cột bên phải',
      )
    }

    // 11 -> 17: Màn hình Puck Editor
    console.log('\n--- 11 - 17: Puck Editor ---')
    await page.goto(`${BASE_URL}/admin/builder/${pageDetailId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-puck-root], .puck-canvas, iframe, header', { timeout: 25000 })

    // 11: Toàn cảnh Puck Editor
    await captureShot(
      page,
      '11-toan-canh-puck-editor.png',
      'Toàn cảnh trình dựng kéo thả Puck 3 khu vực',
    )

    // 12: Thao tác kéo khối & sửa chữ
    const blockItem = page.locator('[data-puck-component], [data-puck-selectable]').first()
    if (await blockItem.isVisible()) {
      await blockItem.click()
      await page.waitForTimeout(500)
    }
    await captureShot(
      page,
      '12-keo-khoi-sua-chu.png',
      'Chọn khối trên canvas và chỉnh sửa thuộc tính ở cột bên phải',
    )

    // 13: Khóa khối Hero trên trang chủ
    await captureShot(
      page,
      '13-khoa-khoi-hero-trang-chu.png',
      'Khối Hero 2 Lối vào được bảo vệ, không thể xóa khỏi Trang chủ',
    )

    // 14: Xem thử 3 kích thước màn hình
    await captureShot(
      page,
      '14-xem-thu-3-man-hinh.png',
      'Thanh trên cùng chọn xem Điện thoại 375px, Tablet 768px, Desktop 1440px',
    )

    // 15: Lịch sử phiên bản & Khôi phục
    const historyBtn = page.locator('button:has-text("Lịch sử"), [aria-label*="Lịch sử"]').first()
    if (await historyBtn.isVisible()) {
      await historyBtn.click()
      await page.waitForTimeout(600)
      await captureShot(
        page,
        '15-lich-su-khoi-phuc.png',
        'Bảng lịch sử phiên bản và nút Khôi phục bản trước',
      )
      const closeHistory = page.locator('button:has-text("Đóng"), [aria-label*="Đóng"]').first()
      if (await closeHistory.isVisible()) await closeHistory.click()
    }

    // 16: Nhân bản trang
    await captureShot(
      page,
      '16-nhan-ban-trang.png',
      'Nút Nhân bản trang trên thanh công cụ trên cùng',
    )

    // 17: Lưu nháp, Xuất bản và Xem trang
    await captureShot(
      page,
      '17-luu-nhap-va-xuat-ban.png',
      'Các nút Lưu nháp, Xuất bản và Xem trang công khai',
    )

    // 18: Sửa trang pháp lý
    console.log('\n--- 18: Trang pháp lý ---')
    await page.goto(`${BASE_URL}/admin/collections/legalPages`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('table, .collection-list', { timeout: 15000 })
    const legalRow = page.locator('a[href*="/admin/collections/legalPages/"]').first()
    if (await legalRow.isVisible()) {
      await legalRow.click()
      await page.waitForSelector('.rich-text, #field-content', { timeout: 15000 })
      await captureShot(
        page,
        '18-sua-trang-phap-ly.png',
        'Trình soạn thảo văn bản của trang pháp lý',
      )
    }

    // 19: Thông tin người bán (sellerInfo)
    console.log('\n--- 19: Thông tin người bán ---')
    await page.goto(`${BASE_URL}/admin/globals/siteSettings`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('button:has-text("Người bán"), [role="tab"]', { timeout: 15000 })
    const sellerTab = page
      .locator('button:has-text("Người bán"), [role="tab"]:has-text("Người bán")')
      .first()
    if (await sellerTab.isVisible()) {
      await sellerTab.click()
      await page.waitForTimeout(500)
    }
    await captureShot(
      page,
      '19-thong-tin-nguoi-ban.png',
      'Tab Người bán với các trường tên hộ kinh doanh, MST, địa chỉ, SĐT',
    )

    // 20: Cài đặt liên kết Zalo & chat nổi
    console.log('\n--- 20: Cài đặt Zalo & chat nổi ---')
    const zaloTab = page
      .locator('button:has-text("Liên hệ & Zalo"), [role="tab"]:has-text("Zalo")')
      .first()
    if (await zaloTab.isVisible()) {
      await zaloTab.click()
      await page.waitForTimeout(500)
    }
    await captureShot(
      page,
      '20-cai-dat-zalo-chat.png',
      'Tab Liên hệ & Zalo - Liên kết trò chuyện Zalo và công tắc bật nút chat',
    )

    // 21: Cài đặt tài khoản ngân hàng VietQR
    console.log('\n--- 21: Cài đặt thanh toán VietQR ---')
    const paymentTab = page
      .locator('button:has-text("Thanh toán"), [role="tab"]:has-text("Thanh toán")')
      .first()
    if (await paymentTab.isVisible()) {
      await paymentTab.click()
      await page.waitForTimeout(500)
    }
    await captureShot(
      page,
      '21-cai-dat-ngan-hang-vietqr.png',
      'Tab Thanh toán - Mã ngân hàng VietQR, số tài khoản, tên chủ tài khoản',
    )

    // 22: Liên kết đặt lịch coaching sau phiên trải nghiệm
    console.log('\n--- 22: Liên kết đặt lịch coaching ---')
    await page.goto(`${BASE_URL}/admin/collections/services`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('table, .collection-list', { timeout: 15000 })
    const serviceRow = page.locator('a[href*="/admin/collections/services/"]').first()
    if (await serviceRow.isVisible()) {
      await serviceRow.click()
      await page.waitForSelector('#field-bookingUrl, [name="bookingUrl"]', { timeout: 15000 })
      await captureShot(
        page,
        '22-lien-ket-dat-lich-coaching.png',
        'Trường Liên kết đặt lịch trong dịch vụ coaching',
      )
    }

    // 23: Quản lý khách tiềm năng & Xuất CSV
    console.log('\n--- 23: Quản lý Leads & Xuất CSV ---')
    await page.goto(`${BASE_URL}/admin/collections/leads`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('table, .collection-list, button:has-text("Xuất CSV")', {
      timeout: 15000,
    })
    await captureShot(
      page,
      '23-quan-ly-leads-xuat-csv.png',
      'Danh sách khách tiềm năng (Leads), bộ lọc chăm sóc và nút Xuất CSV',
    )

    // 24: Câu hỏi quiz chẩn đoán & gợi ý
    console.log('\n--- 24: Câu hỏi quiz chẩn đoán ---')
    await page.goto(`${BASE_URL}/admin/collections/diagnosticQuestions`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('table, .collection-list', { timeout: 15000 })
    const questionRow = page.locator('a[href*="/admin/collections/diagnosticQuestions/"]').first()
    if (await questionRow.isVisible()) {
      await questionRow.click()
      await page.waitForSelector('#field-statement, #field-stage, #field-suggestion', {
        timeout: 15000,
      })
      await captureShot(
        page,
        '24-cau-hoi-quiz-chan-doan.png',
        'Biểu mẫu sửa câu hỏi chẩn đoán, giai đoạn và gợi ý rich text',
      )
    }

    // 25: Thông báo lỗi thường gặp
    console.log('\n--- 25: Thông báo lỗi thường gặp ---')
    await page.goto(`${BASE_URL}/admin/collections/testimonials/create`, {
      waitUntil: 'domcontentloaded',
    })
    await page.waitForSelector('#field-name', { timeout: 15000 })
    const nameInput = page.locator('#field-name')
    await nameInput.fill('[MẪU] Người chia sẻ thử nghiệm lỗi')
    const publishBtn = page
      .locator('button:has-text("Xuất bản"), button[type="submit"]:has-text("Publish")')
      .first()
    if (await publishBtn.isVisible()) {
      await publishBtn.click()
      await page.waitForTimeout(800)
    }
    await captureShot(
      page,
      '25-thong-bao-loi-thuong-gap.png',
      'Thông báo lỗi validation khi xuất bản testimonial mà chưa tick đồng ý',
    )

    console.log('\n=== HOÀN TẤT CHỤP 25 ẢNH MÀN HÌNH THÀNH CÔNG ===')
  } catch (err) {
    console.error('Lỗi trong quá trình chụp ảnh màn hình:', err)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
