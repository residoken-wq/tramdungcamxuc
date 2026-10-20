import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-01: Preset định dạng khối con + SectionHeader v2
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk01-${randomUUID()}@example.test`
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

test.describe('PK-01: Puck Format Presets & SectionHeader v2 Customization', () => {
  test('chọn SectionHeader trong builder, đổi cỡ tiêu đề sang Lớn và màu dòng 2 sang deep-navy, xuất bản và kiểm tra class công khai', async ({
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
    const slug = `e2e-format-${marker}`
    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Tự tạo trang qua REST với 1 SectionHeader v2
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: `[MẪU] E2E Format ${marker}`,
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'SectionHeader',
                props: {
                  id: 'section-header-e2e',
                  version: 2,
                  seriesLabel: '[MẪU] Series PK01',
                  titleLine1: '[MẪU] TIÊU ĐỀ DÒNG 1',
                  titleLine2: '[MẪU] TIÊU ĐỀ DÒNG 2',
                  emotionLine: '[MẪU] Dòng cảm xúc nhẹ nhàng',
                  align: 'center',
                  as: 'h2',
                  titleSize: 'md',
                  line1Color: 'deep-navy',
                  line2Color: 'bright-magenta',
                  eyebrowColor: 'bright-magenta',
                  emotionColor: 'deep-navy',
                  emotionSize: 'md',
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E Format ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      const createdData = await created.json()
      pageId = createdData.doc?.id || createdData.id
      expect(pageId).toBeDefined()

      // 2. Mở builder
      await page.goto(`/builder/${pageId}`, { waitUntil: 'networkidle' })
      const canvas = page.frameLocator('iframe')
      const block = canvas.locator('[data-puck-component]').first()
      await expect(block).toBeVisible()

      // 3. Chọn khối SectionHeader trên canvas
      await block.click()

      // 4. Đổi cỡ tiêu đề sang "Lớn" (lg)
      const titleSizeSelect = page.locator('select').filter({ hasText: /Lớn/ }).first()
      if (await titleSizeSelect.isVisible()) {
        await titleSizeSelect.selectOption('lg')
      } else {
        const labeledSelect = page.getByRole('combobox', { name: /Cỡ chữ tiêu đề/i })
        await labeledSelect.selectOption('lg')
      }

      // 5. Đổi màu dòng 2 sang "deep-navy" (Xanh thẫm)
      const line2ColorSelect = page
        .locator('select')
        .filter({ hasText: /Xanh thẫm/ })
        .nth(1) // line2Color là select màu thứ 2 (sau line1Color)
      if (await line2ColorSelect.isVisible()) {
        await line2ColorSelect.selectOption('deep-navy')
      } else {
        const labeledSelect = page.getByRole('combobox', { name: /Màu tiêu đề dòng 2/i })
        await labeledSelect.selectOption('deep-navy')
      }

      // 6. Xuất bản trang
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByText(/Đã xuất bản thành công/)).toBeVisible()

      // 7. Trang công khai có class màu / cỡ mới
      await publicPage.goto(`/${slug}`)
      const heading = publicPage.getByRole('heading', { level: 2 })
      await expect(heading).toBeVisible()

      // H2 + titleSize "lg" tịnh tiến lên thang: text-4xl sm:text-5xl lg:text-6xl
      await expect(heading).toHaveClass(/text-4xl/)
      await expect(heading).toHaveClass(/sm:text-5xl/)
      await expect(heading).toHaveClass(/lg:text-6xl/)

      // Dòng 2 có class text-deep-navy
      const line2Span = heading.locator('span').filter({ hasText: '[MẪU] TIÊU ĐỀ DÒNG 2' })
      await expect(line2Span).toBeVisible()
      await expect(line2Span).toHaveClass(/text-deep-navy/)
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
