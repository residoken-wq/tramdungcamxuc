import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from '@playwright/test'

test.describe('T1-11: Growth Mirror page – 3 packages comparison & coaching trial booking', () => {
  test('verifies Growth Mirror comparison table, zero package buy buttons, mobile & desktop layouts, and price reactivity', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once per database configuration.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const email = `t1-11-${randomUUID()}@example.test`
    const password = randomUUID()
    const pageSlug = `coaching-growth-mirror-${randomUUID().slice(0, 8)}`

    // Product slugs
    const clearSlug = `growth-clear-${randomUUID().slice(0, 8)}`
    const buildSlug = `growth-build-${randomUUID().slice(0, 8)}`
    const shineSlug = `growth-shine-${randomUUID().slice(0, 8)}`
    const trialSlug = `growth-trial-${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined
    let clearId: number | undefined
    let buildId: number | undefined
    let shineId: number | undefined
    let trialId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      // 1. Authenticate or create first admin user if not initialized
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

      // 2. Create 3 package products (CLEAR, BUILD, SHINE)
      const clearRes = await page.request.post('/api/products', {
        data: {
          name: '[MẪU] Growth Mirror – gói CLEAR',
          slug: clearSlug,
          web: 'site',
          type: 'package',
          price: 1750000,
          saleStatus: 'consult',
          components: [
            { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
            { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
            {
              label: 'Coaching 1:1 "Vững vàng chuyển mình"',
              quantity: 1,
              unitValue: 1000000,
              retailPrice: 2200000,
            },
          ],
          _status: 'published',
        },
      })
      expect(clearRes.ok()).toBe(true)
      clearId = (await clearRes.json()).doc?.id

      const buildRes = await page.request.post('/api/products', {
        data: {
          name: '[MẪU] Growth Mirror – gói BUILD',
          slug: buildSlug,
          web: 'site',
          type: 'package',
          price: 2900000,
          saleStatus: 'consult',
          components: [
            { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
            { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
            {
              label: 'Coaching 1:1 "Vững vàng chuyển mình"',
              quantity: 3,
              unitValue: 1000000,
              retailPrice: 2200000,
            },
            { label: 'Tư vấn hướng nghiệp', quantity: 1, unitValue: 1000000, retailPrice: 1500000 },
            { label: 'Cộng đồng private "Tập thương cảm xúc"', quantity: 1, unitValue: 300000 },
          ],
          _status: 'published',
        },
      })
      expect(buildRes.ok()).toBe(true)
      buildId = (await buildRes.json()).doc?.id

      const shineRes = await page.request.post('/api/products', {
        data: {
          name: '[MẪU] Growth Mirror – gói SHINE',
          slug: shineSlug,
          web: 'site',
          type: 'package',
          price: 4320000,
          saleStatus: 'consult',
          components: [
            { label: 'Bộ công cụ số Habit Tracker + EQ Buddy', quantity: 1, unitValue: 500000 },
            { label: 'Workshop "Tập thương cảm xúc"', quantity: 2, unitValue: 500000 },
            {
              label: 'Coaching 1:1 "Vững vàng chuyển mình"',
              quantity: 6,
              unitValue: 1000000,
              retailPrice: 2200000,
            },
            { label: 'Tư vấn hướng nghiệp', quantity: 3, unitValue: 1000000, retailPrice: 1500000 },
            { label: 'Cộng đồng private "Tập thương cảm xúc"', quantity: 1, unitValue: 300000 },
          ],
          _status: 'published',
        },
      })
      expect(shineRes.ok()).toBe(true)
      shineId = (await shineRes.json()).doc?.id

      // 3. Create coaching trial product
      const trialRes = await page.request.post('/api/products', {
        data: {
          name: '[MẪU] Growth Mirror – phiên trải nghiệm',
          slug: trialSlug,
          web: 'site',
          type: 'coaching_trial',
          price: 149000,
          saleStatus: 'on_sale',
          ctaLabel: 'Đặt phiên trải nghiệm',
          _status: 'published',
        },
      })
      expect(trialRes.ok()).toBe(true)
      trialId = (await trialRes.json()).doc?.id

      // 4. Create Growth Mirror test page with SectionHeader, PackageComparison, and BookingCTA
      const pageRes = await page.request.post('/api/pages?draft=false', {
        data: {
          title: '[MẪU] Growth Mirror Page E2E',
          slug: pageSlug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'SectionHeader',
                props: {
                  id: 'hdr-growth-mirror',
                  seriesLabel: '[MẪU] Trạm Dừng Cảm Xúc',
                  titleLine1: '[MẪU] Growth Mirror',
                  titleLine2: '[MẪU] CLEAR · BUILD · SHINE',
                  emotionLine: '[MẪU] Thử trước bằng một phiên trải nghiệm',
                  as: 'h1',
                  align: 'center',
                },
              },
              {
                type: 'PackageComparison',
                props: {
                  id: 'pkg-growth-mirror',
                  version: 2,
                  packages: [
                    { packageId: String(clearId) },
                    { packageId: String(buildId) },
                    { packageId: String(shineId) },
                  ],
                  showTotalValue: true,
                  showDiscountPercent: true,
                  note: '[MẪU] Chi tiết chính sách thanh toán và quyền lợi xem bên dưới.',
                  showPaymentPolicyLink: true,
                  bgColor: 'warm-ivory',
                  padding: 'lg',
                },
              },
              {
                type: 'BookingCTA',
                props: {
                  id: 'booking-growth-mirror',
                  version: 1,
                  productId: String(trialId),
                  title: '[MẪU] Bắt đầu bằng một phiên trải nghiệm',
                  description: '[MẪU] 149.000đ để hiểu rõ cách thức đồng hành trước khi chọn gói.',
                  buttonLabel: 'Đặt phiên trải nghiệm',
                  variant: 'primary',
                  bgColor: 'soft-pink',
                  padding: 'lg',
                },
              },
            ],
            root: {},
          },
        },
      })
      expect(pageRes.ok()).toBe(true)
      pageId = (await pageRes.json()).doc?.id

      // 5. Desktop Viewport (1440x900) Verification
      await publicPage.setViewportSize({ width: 1440, height: 900 })
      await publicPage.goto(`/${pageSlug}`, { waitUntil: 'networkidle' })

      // Check section header
      await expect(publicPage.getByRole('heading', { level: 1 })).toBeVisible()

      // Check desktop comparison table
      await expect(publicPage.locator('table')).toBeVisible()
      await expect(publicPage.getByRole('columnheader', { name: /CLEAR/i })).toBeVisible()
      await expect(publicPage.getByRole('columnheader', { name: /BUILD/i })).toBeVisible()
      await expect(publicPage.getByRole('columnheader', { name: /SHINE/i })).toBeVisible()

      // Verify total value row and discount row
      await expect(publicPage.getByText(/Tổng giá trị thực tế/i)).toBeVisible()
      await expect(publicPage.getByText(/Ưu đãi/i).first()).toBeVisible()

      // Verify note and policy link
      await expect(
        publicPage.getByText(/Chi tiết chính sách thanh toán và quyền lợi xem bên dưới/i),
      ).toBeVisible()
      const policyLink = publicPage.getByRole('link', { name: /Chính sách giá & thanh toán/i })
      await expect(policyLink).toBeVisible()
      expect(await policyLink.getAttribute('href')).toBe('/gia-thanh-toan')

      // Assert ZERO buy buttons for individual packages in table
      const tableButtons = publicPage.locator('table button')
      expect(await tableButtons.count()).toBe(0)

      // Verify BookingCTA block: exactly 1 booking button with price 149.000đ
      await expect(publicPage.getByText('149.000đ')).toBeVisible()
      const bookingButton = publicPage.getByRole('link', { name: 'Đặt phiên trải nghiệm' })
      await expect(bookingButton).toBeVisible()
      await expect(bookingButton).toHaveCount(1)

      // 6. Mobile Viewport (375x667) Verification
      await publicPage.setViewportSize({ width: 375, height: 667 })
      await publicPage.reload({ waitUntil: 'networkidle' })

      // On mobile, the desktop table is hidden and package cards are displayed
      await expect(publicPage.locator('table')).toBeHidden()

      // Verify package cards on mobile
      await expect(
        publicPage
          .getByText(/Gói CLEAR/i)
          .or(publicPage.getByText(/CLEAR/i))
          .first(),
      ).toBeVisible()
      await expect(publicPage.getByText(/1.750.000đ/i).first()).toBeVisible()
      await expect(publicPage.getByText(/2.900.000đ/i).first()).toBeVisible()
      await expect(publicPage.getByText(/4.320.000đ/i).first()).toBeVisible()

      // Verify still only 1 booking button on mobile
      const mobileBookingBtn = publicPage.getByRole('link', { name: 'Đặt phiên trải nghiệm' })
      await expect(mobileBookingBtn).toBeVisible()
      await expect(mobileBookingBtn).toHaveCount(1)

      // 7. Price Reactivity Check: update BUILD package price via REST API
      const updatedPriceRes = await page.request.patch(`/api/products/${buildId}`, {
        data: {
          price: 2610000,
        },
      })
      expect(updatedPriceRes.ok()).toBe(true)

      // Reload public page (back to desktop)
      await publicPage.setViewportSize({ width: 1440, height: 900 })
      await publicPage.reload({ waitUntil: 'networkidle' })

      // Verify updated price is reflected immediately without page edit
      await expect(publicPage.getByText('2.610.000đ')).toBeVisible()
    } finally {
      // 8. Clean up test records
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (clearId) {
        await page.request.delete(`/api/products/${clearId}`).catch(() => {})
      }
      if (buildId) {
        await page.request.delete(`/api/products/${buildId}`).catch(() => {})
      }
      if (shineId) {
        await page.request.delete(`/api/products/${shineId}`).catch(() => {})
      }
      if (trialId) {
        await page.request.delete(`/api/products/${trialId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
      await publicContext.close().catch(() => {})
    }
  })
})
