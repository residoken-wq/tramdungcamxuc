#!/usr/bin/env node
// Screenshots for docs/HUONG_DAN_CMS.md (T1-17a). Planning runs it; agents only edit it.
//
//   pnpm seed                      # sample data the shots rely on
//   pnpm build && pnpm start       # or any running instance
//   CMS_SHOT_URL=http://localhost:3000 CMS_SHOT_EMAIL=<email> CMS_SHOT_PASSWORD=<mật khẩu> \
//     node scripts/cms-screenshots.mjs [số ảnh, vd. 11 13]
//
// Credentials come from the environment only. Pages with a form (Turnstile) are never awaited
// with 'networkidle'. A missing element logs a warning and the shot is still taken.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const BASE = (process.env.CMS_SHOT_URL || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL = process.env.CMS_SHOT_EMAIL
const PASSWORD = process.env.CMS_SHOT_PASSWORD
if (!EMAIL || !PASSWORD) {
  console.error('Đặt CMS_SHOT_EMAIL và CMS_SHOT_PASSWORD (không ghi mật khẩu vào file).')
  process.exit(1)
}
const OUT = join(process.cwd(), 'docs', 'images', 'huong-dan')
const ONLY = new Set(process.argv.slice(2).map((n) => n.padStart(2, '0')))
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: 'vi-VN',
})
const page = await context.newPage()
const canvas = () => page.frameLocator('iframe').first()

async function soft(fn, label) {
  try {
    await fn()
  } catch {
    console.warn(`  ! ${label} – vẫn chụp`)
  }
}
async function shot(name) {
  if (ONLY.size && !ONLY.has(name.slice(0, 2))) return
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(OUT, name) })
  console.log(`✓ ${name}`)
}
async function go(path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)
}
async function firstId(collection, where = '') {
  const res = await page.request.get(`${BASE}/api/${collection}?limit=1&depth=0&draft=true${where}`)
  const json = await res.json()
  const id = json.docs?.[0]?.id
  if (!id) console.warn(`  ! không thấy bản ghi ${collection}${where} – đã chạy pnpm seed chưa?`)
  return id
}
async function scrollTo(selector, label) {
  await soft(async () => {
    await page.locator(selector).first().scrollIntoViewIfNeeded({ timeout: 5000 })
    await page.evaluate(() => window.scrollBy(0, -120))
  }, label)
}

// 01 – login screen
await go('/admin/login')
await shot('01-dang-nhap.png')
await page.locator('#field-email').fill(EMAIL)
await page.locator('#field-password').fill(PASSWORD)
await page.locator('button[type="submit"]').click()
await page.waitForURL(/\/admin\/?$/, { timeout: 30000 })

// 02 – account page after pressing "Đổi mật khẩu"
await go('/admin/account')
await soft(
  () => page.getByRole('button', { name: /Đổi mật khẩu/ }).click({ timeout: 5000 }),
  'nút Đổi mật khẩu',
)
await shot('02-doi-mat-khau.png')

// 03 – product list with [MẪU] rows
await go('/admin/collections/products')
await shot('03-du-lieu-mau.png')

// 04, 05 – an on-sale product: price fields, then sale status
const productId = await firstId('products', '&where[saleStatus][equals]=on_sale')
await go(`/admin/collections/products/${productId}`)
await scrollTo('#field-price', 'ô giá')
await shot('04-sua-gia-va-uu-dai.png')
await scrollTo('#field-saleStatus', 'ô trạng thái bán')
await soft(
  () => page.locator('#field-saleStatus').click({ timeout: 3000 }),
  'mở danh sách trạng thái',
)
await shot('05-doi-trang-thai-san-pham.png')
await page.keyboard.press('Escape')

// 06 – package components
const packageId = await firstId('products', '&where[type][equals]=package')
await go(`/admin/collections/products/${packageId}`)
await scrollTo('#field-components', 'cấu phần gói')
await shot('06-cau-phan-goi-growth-mirror.png')

// 07 – private file upload
await go('/admin/collections/privateFiles/create')
await shot('07-tai-lieu-rieng-tu.png')

// 08 – testimonial form, consent checkbox in view
await go('/admin/collections/testimonials/create')
await scrollTo('#field-consent', 'ô đồng ý')
await shot('08-them-testimonial-dong-y.png')

// 09 – new page, template select opened
await go('/admin/collections/pages/create')
await soft(() => page.locator('#field-template').click({ timeout: 5000 }), 'ô Mẫu trang')
await shot('09-tao-trang-tu-mau.png')
await page.keyboard.press('Escape')

// 10 – the home page record with the "Chỉnh sửa trực quan" button
const homeId = await firstId('pages', '&where[slug][equals]=%2F')
await go(`/admin/collections/pages/${homeId}`)
await shot('10-nut-chinh-sua-truc-quan.png')

