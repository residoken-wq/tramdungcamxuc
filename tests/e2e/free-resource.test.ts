import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'
import { signDownloadToken } from '../../src/lib/downloads/token'

// Builds its own data (admin, private PDF, free product) so it runs on an empty CI database.
// Every setup request is asserted: a failed setup must fail the test, never skip it silently.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t1-07-${randomUUID()}@example.test`)
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

test.describe('Free resource delivery (T1-07)', () => {
  test('free PDF is delivered only through a signed, expiring link', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let userId: number | undefined
    let fileId: number | undefined
    let productId: number | undefined
    const slug = `e2e-tai-nguyen-${randomUUID().slice(0, 8)}`
    const productName = `E2E Sách miễn phí ${randomUUID().slice(0, 6)}`

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      userId = await bootstrapAdmin(page)

      // 1. A real PDF (Payload rejects files whose content is not recognised as PDF).
      const pdfPage = await browser.newPage()
      await pdfPage.setContent('<h1>Tài liệu kiểm thử</h1>')
      const pdf = await pdfPage.pdf()
      await pdfPage.close()

      const upload = await page.request.post('/api/privateFiles', {
        multipart: {
          file: { name: `${slug}.pdf`, mimeType: 'application/pdf', buffer: pdf },
          _payload: JSON.stringify({}),
        },
      })
      expect(upload.status(), await upload.text()).toBe(201)
      const fileDoc = (await upload.json()).doc
      fileId = fileDoc.id

      const product = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug,
          web: 'site',
          type: 'ebook',
          saleStatus: 'free',
          files: [{ file: fileId }],
          _status: 'published',
        },
      })
      expect(product.status(), await product.text()).toBe(201)
      productId = (await product.json()).doc.id

      // 2. Private files are never reachable directly.
      expect((await guest.request.get('/api/privateFiles')).status()).toBe(403)
      expect((await guest.request.get(`/api/privateFiles/file/${fileDoc.filename}`)).status()).toBe(
        403,
      )

      // 3. Guest requests the resource. Turnstile keeps a long-poll open: no 'networkidle'.
      await guest.goto(`/tai-nguyen/${slug}`)
      await expect(guest.getByRole('heading', { level: 1, name: productName })).toBeVisible()
      await guest.getByLabel(/Họ và tên/).fill('Nguyễn Thị Mai')
      await guest.getByLabel(/Địa chỉ email/).fill(`mai-${randomUUID().slice(0, 6)}@example.test`)
      await guest.locator('input[type="checkbox"]').first().check()
      await expect(guest.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guest.getByRole('button', { name: /Nhận tài liệu/ }).click()
      await expect(guest.getByText('Kiểm tra email của bạn!')).toBeVisible({ timeout: 15000 })

      const leads = await page.request.get('/api/leads?where[source.form][equals]=resource&limit=5')
      expect(leads.ok()).toBe(true)
      const leadDocs: { interestTags?: { text: string }[] }[] = (await leads.json()).docs
      expect(leadDocs.some((d) => d.interestTags?.some((t) => t.text === `resource:${slug}`))).toBe(
        true,
      )

      // 4. Signed link: valid → PDF attachment; tampered → 404; expired → 410.
      const token = signDownloadToken({ productId: productId!, fileId: fileId! })
      const ok = await guest.request.get(`/api/download/${token}`)
      expect(ok.status()).toBe(200)
      expect(ok.headers()['content-type']).toContain('application/pdf')
      expect(ok.headers()['content-disposition']).toContain('attachment')
      expect((await guest.request.get(`/api/download/${token.slice(0, -2)}xx`)).status()).toBe(404)
      const expired = signDownloadToken({
        productId: productId!,
        fileId: fileId!,
        expiresAt: Date.now() - 1000,
      })
      expect((await guest.request.get(`/api/download/${expired}`)).status()).toBe(410)

      // 5. Product no longer free → the old link stops working.
      const paid = await page.request.patch(`/api/products/${productId}`, {
        data: { saleStatus: 'on_sale', price: 99000 },
      })
      expect(paid.ok()).toBe(true)
      expect((await guest.request.get(`/api/download/${token}`)).status()).toBe(410)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await visitor.close()
      if (productId) await page.request.delete(`/api/products/${productId}`)
      if (fileId) await page.request.delete(`/api/privateFiles/${fileId}`)
      if (userId) {
        const deleted = await page.request.delete(`/api/users/${userId}`)
        expect(deleted.ok(), 'Temporary user must be deleted.').toBe(true)
      }
    }
  })
})
