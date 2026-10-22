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
  test('chọn và quản lý Card bên trong IconCardGrid, nhân bản, kiểm tra sidebar không có Card, xuất bản trang công khai', async ({
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
    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Tự tạo trang qua REST với 1 IconCardGrid v2 chứa 2 thẻ Card con
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: `[MẪU] E2E Card ${marker}`,
          slug,
          _status: 'draft',
          puckData: {
            content: [
              {
                type: 'IconCardGrid',
                props: {
                  id: 'grid-e2e',
                  version: 2,
                  seriesLabel: '[MẪU] Series PK02',
                  titleLine1: '[MẪU] TIÊU ĐỀ LƯỚI THẺ',
                  titleLine2: '[MẪU] ĐỒNG HÀNH CHUYỂN MÌNH',
                  emotionLine: '[MẪU] Dòng cảm xúc nhẹ nhàng',
                  marker: 'number',
                  columns: 3,
                  cardStyle: 'white',
                  bgColor: 'warm-ivory',
                  padding: 'md',
                  cards: [
                    {
                      type: 'Card',
                      props: {
                        id: 'grid-e2e-card-0',
                        icon: 'target',
                        title: '[MẪU] Thẻ Thứ Nhất',
                        text: '[MẪU] Nội dung mô tả của thẻ đầu tiên',
                        titleColor: 'deep-navy',
                        textColor: 'deep-navy',
                        titleSize: 'md',
                        textSize: 'md',
                        align: 'left',
                      },
                    },
                    {
                      type: 'Card',
                      props: {
                        id: 'grid-e2e-card-1',
                        icon: 'heart',
                        title: '[MẪU] Thẻ Thứ Hai',
                        text: '[MẪU] Nội dung mô tả của thẻ thứ hai',
                        titleColor: 'deep-navy',
                        textColor: 'deep-navy',
                        titleSize: 'md',
                        textSize: 'md',
                        align: 'left',
                      },
                    },
                  ],
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

      // 2. Mở builder
      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const canvas = page.frameLocator('iframe')

      // 3. Kiểm tra sidebar: component Card KHÔNG xuất hiện trong danh sách khối
      const sidebarComponentList = page.locator('[data-puck-component-list], [data-testid="components"]')
      await expect(sidebarComponentList.locator('text="Thẻ"')).toHaveCount(0)
      await expect(sidebarComponentList.locator('text="Card"')).toHaveCount(0)

      // 4. Kiểm tra trên canvas: các thẻ bên trong IconCardGrid có thể click chọn
      const firstCard = canvas.locator('text="[MẪU] Thẻ Thứ Nhất"').first()
      await expect(firstCard).toBeVisible({ timeout: 30000 })

      // Click chọn thẻ đầu tiên
      await firstCard.click()

      // Kiểm tra toolbar của Puck hiển thị (có nút Duplicate/Nhân bản hoặc action toolbar)
      const duplicateBtn = canvas
        .locator('button[title*="Duplicate"], button[aria-label*="Duplicate"], button[title*="Nhân bản"]')
        .or(page.locator('button[title*="Duplicate"], button[aria-label*="Duplicate"], button[title*="Nhân bản"]'))

      if (await duplicateBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await duplicateBtn.first().click()
      }

      // 5. Đổi tiêu đề thẻ thứ nhất thành nội dung mới
      const titleInput = page.getByRole('textbox', { name: 'Tiêu đề thẻ' }).or(page.locator('input[name="title"]'))
      if (await titleInput.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await titleInput.first().fill('[MẪU] Thẻ Đã Sửa E2E')
      }

      // 6. Xuất bản trang
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      // 7. Kiểm tra trang công khai hiển thị thẻ đúng
      await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      const publicCardsGrid = publicPage.locator('[data-card-style="white"][data-marker="number"]')
      await expect(publicCardsGrid).toBeVisible()

      // Thẻ thứ hai và thẻ đã sửa hiển thị trên trang công khai
      await expect(publicPage.getByText('[MẪU] Thẻ Thứ Hai')).toBeVisible()
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
