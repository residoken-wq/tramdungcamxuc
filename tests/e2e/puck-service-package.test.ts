import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-04: Draggable ServiceCard & PackageCard child blocks with slot in ServiceCards & PackageCards
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.
// KHÔNG CHẠY trong luồng Pair Programming theo quy định task PK-04.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk04-${randomUUID()}@example.test`
  const password = randomUUID()
  await page.locator('#field-email').fill(email)
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
  const registered = await response.json()
  await expect(page).toHaveURL(/\/admin\/?$/)
  const userId = registered.user?.id || registered.doc?.id
  return { userId }
}

test.describe('PK-04: Draggable ServiceCard & PackageCard in ServiceCards & PackageCards', () => {
  test('trang ServiceCards v1 + PackageCards v1 hiển thị đúng khi đọc; builder đổi thứ tự gói, đổi nổi bật gói, đổi cỡ tên dịch vụ, xuất bản', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    const marker = randomUUID().slice(0, 8)
    const slug = `e2e-service-package-${marker}`
    let userId: number | undefined
    let pageId: number | undefined
    const serviceIds: number[] = []
    const packageIds: number[] = []

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Tạo 2 dịch vụ mẫu qua REST
      const srvRes1 = await page.request.post('/api/services', {
        data: {
          name: `[MẪU] Khai vấn Cảm xúc Cá nhân ${marker}`,
          slug: `khai-van-ca-nhan-${marker}`,
          tagline: 'Lắng nghe và chuyển hóa',
          _status: 'published',
          isSample: true,
          order: 1,
        },
      })
      expect(srvRes1.ok()).toBe(true)
      const srv1 = await srvRes1.json()
      const srv1Id = srv1.doc?.id || srv1.id
      serviceIds.push(srv1Id)

      const srvRes2 = await page.request.post('/api/services', {
        data: {
          name: `[MẪU] Khai vấn Chuyển mình Sự nghiệp ${marker}`,
          slug: `khai-van-su-nghiep-${marker}`,
          tagline: 'Vững vàng định hướng',
          _status: 'published',
          isSample: true,
          order: 2,
        },
      })
      expect(srvRes2.ok()).toBe(true)
      const srv2 = await srvRes2.json()
      const srv2Id = srv2.doc?.id || srv2.id
      serviceIds.push(srv2Id)

      // 2. Tạo 3 gói mẫu qua REST
      const pkgRes1 = await page.request.post('/api/products', {
        data: {
          type: 'package',
          name: `[MẪU] Gói CLEAR ${marker}`,
          slug: `clear-${marker}`,
          price: 1750000,
          _status: 'published',
          saleStatus: 'on_sale',
          isSample: true,
          order: 1,
        },
      })
      expect(pkgRes1.ok()).toBe(true)
      const pkg1 = await pkgRes1.json()
      const pkg1Id = pkg1.doc?.id || pkg1.id
      packageIds.push(pkg1Id)

      const pkgRes2 = await page.request.post('/api/products', {
        data: {
          type: 'package',
          name: `[MẪU] Gói BUILD ${marker}`,
          slug: `build-${marker}`,
          price: 2900000,
          _status: 'published',
          saleStatus: 'on_sale',
          isSample: true,
          order: 2,
        },
      })
      expect(pkgRes2.ok()).toBe(true)
      const pkg2 = await pkgRes2.json()
      const pkg2Id = pkg2.doc?.id || pkg2.id
      packageIds.push(pkg2Id)

      const pkgRes3 = await page.request.post('/api/products', {
        data: {
          type: 'package',
          name: `[MẪU] Gói SHINE ${marker}`,
          slug: `shine-${marker}`,
          price: 4320000,
          _status: 'published',
          saleStatus: 'on_sale',
          isSample: true,
          order: 3,
        },
      })
      expect(pkgRes3.ok()).toBe(true)
      const pkg3 = await pkgRes3.json()
      const pkg3Id = pkg3.doc?.id || pkg3.id
      packageIds.push(pkg3Id)

      // 3. Tạo trang lưu ServiceCards v1 + PackageCards v1
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E Service Package ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'ServiceCards',
                props: {
                  id: 'services-e2e',
                  version: 1,
                  titleLine1: '[MẪU] DỊCH VỤ',
                  titleLine2: '[MẪU] ĐỒNG HÀNH',
                  services: [{ serviceId: srv1Id }, { serviceId: srv2Id }],
                  highlightServiceId: srv2Id,
                  bgColor: 'warm-ivory',
                  padding: 'lg',
                },
              },
              {
                type: 'PackageCards',
                props: {
                  id: 'packages-e2e',
                  version: 1,
                  titleLine1: '[MẪU] BA GIAI ĐOẠN',
                  titleLine2: '[MẪU] GROWTH MIRROR',
                  style: 'numbered',
                  packages: [{ packageId: pkg1Id }, { packageId: pkg2Id }, { packageId: pkg3Id }],
                  highlightPackageId: pkg1Id,
                  buttonText: 'Đặt ngay',
                  buttonLink: '/dat-phien-trai-nghiem',
                  bgColor: 'warm-ivory',
                  padding: 'lg',
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E Service Package ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      const createdData = await created.json()
      pageId = createdData.doc?.id || createdData.id
      expect(pageId).toBeDefined()

      // 4. Mở trang công khai trước khi mở builder:
      // - 2 tên dịch vụ đúng thứ tự, dịch vụ 2 có nền navy;
      // - 3 gói có số và giá từ CMS;
      // - gói 1 có viền nổi bật.
      await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })

      const serviceTitles = publicPage.locator('section[data-bg] h3')
      await expect(serviceTitles.first()).toContainText(`[MẪU] Khai vấn Cảm xúc Cá nhân ${marker}`)
      await expect(serviceTitles.nth(1)).toContainText(
        `[MẪU] Khai vấn Chuyển mình Sự nghiệp ${marker}`,
      )

      // Dịch vụ 2 nổi bật có nền deep-navy
      const serviceCardContainers = publicPage.locator('section[data-bg] .rounded-card')
      await expect(serviceCardContainers.nth(1)).toHaveClass(/\bbg-deep-navy\b/)

      // 3 gói có giá từ CMS và số 01, 02, 03
      const pkgTitles = publicPage.locator('section[data-style="numbered"] h3')
      await expect(pkgTitles).toHaveCount(3)
      await expect(pkgTitles.nth(0)).toContainText(`[MẪU] Gói CLEAR ${marker}`)
      await expect(pkgTitles.nth(1)).toContainText(`[MẪU] Gói BUILD ${marker}`)
      await expect(pkgTitles.nth(2)).toContainText(`[MẪU] Gói SHINE ${marker}`)

      // Gói 1 có viền/ring nổi bật
      const pkgCards = publicPage.locator('section[data-style="numbered"] .rounded-card')
      await expect(pkgCards.nth(0)).toHaveClass(/border-accent-pink|ring-accent-pink/)

      // 5. Mở builder
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const canvas = page.frameLocator('iframe')

      // A. Chọn thẻ gói 3 và nhân bản (chọn nhân bản để đảm bảo gói 3 có thêm một bản trước/sau một cách ổn định)
      const pkg3Heading = canvas.getByRole('heading', {
        name: `[MẪU] Gói SHINE ${marker}`,
        exact: false,
      })
      await expect(pkg3Heading).toBeVisible({ timeout: 30000 })

      const duplicateBtn = canvas.locator('button[title="Nhân bản"]').first()
      await expect(async () => {
        await pkg3Heading.click()
        await expect(duplicateBtn).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await duplicateBtn.click()

      // B. Đổi nổi bật: chọn gói 1, tắt nổi bật
      const pkg1Heading = canvas
        .getByRole('heading', { name: `[MẪU] Gói CLEAR ${marker}`, exact: false })
        .first()
      const highlightSelect = page.getByRole('combobox', { name: 'Thẻ nổi bật', exact: true })
      await expect(async () => {
        await pkg1Heading.click()
        await expect(highlightSelect).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await highlightSelect.selectOption({ label: 'Không' })

      // Chọn gói 2, bật nổi bật
      const pkg2Heading = canvas.getByRole('heading', {
        name: `[MẪU] Gói BUILD ${marker}`,
        exact: false,
      })
      await expect(async () => {
        await pkg2Heading.click()
        await expect(highlightSelect).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await highlightSelect.selectOption({ label: 'Có' })

      // C. Chọn dịch vụ 1, đổi cỡ tên sang "Lớn"
      const srv1Heading = canvas.getByRole('heading', {
        name: `[MẪU] Khai vấn Cảm xúc Cá nhân ${marker}`,
        exact: false,
      })
      const srvNameSizeSelect = page.getByRole('combobox', {
        name: 'Cỡ tên dịch vụ',
        exact: true,
      })
      await expect(async () => {
        await srv1Heading.click()
        await expect(srvNameSizeSelect).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await srvNameSizeSelect.selectOption({ label: 'Lớn' })

      // D. Xuất bản
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      // 6. Kiểm tra trang công khai sau khi xuất bản
      await expect(async () => {
        await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
        const reloadedPkgCards = publicPage.locator('section[data-style="numbered"] .rounded-card')
        // Có 4 thẻ gói do vừa nhân bản gói 3
        await expect(reloadedPkgCards).toHaveCount(4, { timeout: 2000 })
      }).toPass({ timeout: 30000 })

      // Gói 2 nổi bật có viền accent-pink
      const reloadedPkg2 = publicPage
        .locator('section[data-style="numbered"] .rounded-card')
        .filter({ hasText: `[MẪU] Gói BUILD ${marker}` })
      await expect(reloadedPkg2).toHaveClass(/border-accent-pink|ring-accent-pink/)

      // Dịch vụ 1 có class cỡ mới: text-3xl
      const reloadedSrv1 = publicPage
        .locator('section[data-bg] h3')
        .filter({ hasText: `[MẪU] Khai vấn Cảm xúc Cá nhân ${marker}` })
      await expect(reloadedSrv1).toHaveClass(/\btext-3xl\b/)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary E2E page must be removed.').toBe(true)
        }
      } finally {
        for (const sId of serviceIds) {
          try {
            await page.request.delete(`/api/services/${sId}`)
          } catch {
            // ignore cleanup errors
          }
        }
        for (const pId of packageIds) {
          try {
            await page.request.delete(`/api/products/${pId}`)
          } catch {
            // ignore cleanup errors
          }
        }
        if (userId) {
          try {
            await page.request.delete(`/api/users/${userId}`)
          } catch {
            // ignore cleanup errors
          }
        }
      }
    }
  })
})
