import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-05: Real canvas drag-and-drop in Puck Editor
// Kiểm tra thao tác kéo thả thực tế bằng Playwright page.mouse thay vì click nút reorder.
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.

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

type CardSpec = { id: string; title: string }

function iconGrid(id: string, cards: CardSpec[]) {
  return {
    type: 'IconCardGrid',
    props: {
      id,
      version: 2,
      titleLine1: '[MẪU] LƯỚI THẺ',
      marker: 'number',
      columns: 3,
      cardStyle: 'white',
      bgColor: 'warm-ivory',
      padding: 'md',
      cards: cards.map((c) => ({
        type: 'Card',
        props: { id: c.id, icon: 'star', title: c.title, text: '[MẪU] Nội dung' },
      })),
    },
  }
}

/**
 * Real pointer drag inside the Puck canvas iframe. Bounding boxes of frame elements are in page
 * coordinates, so page.mouse can drive dnd-kit directly.
 */
async function dragOnCanvas(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  // Puck's pointer sensor (non-handle): hold >= 200 ms within 10 px, then move >= 5 px
  await page.waitForTimeout(350)
  await page.mouse.move(from.x + 8, from.y + 8, { steps: 4 })
  await page.mouse.move(to.x, to.y, { steps: 25 })
  await page.waitForTimeout(300)
  await page.mouse.up()
}

async function publish(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
  await expect(
    page
      .getByText(/Đã xuất bản/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible({ timeout: 15000 })
}

// PK-05c (Planning, 23/10): kéo thả thật trên canvas chưa ổn định dưới Playwright headless.
// Đã thử (server production, 1 worker): giữ chuột >= 200 ms rồi kéo theo ngưỡng PointerSensor của Puck
// (Delay 200 ms / tolerance 10 px + Distance 5 px), kéo 25 bước trong iframe canvas, thử lại 3 lần mỗi
// lần chạy. Kết quả: phần lớn lần thứ tự trên canvas không đổi; có lần canvas hiện 3-1-2 nhưng dữ liệu
// xuất bản vẫn 1-2-3 (thả chưa được ghi nhận). Cần người kiểm tay trong builder trước khi bật lại.
test.describe.fixme('PK-05: Real canvas drag-and-drop in Puck Editor', () => {
  test('kéo thả bằng chuột đổi thứ tự thẻ trong IconCardGrid: 3, 1, 2', async ({
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
    const slug = `e2e-drag-reorder-${marker}`
    const titles = [1, 2, 3].map((n) => `[MẪU] Thẻ ${n} ${marker}`)
    let userId: number | undefined
    let pageId: number | undefined
    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      userId = (await bootstrapAdmin(page)).userId

      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E Drag ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              iconGrid(
                'grid-drag',
                titles.map((title, i) => ({ id: `grid-drag-card-${i}`, title })),
              ),
            ],
            root: { props: { title: `[MẪU] E2E Drag ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc?.id

      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const canvas = page.frameLocator('iframe')
      const heading = (t: string) => canvas.getByRole('heading', { name: t, exact: true })
      await expect(heading(titles[2])).toBeVisible({ timeout: 30000 })

      // Kéo thẻ 3 thả vào nửa trái thẻ 1 (lưới 3 cột: thả trước thẻ 1). Thử lại tối đa 3 lần.
      let attempt = 0
      await expect(async () => {
        attempt++
        const from = await heading(titles[2]).boundingBox()
        const target = await heading(titles[0]).boundingBox()
        if (!from || !target) throw new Error('Không thấy thẻ trên canvas')
        await dragOnCanvas(
          page,
          { x: from.x + from.width / 2, y: from.y + from.height / 2 },
          { x: target.x + 4, y: target.y + target.height / 2 },
        )
        const order = await canvas.getByRole('heading', { level: 3 }).allTextContents()
        expect(order.filter((t) => t.includes(marker))).toEqual([titles[2], titles[0], titles[1]])
      }).toPass({ timeout: 90000, intervals: [1000, 2000, 3000] })
      testInfo.annotations.push({ type: 'drag-attempts', description: String(attempt) })

      await publish(page)

      const publicTitles = publicPage.locator('[data-marker="number"] h3')
      await expect(async () => {
        await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
        await expect(publicTitles).toHaveText([titles[2], titles[0], titles[1]], { timeout: 2000 })
      }).toPass({ timeout: 30000 })
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()
      if (pageId) {
        const deleted = await page.request.delete(`/api/pages/${pageId}`)
        expect(deleted.ok(), 'Temporary E2E page must be removed.').toBe(true)
      }
      if (userId) {
        const deleted = await page.request.delete(`/api/users/${userId}`)
        expect(deleted.ok(), 'Temporary E2E user must be removed.').toBe(true)
      }
    }
  })

  test('kéo một thẻ từ lưới thả vào cột 1 của Columns, trang công khai hiện thẻ trong cột', async ({
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
    const slug = `e2e-drag-columns-${marker}`
    const titles = [1, 2].map((n) => `[MẪU] Thẻ cột ${n} ${marker}`)
    let userId: number | undefined
    let pageId: number | undefined
    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      userId = (await bootstrapAdmin(page)).userId

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
                  version: 1,
                  numColumns: '2',
                  gap: 'md',
                  bgColor: 'warm-ivory',
                  padding: 'md',
                  col1: [],
                  col2: [],
                },
              },
              iconGrid(
                'grid-src',
                titles.map((title, i) => ({ id: `grid-src-card-${i}`, title })),
              ),
            ],
            root: { props: { title: `[MẪU] E2E Drag Columns ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc?.id

      await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const canvas = page.frameLocator('iframe')
      const card2 = canvas.getByRole('heading', { name: titles[1], exact: true })
      await expect(card2).toBeVisible({ timeout: 30000 })
      const columnsSection = canvas.locator('section[data-block="columns"]')
      await expect(columnsSection).toBeVisible()

      let attempt = 0
      await expect(async () => {
        attempt++
        const from = await card2.boundingBox()
        const cols = await columnsSection.boundingBox()
        if (!from || !cols) throw new Error('Không thấy thẻ / khối cột trên canvas')
        await dragOnCanvas(
          page,
          { x: from.x + from.width / 2, y: from.y + from.height / 2 },
          // Giữa cột 1 (nửa trái của khối cột)
          { x: cols.x + cols.width * 0.3, y: cols.y + cols.height / 2 },
        )
        await expect(columnsSection.getByRole('heading', { name: titles[1] })).toBeVisible({
          timeout: 2000,
        })
      }).toPass({ timeout: 90000, intervals: [1000, 2000, 3000] })
      testInfo.annotations.push({ type: 'drag-attempts', description: String(attempt) })

      await publish(page)

      await expect(async () => {
        await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
        await expect(
          publicPage
            .locator('section[data-block="columns"]')
            .getByRole('heading', { name: titles[1] }),
        ).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()
      if (pageId) {
        const deleted = await page.request.delete(`/api/pages/${pageId}`)
        expect(deleted.ok(), 'Temporary E2E page must be removed.').toBe(true)
      }
      if (userId) {
        const deleted = await page.request.delete(`/api/users/${userId}`)
        expect(deleted.ok(), 'Temporary E2E user must be removed.').toBe(true)
      }
    }
  })
})
