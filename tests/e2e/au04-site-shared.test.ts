import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'
import { communityTemplate } from '@/puck/templates/community'

// AU-04: E2E Test cho các tính năng dùng chung (Shared Components & Fixes)
// - Tiêu đề tô màu nổi bật bằng cú pháp *...*
// - Nhãn "Free" trên menu
// - Form modal Tham gia ME TIME / Yoga Buddy / Nhận brochure
// - Nút đặt lịch phiên trải nghiệm dẫn tới trang thanh toán
// - 375px responsive không cuộn ngang và chuẩn a11y

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`au04-${randomUUID()}@example.test`)
  await page.locator('#field-password').fill(password)
  await page.locator('#field-confirm-password').fill(password)

  let response: Response | undefined
  await expect(async () => {
    const registration = page.waitForResponse(
      (res) => res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
      { timeout: 5000 },
    )
    await page.locator('button[type="submit"]').click()
    response = await registration
  }).toPass({ timeout: 60000 })

  if (!response) throw new Error('First-user registration request was never sent.')
  expect(response.ok()).toBe(true)
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

test.describe('AU-04: Site shared components & fixes E2E', () => {
  test('title highlighting, menu badge, modal lead submission, booking flow, 375px responsiveness and a11y', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const suffix = randomUUID().slice(0, 8)
    const slug = `e2e-au04-${suffix}`
    let pageId: number | undefined
    let productId: number | undefined
    let leadId: number | undefined

    const testEmail = `hocvien-${suffix}@example.com`
    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      await bootstrapAdmin(page)

      // 1. Cấu hình menu điều hướng với nhãn Free
      await page.request.post('/api/globals/navigation', {
        data: {
          mainMenu: [
            {
              label: 'Check-in cảm xúc',
              badge: 'Free',
              linkType: 'url',
              url: '/habit',
            },
            {
              label: 'Về Trạm',
              linkType: 'url',
              url: '/ve-tram',
            },
          ],
        },
      })

      // 2. Tạo sản phẩm coaching trial nếu chưa có
      const existingProducts = await (
        await page.request.get('/api/products?where[type][equals]=coaching_trial&limit=1')
      ).json()

      if (existingProducts.docs && existingProducts.docs.length > 0) {
        productId = existingProducts.docs[0].id
      } else {
        const createProductRes = await page.request.post('/api/products', {
          data: {
            name: `Phiên trải nghiệm ${suffix}`,
            slug: `phien-trai-nghiem-${suffix}`,
            web: 'site',
            type: 'coaching_trial',
            price: 149000,
            saleStatus: 'on_sale',
          },
        })
        const productData = await createProductRes.json()
        productId = productData.doc.id
      }

      // 3. Tạo trang kiểm thử từ communityTemplate kèm khối SectionHeader có cú pháp *...*
      const testContent = [
        {
          type: 'SectionHeader',
          props: {
            id: 'au04-header',
            seriesLabel: 'AU-04 · TIÊU ĐỀ NỔI BẬT',
            titleLine1: '*Chuyển* mình',
            titleLine2: 'không *chênh* vênh',
            emotionLine: 'Kiểm tra hiển thị chữ nổi bật bằng dấu sao',
          },
        },
        ...communityTemplate.content,
      ]

      const pageCreateRes = await page.request.post('/api/pages', {
        data: {
          title: `E2E AU-04 Page ${suffix}`,
          slug,
          kind: 'page',
          _status: 'published',
          puckData: {
            content: testContent,
            root: {
              props: {
                title: `E2E AU-04 Page ${suffix}`,
              },
            },
          },
        },
      })
      expect(pageCreateRes.ok()).toBe(true)
      const pageData = await pageCreateRes.json()
      pageId = pageData.doc.id

      // 4. Khách truy cập trang ở độ phân giải 1440px
      await guest.setViewportSize({ width: 1440, height: 900 })
      const publicResponse = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(publicResponse?.status()).toBe(200)

      // Test 1: Kiểm tra chữ nổi bật trong tiêu đề *Chuyển* và *chênh*
      const highlightedChuyen = guest.locator('h2 span.text-bright-magenta:has-text("Chuyển")')
      const highlightedChenh = guest.locator('h2 span.text-bright-magenta:has-text("chênh")')
      await expect(highlightedChuyen).toBeVisible()
      await expect(highlightedChenh).toBeVisible()

      // Test 2: Kiểm tra nhãn Free trên thanh điều hướng
      const freeBadge = guest.locator('nav a:has-text("Check-in cảm xúc") [aria-label="Nhãn: Free"]')
      await expect(freeBadge).toBeVisible()
      expect(await freeBadge.textContent()).toBe('Free')

      // Test 3: Bấm nút "Tham gia Me Time" -> mở modal -> gửi dữ liệu test
      const meTimeButton = guest
        .getByRole('button', { name: /tham gia me time/i })
        .or(guest.getByRole('link', { name: /tham gia me time/i }))
        .first()

      await expect(meTimeButton).toBeVisible()
      await meTimeButton.click()

      // Cửa sổ modal mở lên
      const modalDialog = guest.getByRole('dialog')
      await expect(modalDialog).toBeVisible()
      await expect(guest.getByRole('heading', { name: /tham gia me time/i })).toBeVisible()

      // Điền thông tin vào form modal
      await modalDialog.locator('input[type="text"][autocomplete="name"]').fill('Học viên Test 01')
      await modalDialog.locator('input[type="tel"]').fill('0901234567')
      await modalDialog.locator('input[type="email"]').fill(testEmail)
      await modalDialog.locator('input[type="checkbox"]').check()

      // Bấm gửi form
      await modalDialog.locator('button[type="submit"]').click()

      // Thấy câu cảm ơn
      await expect(modalDialog.getByText(/cảm ơn bạn, trạm sẽ liên hệ qua zalo sớm/i)).toBeVisible({
        timeout: 10000,
      })

      // Kiểm tra có bản ghi lead mới tạo trong hệ thống
      const leadsRes = await page.request.get(
        `/api/leads?where[email][equals]=${encodeURIComponent(testEmail)}`,
      )
      expect(leadsRes.ok()).toBe(true)
      const leadsData = await leadsRes.json()
      expect(leadsData.docs.length).toBeGreaterThanOrEqual(1)
      const createdLead = leadsData.docs[0]
      leadId = createdLead.id
      expect(createdLead.name).toBe('Học viên Test 01')
      expect(createdLead.phone).toBe('0901234567')
      expect(createdLead.source?.form).toBe('community-me-time')

      // Đóng modal
      await modalDialog.getByRole('button', { name: /đóng/i }).click()
      await expect(modalDialog).not.toBeVisible()

      // Test 4: Kiểm tra nút đặt lịch phiên trải nghiệm dẫn tới trang trả về mã 200
      if (productId) {
        const bookingResponse = await guest.goto(`/dat-phien-trai-nghiem?san-pham=${productId}`, {
          waitUntil: 'domcontentloaded',
        })
        expect(bookingResponse?.status()).toBe(200)
      }

      // Test 5: Kiểm tra giao diện điện thoại 375px không cuộn ngang và kiểm tra a11y
      await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.waitForTimeout(300)

      const scrollWidth = await guest.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await guest.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)

      // Kiểm tra axe accessibility
      await expectNoSeriousA11y(guest)
    } finally {
      // Dọn dẹp dữ liệu test
      if (leadId) {
        await page.request.delete(`/api/leads/${leadId}`).catch(() => {})
      }
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      await visitor.close()
    }
  })
})

