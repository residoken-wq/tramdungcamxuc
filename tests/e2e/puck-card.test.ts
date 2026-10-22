import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-02: Draggable Card child blocks in IconCardGrid
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk02-${randomUUID()}@example.test`
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

test.describe('PK-02: Draggable Card child blocks in IconCardGrid', () => {
  test('trang IconCardGrid v1 vẫn hiện đủ thẻ (migration khi đọc); trong builder chọn thẻ 2 đổi màu + cỡ, nhân bản thẻ 1, xuất bản', async ({
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
    const slug = `e2e-card-${marker}`
    const titles = ['[MẪU] Thẻ Thứ Nhất', '[MẪU] Thẻ Thứ Hai', '[MẪU] Thẻ Thứ Ba']
    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Trang đã xuất bản, lưu IconCardGrid **v1** (mảng items) như dữ liệu trước PK-02
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E Card ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'IconCardGrid',
                props: {
                  id: 'grid-e2e',
                  version: 1,
                  titleLine1: '[MẪU] TIÊU ĐỀ LƯỚI THẺ',
                  marker: 'number',
                  columns: 3,
                  cardStyle: 'white',
                  bgColor: 'warm-ivory',
                  padding: 'md',
                  items: titles.map((title, i) => ({
                    icon: 'star',
                    title,
                    text: `[MẪU] Nội dung thẻ ${i + 1}`,
                  })),
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E Card ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      const createdData = await created.json()
      pageId = createdData.doc?.id || createdData.id
      expect(pageId).toBeDefined()

      // 2. Trang công khai (chưa mở builder) vẫn đủ 3 thẻ: migration chạy khi đọc
      await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      const publicTitles = publicPage.locator('[data-marker="number"] h3')
      await expect(publicTitles).toHaveText(titles)

      // 3. Builder: 3 thẻ là khối con
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const canvas = page.frameLocator('iframe')
      const card2 = canvas.getByRole('heading', { name: titles[1], exact: true })
      await expect(card2).toBeVisible({ timeout: 30000 })

      // 4. Chọn thẻ 2 (thử lại tới khi đã hydrate), đổi cỡ + màu tiêu đề theo nhãn
      const titleSize = page.getByRole('combobox', { name: 'Cỡ chữ tiêu đề', exact: true })
      await expect(async () => {
        await card2.click()
        await expect(titleSize).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await titleSize.selectOption({ label: 'Lớn' })
      await page
        .getByRole('combobox', { name: 'Màu tiêu đề', exact: true })
        .selectOption({ label: 'Hồng sen (Bright Magenta)' })

      // 5. Chọn thẻ 1 và nhân bản
      const card1 = canvas.getByRole('heading', { name: titles[0], exact: true })
      const duplicate = page
        .locator('button[title="Nhân bản"]')
        .or(canvas.locator('button[title="Nhân bản"]'))
        .first()
      await expect(async () => {
        await card1.click()
        await expect(duplicate).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
      await duplicate.click()
      await expect(canvas.getByRole('heading', { name: titles[0], exact: true })).toHaveCount(2)

      // 6. Xuất bản
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      // 7. Trang công khai: 4 thẻ, thẻ 2 mang class màu / cỡ mới
      await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      await expect(publicTitles).toHaveText([titles[0], titles[0], titles[1], titles[2]])
      const publicCard2 = publicTitles.filter({ hasText: titles[1] })
      await expect(publicCard2).toHaveClass(/text-bright-magenta/)
      await expect(publicCard2).toHaveClass(/sm:text-2xl/)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary E2E page must be removed.').toBe(true)
        }
      } finally {
        if (userId) {
          const deleted = await page.request.delete(`/api/users/${userId}`)
          expect(deleted.ok(), 'Temporary E2E user must be removed.').toBe(true)
        }
      }
    }
  })
})
