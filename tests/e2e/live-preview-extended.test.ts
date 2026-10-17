import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('admin sees unsaved live edits for products and eq cards; guests never see drafts', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(180000)
  // Admin live preview is a side-by-side desktop tool: at 375px Payload shows either the form
  // or the preview, never both, so the admin page always runs at desktop width. The guest
  // context keeps the project viewport (375px is still checked for guests).
  await page.setViewportSize({ width: 1440, height: 900 })
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('dialog', (dialog) => dialog.accept())
  const init = await (await page.request.get('/api/users/init')).json()
  expect(init, 'Use a migrated test database without admin users.').toMatchObject({
    initialized: false,
  })
  const email = `preview-ext-${randomUUID()}@example.test`
  const password = randomUUID()
  let userId: number | undefined
  const created: { collection: string; id: number }[] = []
  const guest = await browser.newContext({ baseURL: testInfo.project.use.baseURL })

  try {
    const registration = await page.request.post('/api/users/first-register', {
      data: { email, password, confirmPassword: password },
    })
    expect(registration.ok()).toBe(true)
    userId = (await registration.json()).user.id
    const login = await page.request.post('/api/users/login', { data: { email, password } })
    expect(login.ok()).toBe(true)

    // 1. Test Products (tuyến xem trước riêng /xem-truoc/san-pham/[id])
    {
      const slug = `product-preview-${randomUUID()}`
      const published = `[MẪU] SP Published ${slug}`
      const unsaved = `[MẪU] SP Unsaved ${slug}`
      const savedDraft = `[MẪU] SP Draft ${slug}`

      const res = await page.request.post('/api/products', {
        data: {
          name: published,
          slug,
          type: 'physical_external',
          web: 'site',
          _status: 'published',
        },
      })
      expect(res.ok()).toBe(true)
      const id = (await res.json()).doc.id
      created.push({ collection: 'products', id })

      await page.goto(`/admin/collections/products/${id}`, { waitUntil: 'domcontentloaded' })
      const textbox = page.getByRole('textbox', { name: 'Tên sản phẩm', exact: false })
      await expect(textbox).toBeVisible()
      const toggle = page.getByRole('button', { name: /^Xem trước$|live preview/i })
      const iframe = page.locator('iframe').filter({ visible: true })

      await expect(toggle).toBeVisible()
      await expect(async () => {
        if (!(await iframe.count())) {
          await toggle.click()
        }
        await expect(iframe.first()).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 20000 })

      const preview = page.frameLocator('iframe').first()
      await expect(preview.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await textbox.fill(unsaved)
      await expect(preview.getByRole('heading', { name: unsaved, exact: true })).toBeVisible()

      // Khách mở cùng URL xem trước -> 404, không bao giờ thấy nội dung chưa lưu
      const previewUrl = `/xem-truoc/san-pham/${id}?preview=1`
      const publicPage = await guest.newPage()
      const guestResponse = await publicPage.goto(previewUrl)
      expect(guestResponse?.status()).toBe(404)
      await expect(publicPage.getByText(unsaved, { exact: true })).toHaveCount(0)

      const draft = await page.request.patch(`/api/products/${id}?draft=true`, {
        data: { name: savedDraft, _status: 'draft' },
      })
      expect(draft.ok()).toBe(true)

      const adminResponse = await page.request.get(previewUrl)
      expect(adminResponse.ok()).toBe(true)
      expect(await adminResponse.text()).toContain(savedDraft)
      expect(adminResponse.headers()['cache-control']).toMatch(/private|no-store/)

      const guestDraftResponse = await publicPage.goto(previewUrl)
      expect(guestDraftResponse?.status()).toBe(404)
      await expect(publicPage.getByText(savedDraft, { exact: true })).toHaveCount(0)
      await publicPage.close()
    }

    // 2. Test EQ Card (tuyến ánh xạ công khai /eq-buddy/the/[qrSlug])
    {
      const eqCode = `EQ-${randomUUID().slice(0, 6)}`
      const eqSlug = `card-preview-${randomUUID().slice(0, 8)}`
      const published = `[MẪU] EQ Published ${eqCode}`
      const unsaved = `[MẪU] EQ Unsaved ${eqCode}`
      const savedDraft = `[MẪU] EQ Draft ${eqCode}`

      const res = await page.request.post('/api/eqCards', {
        data: {
          code: eqCode,
          keywordEn: published,
          message: `Thông điệp ${eqCode}`,
          promptRecall: 'Gợi nhớ',
          promptPack: 'Gói ghém',
          promptAcknowledge: 'Ghi nhận',
          qrSlug: eqSlug,
          _status: 'published',
        },
      })
      expect(res.ok()).toBe(true)
      const id = (await res.json()).doc.id
      created.push({ collection: 'eqCards', id })

      await page.goto(`/admin/collections/eqCards/${id}`, { waitUntil: 'domcontentloaded' })
      const textbox = page.getByRole('textbox', { name: 'Từ khóa (mặt trước)', exact: false })
      await expect(textbox).toBeVisible()
      const toggle = page.getByRole('button', { name: /^Xem trước$|live preview/i })
      const iframe = page.locator('iframe').filter({ visible: true })

      await expect(toggle).toBeVisible()
      await expect(async () => {
        if (!(await iframe.count())) {
          await toggle.click()
        }
        await expect(iframe.first()).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 20000 })

      const preview = page.frameLocator('iframe').first()
      await expect(preview.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await textbox.fill(unsaved)
      await expect(preview.getByRole('heading', { name: unsaved, exact: true })).toBeVisible()

      // Khách mở cùng URL xem trước -> chỉ thấy published, không thấy unsaved
      const previewUrl = `/eq-buddy/the/${eqSlug}?preview=1&previewId=${id}`
      const publicPage = await guest.newPage()
      await publicPage.goto(previewUrl)
      await expect(publicPage.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await expect(publicPage.getByText(unsaved, { exact: true })).toHaveCount(0)

      const draft = await page.request.patch(`/api/eqCards/${id}?draft=true`, {
        data: { keywordEn: savedDraft, _status: 'draft' },
      })
      expect(draft.ok()).toBe(true)

      const adminResponse = await page.request.get(previewUrl)
      expect(await adminResponse.text()).toContain(savedDraft)
      expect(adminResponse.headers()['cache-control']).toMatch(/private|no-store/)

      await publicPage.goto(previewUrl)
      await expect(publicPage.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await expect(publicPage.getByText(savedDraft, { exact: true })).toHaveCount(0)
      await publicPage.close()
    }

    // 3. Trang render phía server (tài nguyên ebook): bấm "Lưu bản nháp" -> iframe tự tải lại bản nháp.
    {
      const slug = `ebook-preview-${randomUUID()}`
      const published = `[MẪU] Ebook Published ${slug}`
      const savedDraft = `[MẪU] Ebook Draft ${slug}`
      const res = await page.request.post('/api/products', {
        data: {
          name: published,
          slug,
          type: 'ebook',
          web: 'site',
          saleStatus: 'free',
          _status: 'published',
        },
      })
      expect(res.ok()).toBe(true)
      const id = (await res.json()).doc.id
      created.push({ collection: 'products', id })

      await page.goto(`/admin/collections/products/${id}`, { waitUntil: 'domcontentloaded' })
      const textbox = page.getByRole('textbox', { name: 'Tên sản phẩm', exact: false })
      await expect(textbox).toBeVisible()
      const toggle = page.getByRole('button', { name: /^Xem trước$|live preview/i })
      // Payload nhớ trạng thái "Xem trước" đang mở từ khối 1 và tự mở lại khung sau khi tải trang;
      // bấm nút lúc đó sẽ đóng khung. Chờ khung tự mở trước, chỉ bấm khi không thấy.
      const frameEl = page.locator(`iframe[src*="/tai-nguyen/${slug}"]`).first()
      const autoOpened = await frameEl
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false)
      if (!autoOpened) {
        await toggle.click()
      }
      const preview = frameEl.contentFrame()
      await expect(preview.getByRole('heading', { name: published, exact: true })).toBeVisible({
        timeout: 20000,
      })
      await textbox.fill(savedDraft)
      await page.getByRole('button', { name: 'Lưu bản nháp' }).click()
      await expect(preview.getByRole('heading', { name: savedDraft, exact: true })).toBeVisible({
        timeout: 15000,
      })

      const publicPage = await guest.newPage()
      await publicPage.goto(`/tai-nguyen/${slug}?preview=1`)
      await expect(publicPage.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await expect(publicPage.getByText(savedDraft, { exact: true })).toHaveCount(0)
      await publicPage.close()
    }

    expect(pageErrors).toEqual([])
  } finally {
    await guest.close().catch(() => {})
    for (const { collection, id } of created.reverse()) {
      await page.request.delete(`/api/${collection}/${id}`).catch(() => {})
    }
    if (userId) {
      await page.request.delete(`/api/users/${userId}`).catch(() => {})
    }
  }
})
