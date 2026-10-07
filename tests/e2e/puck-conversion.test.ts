import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from '@playwright/test'

test.describe('T1-03: Puck Conversion Blocks – B2BBriefForm submission & ShopeeButton UTM', () => {
  test('creates product with externalUrl, creates page with B2BBriefForm and ShopeeButton, publishes page, visitor submits brief, verifies lead in REST API, and verifies ShopeeButton UTM params', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `t1-03-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `e2e-conversion-${randomUUID()}`
    const productSlug = `e2e-shopee-prod-${randomUUID()}`
    const productName = `Bộ thẻ EQ Buddy Shopee ${randomUUID().slice(0, 8)}`
    const externalShopeeUrl = 'https://shopee.vn/bo-the-eq-buddy-tram-dung-cam-xuc-test'

    const customerEmail = `client-b2b-${randomUUID()}@corp.test`
    const companyName = `Công ty Cổ phần Sáng Tạo E2E ${randomUUID().slice(0, 6)}`
    const contactName = 'Nguyễn Quản Lý E2E'
    const contactPhone = '0901234567'

    let userId: number | undefined
    let pageId: number | undefined
    let productId: number | undefined
    let leadId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      // 1. Authenticate or create first admin user
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()

      test.skip(
        !process.env.CI && initData.initialized === true,
        'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
      )

      expect(initData, 'Run on a migrated DB without admin users.').toMatchObject({
        initialized: false,
      })

      await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
      await page.locator('#field-email').fill(email)
      await page.locator('#field-password').fill(password)
      await page.locator('#field-confirm-password').fill(password)

      let response: Response | undefined
      await expect(async () => {
        const registration = page.waitForResponse(
          (res) =>
            res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
          { timeout: 5000 },
        )
        await page.locator('button[type="submit"]').click()
        response = await registration
      }).toPass({ timeout: 60000 })

      if (!response) throw new Error('First-user registration request was never sent.')
      expect(response.ok()).toBe(true)
      const registered = await response.json()
      userId = registered.user?.id || registered.doc?.id
      await expect(page).toHaveURL(/\/admin\/?$/)
      if (!userId) userId = (await (await page.request.get('/api/users/me')).json()).user.id

      // 2. Create published physical_external product with externalUrl
      const productRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: productSlug,
          web: 'site',
          type: 'physical_external',
          externalUrl: externalShopeeUrl,
          externalLabel: 'Mua trên Shopee',
          price: 250000,
          salePrice: 178000,
          saleStatus: 'on_sale',
          _status: 'published',
        },
      })
      expect(productRes.ok()).toBe(true)
      const productDoc = await productRes.json()
      productId = productDoc.doc?.id || productDoc.id
      expect(productId).toEqual(expect.any(Number))

      // 3. Create draft page with B2BBriefForm and ShopeeButton blocks referencing productId
      const pageRes = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] Trang Chuyển Đổi E2E',
          slug: pageSlug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'B2BBriefForm',
                props: {
                  id: 'brief-conversion-test',
                  title: 'Đăng ký brief giải pháp doanh nghiệp',
                  description: 'Hợp tác phát triển năng lực cảm xúc cho đội ngũ',
                },
              },
              {
                type: 'ShopeeButton',
                props: {
                  id: 'shopee-btn-conversion-test',
                  label: 'Mua Bộ Thẻ Trên Shopee',
                  source: 'product',
                  productId: String(productId),
                  campaign: 'e2e_shopee_conversion',
                },
              },
            ],
            root: { props: { title: '[MẪU] Trang Chuyển Đổi E2E' } },
          },
        },
      })
      expect(pageRes.ok()).toBe(true)
      const pageDoc = await pageRes.json()
      pageId = pageDoc.doc?.id || pageDoc.id
      expect(pageId).toEqual(expect.any(Number))

      // 4. Publish the page via REST
      const publishRes = await page.request.patch(`/api/pages/${pageId}?draft=false`, {
        data: {
          _status: 'published',
        },
      })
      expect(publishRes.ok()).toBe(true)

      // 5. Navigate to public page
      await publicPage.goto(`/${pageSlug}`, { waitUntil: 'networkidle' })

      // 6. Luồng 2: Fill and submit B2BBriefForm as public visitor
      const briefForm = publicPage.locator('#gui-brief')
      await expect(briefForm).toBeVisible()

      await briefForm.locator('input[name="name"]').fill(contactName)
      await briefForm.locator('input[name="email"]').fill(customerEmail)
      await briefForm.locator('input[name="company"]').fill(companyName)
      await briefForm.locator('input[name="phone"]').fill(contactPhone)
      await briefForm.locator('input[name="teamSize"]').fill('20-50 người')
      await briefForm
        .locator('textarea[name="message"]')
        .fill('Quan tâm giải pháp văn hóa cảm xúc cho bộ phận nhân sự.')
      await briefForm.locator('input[name="consent"]').check()

      await briefForm.locator('button[type="submit"]').click()

      // Verify success status feedback in UI
      const successFeedback = publicPage
        .getByText(/Gửi brief thành công!/i)
        .filter({ visible: true })
        .first()
      await expect(successFeedback).toBeVisible({ timeout: 10000 })

      // Verify lead created in Payload REST API /api/leads
      const leadsRes = await page.request.get(
        `/api/leads?where[email][equals]=${encodeURIComponent(customerEmail)}`,
      )
      expect(leadsRes.ok()).toBe(true)
      const leadsData = await leadsRes.json()
      expect(leadsData.docs).toHaveLength(1)

      const savedLead = leadsData.docs[0]
      leadId = savedLead.id
      expect(savedLead.need).toBe('business')
      expect(savedLead.brief?.company).toBe(companyName)
      expect(savedLead.source?.page).toContain(pageSlug)

      // 7. Luồng 3: Verify ShopeeButton has UTM parameters and opens in new window
      const shopeeBtn = publicPage
        .getByRole('link', { name: /Mua Bộ Thẻ Trên Shopee/i })
        .filter({ visible: true })
        .first()

      await expect(shopeeBtn).toBeVisible()
      await expect(shopeeBtn).toHaveAttribute('target', '_blank')
      await expect(shopeeBtn).toHaveAttribute('rel', /noopener/)

      const shopeeHref = await shopeeBtn.getAttribute('href')
      expect(shopeeHref).toBeTruthy()
      expect(shopeeHref).toContain('shopee.vn/bo-the-eq-buddy-tram-dung-cam-xuc-test')
      expect(shopeeHref).toContain('utm_source=tramdungcamxuc')
      expect(shopeeHref).toContain('utm_campaign=e2e_shopee_conversion')
    } finally {
      if (leadId) {
        await page.request.delete(`/api/leads/${leadId}`).catch(() => {})
      }
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (productId) {
        await page.request.delete(`/api/products/${productId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
      await publicPage.close().catch(() => {})
      await publicContext.close().catch(() => {})
    }
  })
})
