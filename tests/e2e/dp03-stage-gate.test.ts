import { test, expect, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import * as zip from './helpers/habit-zip'
import { vi as viStrings } from '../../src/lib/i18n/vi'

const SCREENSHOT_DIR = path.join(process.cwd(), 'docs/screenshots/dp03')

async function getAdminToken(page: Page): Promise<string> {
  const initRes = await page.request.get('/api/users/init')
  const init = await initRes.json()
  if (init.initialized === false) {
    const password = `AdminPass-${randomUUID()}`
    const email = `admin-dp03-${randomUUID()}@example.test`
    await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
    await page.locator('#field-email').fill(email)
    await page.locator('#field-password').fill(password)
    await page.locator('#field-confirm-password').fill(password)
    let token = ''
    await expect(async () => {
      const registration = page.waitForResponse(
        (res) =>
          res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
        { timeout: 5000 },
      )
      await page.locator('button[type="submit"]').click()
      const response = await registration
      if (response && response.ok()) {
        const json = await response.json()
        token = json.token
      }
    }).toPass({ timeout: 60000 })
    return token
  } else {
    const loginRes = await page.request.post('/api/users/login', {
      data: {
        email: 'admin@tramdungcamxuc.com',
        password: 'AdminPassword123!',
      },
    })
    const json = await loginRes.json()
    return json.token
  }
}

test.describe('DP-03: Cổng đăng nhập sau Giai đoạn 1 Habit (/habit/5-phut)', () => {
  test.beforeAll(() => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    }
  })

  test('Khách mới: Làm Giai đoạn 1 -> Gặp cổng login -> Đăng nhập Google -> Bước 3 -> Bước 6 email khoá -> Vào tracker', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    const isMobile = testInfo.project.name === 'mobile-375'
    const deviceLabel = isMobile ? 'mobile' : 'desktop'

    const randomIp = `203.0.113.${Math.floor(Math.random() * 240) + 10}`
    const context = await browser.newContext({
      viewport: { width: isMobile ? 375 : 1440, height: isMobile ? 667 : 900 },
      extraHTTPHeaders: { 'x-forwarded-for': randomIp },
    })
    const page = await context.newPage()

    const newCustomerEmail = `dp03-new-${Date.now()}-${randomUUID().slice(0, 6)}@example.test`

    let adminToken = ''

    try {
      // 1. Vào /habit/5-phut làm bước 1–2
      await page.goto('/habit/5-phut')
      await expect(page.getByText(/Khám đúng nút thắt|Khám đúng bệnh/i).first()).toBeVisible({
        timeout: 20000,
      })

      // Bước 1: Trả lời chẩn đoán
      await zip.answerDiagnose(page, 4)

      // Bước 2: Xem nguyên lý 1%
      await expect(page.getByText(/Nguyên lý 1%/i).first()).toBeVisible({ timeout: 15000 })

      // Bấm Sang giai đoạn 2
      await page.getByRole('button', { name: /Sang giai đoạn 2/i }).click()

      // Màn cổng login xuất hiện
      await expect(page.getByText(viStrings.dp03.loginTitle)).toBeVisible({ timeout: 15000 })
      await expect(page.getByText(viStrings.dp03.loginPrompt)).toBeVisible()
      const loginBtn = page.getByRole('link', { name: viStrings.dp03.loginButton }).last()
      await expect(loginBtn).toBeVisible()

      // Bước 3 KHÔNG được render
      await expect(page.getByPlaceholder('Thức dậy, uống một ly nước')).not.toBeVisible()

      // Chụp ảnh màn cổng Login
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `login-gate-${deviceLabel}.png`),
        fullPage: false,
      })

      // Bấm "Đăng nhập để tiếp tục" -> dẫn tới /tai-khoan/dang-nhap?next=...
      await loginBtn.click()
      await expect(page).toHaveURL(/\/tai-khoan\/dang-nhap/, { timeout: 15000 })

      // Tick đồng ý điều khoản
      const consentCheckbox = page.locator('input[name="consentPolicy"]')
      await expect(consentCheckbox).toBeVisible()
      await consentCheckbox.check()
      await expect(consentCheckbox).toBeChecked()

      // Đăng nhập Google bằng route giả GL-01 với mock_email
      await page.goto(
        `/api/auth/google/start?next=${encodeURIComponent('/habit/5-phut?buoc=3')}&consent=1&mock_email=${encodeURIComponent(newCustomerEmail)}`,
      )

      // Quay lại đúng ?buoc=3
      await expect(page).toHaveURL(/\/habit\/5-phut\?buoc=3/, { timeout: 20000 })

      // Bước 3 hiển thị, câu trả lời bước 1 vẫn còn
      await expect(page.getByPlaceholder('Thức dậy, uống một ly nước')).toBeVisible({
        timeout: 15000,
      })

      // Đi tiếp các bước 3..5
      await zip.fillMentor(page, '[MẪU] Uống nước ấm sáng')
      await zip.fillIdentity(page, {
        action: 'chạy bộ 15 phút',
        role: 'người bền bỉ yêu sức khoẻ',
        atomic: 'Xỏ giày thể thao',
      })
      await zip.setRhythm(page, 'Mỗi ngày')
      await zip.nextFromIdentity(page)

      const techBoxes = page.getByRole('checkbox')
      const count = await techBoxes.count()
      if (count > 0) {
        const names = await techBoxes.evaluateAll((els) =>
          els.slice(0, 2).map((e) => e.getAttribute('aria-label') ?? ''),
        )
        await zip.pickTechniques(
          page,
          names.map((n) => ({ name: n })),
        )
      }
      await zip.nextFromLoop(page)

      // Bước 6: Form lên chuyến
      await expect(page.getByText('HABIT BOARDING PASS').first()).toBeVisible({ timeout: 15000 })

      // Email đã được điền sẵn từ phiên và bị khoá chỉ đọc
      const emailInput = page.getByLabel(/Email nhận kế hoạch/)
      await expect(emailInput).toBeVisible()
      await expect(emailInput).toHaveValue(newCustomerEmail.toLowerCase())
      await expect(emailInput).not.toBeEditable()

      // Chụp ảnh Bước 6 email khoá
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `step6-locked-email-${deviceLabel}.png`),
        fullPage: false,
      })

      // Điền tên và Lưu kế hoạch
      await page.getByLabel('Tên của bạn').fill('Học Viên Mới DP03')
      await zip.submitBoarding(page)

      // Nút vào tracker hiển thị thành công
      const trackerLink = page.getByRole('link', { name: /Vào bảng theo dõi 28 ngày/ })
      await expect(trackerLink).toBeVisible()
    } finally {
      // Dọn dẹp dữ liệu test của khách mới
      try {
        adminToken = await getAdminToken(page)
        if (adminToken) {
          await page.request
            .delete(`/api/leads?where[email][equals]=${newCustomerEmail}`, {
              headers: { Authorization: `JWT ${adminToken}` },
            })
            .catch(() => {})
          await page.request
            .delete(`/api/habitPlans?where[leadEmail][equals]=${newCustomerEmail}`, {
              headers: { Authorization: `JWT ${adminToken}` },
            })
            .catch(() => {})
          await page.request
            .delete(`/api/customers?where[email][equals]=${newCustomerEmail}`, {
              headers: { Authorization: `JWT ${adminToken}` },
            })
            .catch(() => {})
        }
      } catch {}
      await context.close()
    }
  })

  test('Khách đã hết dùng thử: Đăng nhập -> Làm Giai đoạn 1 -> Gặp cổng Mua để dùng tiếp với giá CMS', async ({
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    const isMobile = testInfo.project.name === 'mobile-375'
    const deviceLabel = isMobile ? 'mobile' : 'desktop'

    const randomIp = `203.0.113.${Math.floor(Math.random() * 240) + 10}`
    const context = await browser.newContext({
      viewport: { width: isMobile ? 375 : 1440, height: isMobile ? 667 : 900 },
      extraHTTPHeaders: { 'x-forwarded-for': randomIp },
    })
    const page = await context.newPage()

    const expiredCustomerEmail = `dp03-exp-${Date.now()}-${randomUUID().slice(0, 6)}@example.test`

    let adminToken = ''
    let createdCustomerId: number | undefined
    let createdEntitlementId: number | undefined

    try {
      adminToken = await getAdminToken(page)

      // Đọc ID sản phẩm habit-tracker-so
      const prodRes = await page.request.get(
        '/api/products?where[slug][equals]=habit-tracker-so&depth=0',
        {
          headers: { Authorization: `JWT ${adminToken}` },
        },
      )
      expect(prodRes.ok()).toBe(true)
      const prodDocs = (await prodRes.json()).docs
      expect(prodDocs.length).toBeGreaterThan(0)
      const habitProductId = prodDocs[0].id

      // Tạo khách hàng qua API Admin
      const custRes = await page.request.post('/api/customers', {
        headers: { Authorization: `JWT ${adminToken}` },
        data: {
          email: expiredCustomerEmail,
          name: 'Khách Hết Dùng Thử',
          consentAt: new Date().toISOString(),
        },
      })
      if (!custRes.ok()) {
        console.error('custRes failed:', custRes.status(), await custRes.text())
      }
      expect(custRes.ok()).toBe(true)
      const custJson = await custRes.json()
      createdCustomerId = custJson.doc.id

      // Cấp entitlement trial đã hết hạn
      const entRes = await page.request.post('/api/entitlements', {
        headers: { Authorization: `JWT ${adminToken}` },
        data: {
          customer: createdCustomerId,
          product: habitProductId,
          source: 'trial',
          status: 'expired',
          grantedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() - 7 * 86400000).toISOString(),
        },
      })
      if (!entRes.ok()) {
        console.error('entRes failed:', entRes.status(), await entRes.text())
      }
      expect(entRes.ok()).toBe(true)
      createdEntitlementId = (await entRes.json()).doc.id

      // Đăng nhập khách hết hạn dùng thử
      await page.goto(
        `/api/auth/google/start?next=${encodeURIComponent('/habit/5-phut')}&consent=1&mock_email=${encodeURIComponent(expiredCustomerEmail)}`,
      )
      await expect(page).toHaveURL(/\/habit\/5-phut/, { timeout: 15000 })

      // Bước 1: Trả lời chẩn đoán
      await zip.answerDiagnose(page, 3)
      await expect(page.getByText(/Nguyên lý 1%/i).first()).toBeVisible({ timeout: 15000 })

      // Bấm Sang giai đoạn 2
      await page.getByRole('button', { name: /Sang giai đoạn 2/i }).click()

      // Màn "Mua để dùng tiếp" xuất hiện
      await expect(page.getByText(viStrings.dp03.buyTitle)).toBeVisible({ timeout: 15000 })
      const buyBtn = page.getByRole('link', { name: viStrings.dp03.buyButton }).last()
      await expect(buyBtn).toBeVisible()
      await expect(buyBtn).toHaveAttribute('href', '/thanh-toan?san-pham=habit-tracker-so')

      // Nút phụ xem chi tiết gói trỏ tới /habit/1-percent-better
      const offerBtn = page.getByRole('link', { name: viStrings.dp03.viewOfferButton }).last()
      await expect(offerBtn).toBeVisible()
      await expect(offerBtn).toHaveAttribute('href', '/habit/1-percent-better')

      // Giá từ CMS hiển thị trên màn hình
      await expect(page.getByText(/178\.000/)).toBeVisible()

      // Chụp ảnh màn cổng Buy
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `buy-gate-${deviceLabel}.png`),
        fullPage: false,
      })
    } finally {
      // Dọn dẹp dữ liệu test của khách hết hạn
      if (adminToken) {
        if (createdEntitlementId) {
          await page.request
            .delete(`/api/entitlements/${createdEntitlementId}`, {
              headers: { Authorization: `JWT ${adminToken}` },
            })
            .catch(() => {})
        }
        if (createdCustomerId) {
          await page.request
            .delete(`/api/customers/${createdCustomerId}`, {
              headers: { Authorization: `JWT ${adminToken}` },
            })
            .catch(() => {})
        }
      }
      await context.close()
    }
  })
})
