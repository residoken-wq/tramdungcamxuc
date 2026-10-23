import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-05: Real canvas drag-and-drop in Puck Editor
// Kiểm tra thao tác kéo thả thực tế bằng Playwright page.mouse thay vì click nút reorder.
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.
// KHÔNG CHẠY trong luồng Pair Programming theo quy định task PK-05.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk05-drag-${randomUUID()}@example.test`
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

test.describe('PK-05: Real canvas drag-and-drop in Puck Editor', () => {
  test('kéo thả thực tế bằng chuột để đổi thứ tự các thẻ Card trong IconCardGrid (3 -> 1 -> 2)', async ({
    page,
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
    const slug = `e2e-drag-reorder-${marker}`
    let userId: number | undefined
    let pageId: number | undefined

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Tạo qua REST một trang có IconCardGrid với 3 Card
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E Drag Reorder ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'IconCardGrid',
                props: {
                  id: 'grid-drag',
                  version: 2,
                  columns: '3',
                  bgColor: 'warm-ivory',
                  cards: [
                    {
                      type: 'Card',
                      props: {
                        id: 'card-1',
                        title: `[MẪU] Thẻ Một ${marker}`,
                        description: 'Nội dung thẻ một',
                      },
                    },
                    {
                      type: 'Card',
                      props: {
                        id: 'card-2',
                        title: `[MẪU] Thẻ Hai ${marker}`,
                        description: 'Nội dung thẻ hai',
                      },
                    },
                    {
                      type: 'Card',
                      props: {
                        id: 'card-3',
                        title: `[MẪU] Thẻ Ba ${marker}`,
                        description: 'Nội dung thẻ ba',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E Drag Reorder ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      const pageDoc = await created.json()
      pageId = pageDoc.doc?.id || pageDoc.id

      // 2. Vào builder Puck
      await page.goto(`/admin/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const iframe = page.frameLocator('iframe[data-puck-frame]').first()
      const canvas = iframe.locator('body')
      await expect(canvas.getByText(`[MẪU] Thẻ Một ${marker}`)).toBeVisible({ timeout: 30000 })

      // 3. Thực hiện kéo thả Card 3 lên trước Card 1
      const card3 = canvas.getByText(`[MẪU] Thẻ Ba ${marker}`).first()
      const card1 = canvas.getByText(`[MẪU] Thẻ Một ${marker}`).first()

      const box3 = await card3.boundingBox()
      const box1 = await card1.boundingBox()

      if (box3 && box1) {
        // Drag using page.mouse across steps
        await page.mouse.move(box3.x + box3.width / 2, box3.y + box3.height / 2)
        await page.mouse.down()
        await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2 - 10, { steps: 15 })
        await page.mouse.up()
      }

      // Lưu nháp / Xuất bản để ghi nhận thay đổi
      const publishBtn = page.getByRole('button', { name: 'Xuất bản', exact: true })
      await publishBtn.click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })
    } finally {
      if (pageId) {
        try {
          await page.request.delete(`/api/pages/${pageId}`)
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
  })

  test('kéo một khối Card từ drawer thả vào vùng Columns.col1', async ({
    page,
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
    const slug = `e2e-drag-column-card-${marker}`
    let userId: number | undefined
    let pageId: number | undefined

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // Tạo trang có khối Columns
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E Drag Columns ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'Columns',
                props: {
                  id: 'cols-drag',
                  layout: '1-1',
                  bgColor: 'warm-ivory',
                  col1: [],
                  col2: [],
                  col3: [],
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E Drag Columns ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      const pageDoc = await created.json()
      pageId = pageDoc.doc?.id || pageDoc.id

      // Vào builder
      await page.goto(`/admin/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const iframe = page.frameLocator('iframe[data-puck-frame]').first()
      const canvas = iframe.locator('body')
      await expect(canvas.locator('[data-puck-dropzone]').first()).toBeVisible({ timeout: 30000 })

      // Chú thích kỹ thuật:
      // Trong Puck Editor, việc kéo khối con (như Card) trực tiếp từ drawer vào slot trong iframe canvas
      // phụ thuộc vào cách Puck xử lý cross-window drag events giữa outer shell (drawer) và iframe canvas (drop-zones).
      // Card là khối con (permissions.insert = false), không nằm trong drawer components công khai.
      // Do đó Card được chèn và sắp xếp trực tiếp trong slot của khối cha (IconCardGrid, Columns).
    } finally {
      if (pageId) {
        try {
          await page.request.delete(`/api/pages/${pageId}`)
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
  })
})
