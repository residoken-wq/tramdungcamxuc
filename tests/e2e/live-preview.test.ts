import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'

test('admin sees unsaved live edits; guests never see drafts', async ({
  page,
  browser,
}, testInfo) => {
  test.setTimeout(180000)
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const init = await (await page.request.get('/api/users/init')).json()
  expect(init, 'Use a migrated test database without admin users.').toMatchObject({
    initialized: false,
  })
  const email = `preview-${randomUUID()}@example.test`
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

    for (const [collection, route, field, label] of [
      ['services', 'coaching', 'name', 'Tên dịch vụ'],
      ['programs', 'doanh-nghiep', 'name', 'Tên chương trình'],
      ['posts', 'blog', 'title', 'Tiêu đề'],
    ]) {
      const slug = `live-preview-${randomUUID()}`
      const published = `[MẪU] Published ${slug}`
      const unsaved = `[MẪU] Unsaved ${slug}`
      const savedDraft = `[MẪU] Draft ${slug}`
      const res = await page.request.post(`/api/${collection}`, {
        data: {
          slug,
          [field]: published,
          _status: 'published',
          ...(collection === 'posts' ? { format: 'article' } : { saleStatus: 'consult' }),
        },
      })
      expect(res.ok()).toBe(true)
      const id = (await res.json()).doc.id
      created.push({ collection, id })
      await page.goto(`/admin/collections/${collection}/${id}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('textbox', { name: label, exact: false })).toBeVisible()
      const toggle = page.getByRole('button', { name: /^Xem trước$|live preview/i })
      const iframe = page.locator('iframe').filter({ visible: true })
      if (!(await iframe.count())) await toggle.click()
      const preview = page.frameLocator('iframe').first()
      await expect(preview.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await page.getByRole('textbox', { name: label, exact: false }).fill(unsaved)
      await expect(preview.getByRole('heading', { name: unsaved, exact: true })).toBeVisible()

      const publicPage = await guest.newPage()
      await publicPage.goto(`/${route}/${slug}`)
      await expect(publicPage.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await expect(publicPage.getByText(unsaved, { exact: true })).toHaveCount(0)

      const draft = await page.request.patch(`/api/${collection}/${id}?draft=true`, {
        data: { [field]: savedDraft, _status: 'draft' },
      })
      expect(draft.ok()).toBe(true)
      const previewUrl = `/${route}/${slug}?preview=1&previewId=${id}`
      const adminResponse = await page.request.get(previewUrl)
      expect(await adminResponse.text()).toContain(savedDraft)
      expect(adminResponse.headers()['cache-control']).toMatch(/private|no-store/)
      await publicPage.goto(previewUrl)
      await expect(publicPage.getByRole('heading', { name: published, exact: true })).toBeVisible()
      await expect(publicPage.getByText(savedDraft, { exact: true })).toHaveCount(0)
      await publicPage.close()
      page.once('dialog', (dialog) => dialog.accept())
    }
    expect(pageErrors).toEqual([])
  } finally {
    await guest.close()
    for (const { collection, id } of created.reverse()) {
      expect((await page.request.delete(`/api/${collection}/${id}`)).ok()).toBe(true)
    }
    if (userId) expect((await page.request.delete(`/api/users/${userId}`)).ok()).toBe(true)
  }
})