// 11 – editor overview
await go(`/builder/${homeId}`)
await soft(
  () => canvas().locator('[data-puck-component]').first().waitFor({ timeout: 30000 }),
  'canvas editor chưa dựng xong',
)
await page.waitForTimeout(2000)
await shot('11-toan-canh-puck-editor.png')

// 12 – a heading block selected: its fields open on the right
await soft(
  () => canvas().locator('[data-puck-component]').nth(1).click({ force: true, timeout: 5000 }),
  'chọn khối',
)
await shot('12-keo-khoi-sua-chu.png')

// 13 – the locked Hero selected
await soft(
  () => canvas().locator('[data-puck-component]').first().click({ force: true, timeout: 5000 }),
  'chọn Hero',
)
await shot('13-khoa-khoi-hero-trang-chu.png')

// 14 – phone preview
await soft(
  () =>
    page
      .locator('button[title*="375"], button[aria-label*="375"]')
      .first()
      .click({ timeout: 5000 }),
  'nút 375px',
)
await page.waitForTimeout(1500)
await shot('14-xem-thu-3-man-hinh.png')
await soft(
  () =>
    page
      .locator('button[title*="1440"], button[aria-label*="1440"]')
      .first()
      .click({ timeout: 5000 }),
  'nút 1440px',
)

// 15 – version history dialog
await soft(
  () => page.getByRole('button', { name: 'Lịch sử', exact: true }).click({ timeout: 5000 }),
  'nút Lịch sử',
)
await page.waitForTimeout(1500)
await shot('15-lich-su-khoi-phuc.png')
await soft(
  () => page.getByRole('button', { name: 'Đóng', exact: true }).click({ timeout: 5000 }),
  'đóng hộp Lịch sử',
)

// 16, 17 – header buttons
await soft(
  () =>
    page
      .getByRole('button', { name: /Nhân bản trang/ })
      .first()
      .hover({ timeout: 5000 }),
  'nút Nhân bản trang',
)
await shot('16-nhan-ban-trang.png')
await soft(
  () => page.getByRole('button', { name: 'Xuất bản', exact: true }).hover({ timeout: 5000 }),
  'nút Xuất bản',
)
await shot('17-luu-nhap-va-xuat-ban.png')

// 18 – an existing legal page
const legalId = await firstId('legalPages')
await go(`/admin/collections/legalPages/${legalId}`)
await shot('18-sua-trang-phap-ly.png')

// 19, 20, 21 – site settings tabs
await go('/admin/globals/siteSettings')
await soft(
  () => page.getByRole('button', { name: 'Người bán', exact: true }).click({ timeout: 5000 }),
  'tab Người bán',
)
await shot('19-thong-tin-nguoi-ban.png')
await soft(
  () => page.getByRole('button', { name: 'Liên hệ & Zalo', exact: true }).click({ timeout: 5000 }),
  'tab Liên hệ & Zalo',
)
await shot('20-cai-dat-zalo-chat.png')
await soft(
  () => page.getByRole('button', { name: 'Thanh toán', exact: true }).click({ timeout: 5000 }),
  'tab Thanh toán',
)
await shot('21-cai-dat-ngan-hang-vietqr.png')

// 22 – a coaching service: booking link
const serviceId = await firstId('services')
await go(`/admin/collections/services/${serviceId}`)
await scrollTo('#field-bookingUrl', 'ô Liên kết đặt lịch')
await shot('22-lien-ket-dat-lich-coaching.png')

// 23 – leads list with the CSV export button
await go('/admin/collections/leads')
await shot('23-quan-ly-leads-xuat-csv.png')

// 24 – an existing diagnostic question
const questionId = await firstId('diagnosticQuestions')
await go(`/admin/collections/diagnosticQuestions/${questionId}`)
await shot('24-cau-hoi-quiz-chan-doan.png')

// 25 – a typical validation error: publish an empty testimonial
await go('/admin/collections/testimonials/create')
await soft(
  () =>
    page
      .getByRole('button', { name: /Xuất bản/ })
      .first()
      .click({ timeout: 5000 }),
  'nút Xuất bản',
)
await page.waitForTimeout(1500)
await shot('25-thong-bao-loi-thuong-gap.png')

// 26 – order detail: payment link in sidebar for admin-created orders
const adminOrderId = await firstId('orders', '&where[createdByAdmin][equals]=true')
const orderId = adminOrderId || (await firstId('orders'))
if (orderId) {
  await go(`/admin/collections/orders/${orderId}`)
  await scrollTo('[data-testid="order-payment-link-copy"]', 'nút Sao chép link thanh toán')
  await shot('26-link-thanh-toan-goi.png')
}

// 27 – service live preview: open preview pane on a service
if (serviceId) {
  await go(`/admin/collections/services/${serviceId}`)
  await soft(
    () => page.getByRole('button', { name: /Xem trước/i }).click({ timeout: 5000 }),
    'nút Xem trước',
  )
  await page.waitForTimeout(2000)
  await shot('27-xem-truoc-dich-vu.png')
}

await browser.close()
