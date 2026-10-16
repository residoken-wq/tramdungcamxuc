import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t1-18-${randomUUID()}@example.test`)
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

// E2E test (T1-18): Kiểm tra toàn bộ liên kết nội bộ trên trang chủ và thư viện không bị 404
// và kịch bản để lại thông tin trên trang /sap-ra-mat.
// LƯU Ý: File này viết theo spec T1-18, không chạy trong task T1-18 (chạy ở pipeline Planning/CI).

test.describe('No dead links & Coming soon lead form (T1-18)', () => {
  test('all internal links on landing page and library tabs return non-404', async ({
    page,
    request,
  }) => {
    const urlsToCrawl = ['/', '/thu-vien?tab=khoa-hoc', '/thu-vien?tab=noi-dung']
    const collectedHrefs = new Set<string>()

    for (const url of urlsToCrawl) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })

      // Gom toàn bộ liên kết bắt đầu bằng '/'
      const links = await page
        .locator('a[href^="/"]')
        .evaluateAll((anchors: HTMLAnchorElement[]) =>
          anchors
            .map((a) => a.getAttribute('href') || '')
            .filter(
              (href) => href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/\\'),
            ),
        )

      for (const href of links) {
        // Loại trừ luồng checkout /thanh-toan? (T2-08 chưa làm)
        if (href.startsWith('/thanh-toan?') || href === '/thanh-toan') {
          continue
        }
        collectedHrefs.add(href)
      }
    }

    expect(collectedHrefs.size).toBeGreaterThan(0)

    // Kiểm tra từng link không trả về lỗi 404
    for (const href of collectedHrefs) {
      const response = await request.get(href)
      expect(
        response.status(),
        `Đường dẫn nội bộ "${href}" không được trả về 404 Not Found`,
      ).not.toBe(404)
    }
  })

  test('coming soon page loads product and successfully submits lead form', async ({
    page,
    browser,
  }) => {
    test.setTimeout(180000)
    // Tự tạo dữ liệu (CI không có seed MẪU) rồi dọn dẹp, theo mẫu library.test.ts.
    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    const slug = `sap-ra-mat-test-${randomUUID().slice(0, 8)}`
    const productName = `Công cụ thử ${randomUUID().slice(0, 8)}`
    const leadEmail = `lead-${randomUUID().slice(0, 8)}@example.test`
    let userId: number | undefined
    let productId: number | undefined

    try {
      userId = await bootstrapAdmin(page)
      const created = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug,
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'coming_soon',
          isSample: true,
          _status: 'published',
        },
      })
      expect(created.status(), await created.text()).toBe(201)
      productId = (await created.json()).doc.id

      const ctx = await browser.newContext()
      try {
        const guest = await ctx.newPage()
        // Turnstile giữ long-poll: không dùng 'networkidle'.
        await guest.goto(`/sap-ra-mat?san-pham=${slug}`)
        // h1 gồm 2 dòng (tên sản phẩm + phụ đề) nên khớp một phần.
        await expect(
          guest.getByRole('heading', { level: 1, name: new RegExp(productName) }),
        ).toBeVisible()
        await guest.getByLabel(/Họ và tên/).fill('Học viên Test 01')
        await guest.getByLabel(/Địa chỉ email/).fill(leadEmail)
        await guest.locator('input[type="checkbox"]').first().check()
        await expect(guest.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
          timeout: 20000,
        })
        await guest.getByRole('button', { name: /Nhận thông báo mở bán/ }).click()
        await expect(guest.getByText('Gửi thông tin thành công!')).toBeVisible({ timeout: 15000 })
      } finally {
        await ctx.close()
      }

      const leads = await page.request.get(
        `/api/leads?where[email][equals]=${encodeURIComponent(leadEmail)}&limit=1`,
      )
      expect(leads.ok()).toBe(true)
      const lead = (await leads.json()).docs[0] as
        { id: number; interestTags?: { text: string }[] } | undefined
      expect(lead?.interestTags?.some((t) => t.text === `sap-ra-mat:${slug}`)).toBe(true)
      if (lead) await page.request.delete(`/api/leads/${lead.id}`).catch(() => {})
    } finally {
      if (productId) await page.request.delete(`/api/products/${productId}`).catch(() => {})
      if (userId) await page.request.delete(`/api/users/${userId}`).catch(() => {})
    }
  })
})
