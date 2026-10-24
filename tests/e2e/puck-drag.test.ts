import { randomUUID } from 'node:crypto'
import {
  test,
  expect,
  type Browser,
  type Locator,
  type Page,
  type Response,
  type TestInfo,
} from './fixtures'

// PK-06: kéo thả thật trong builder, kiểm dữ liệu đã lưu (GET /api/pages/<id>) và trang công khai.
// - Tab "Cấu trúc" (Outline) nằm ở trang chính, không qua iframe và không bị thu nhỏ → ổn định.
// - Canvas: bố cục mặc định (khổ 1440px, 2 thanh bên, zoom ≈ 52%). Chuột di từng bước ~3 px như chuột
//   thật – bước lớn (15 px) làm Puck giữ hướng cũ và không đổi chỗ (PK-07). Giữ chuột ở vùng trống của
//   thẻ – giữ trên chữ sửa trực tiếp sẽ bôi đen chữ thay vì kéo. Chi tiết: docs/decisions/PK-06.md, PK-07.md.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk06-drag-${randomUUID()}@example.test`
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
  return { userId: registered.user?.id || registered.doc?.id }
}

type Block = { type: string; props: Record<string, unknown> & { id: string } }

function iconGrid(id: string, titles: string[]): Block {
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
      cards: titles.map((title, i) => ({
        type: 'Card',
        props: { id: `${id}-card-${i}`, icon: 'star', title, text: '[MẪU] Nội dung' },
      })),
    },
  }
}

function columns(id: string): Block {
  return {
    type: 'Columns',
    props: {
      id,
      version: 1,
      numColumns: '2',
      gap: 'md',
      bgColor: 'warm-ivory',
      padding: 'md',
      col1: [],
      col2: [],
    },
  }
}

type Point = { x: number; y: number }

/**
 * Real pointer drag. Puck's PointerSensor (no handle) activates after a 200 ms hold within 10 px,
 * then 5 px of movement. The move goes in ~3 px steps like a real mouse: Puck refreshes its drag
 * direction only after 10 px of travel, and 15 px jumps on a zoomed-out canvas left it stuck on the
 * source slot.
 */
async function drag(page: Page, from: Point, to: Point): Promise<void> {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.waitForTimeout(300)
  await page.mouse.move(from.x, from.y - 6, { steps: 3 })
  const steps = Math.max(10, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 3))
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y - 6 + ((to.y - from.y + 6) * i) / steps,
    )
    await page.waitForTimeout(8)
  }
  await page.waitForTimeout(300)
  await page.mouse.up()
}

async function center(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox()
  if (!box) throw new Error('Element has no bounding box')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

async function openOutline(page: Page, expandIds: string[]): Promise<void> {
  await page.getByText('Cấu trúc', { exact: true }).click()
  for (const id of expandIds) {
    // The caret toggles between "Mở rộng" / "Thu gọn"; a layer holding the selected block is
    // already expanded by Puck.
    const caret = page.locator(`[data-puck-layer-tree-id="${id}"] > div button`).first()
    await expect(caret).toHaveAttribute('title', /Mở rộng|Thu gọn/)
    if ((await caret.getAttribute('title')) === 'Mở rộng') await caret.click()
    await expect(caret).toHaveAttribute('title', 'Thu gọn')
  }
}

const layer = (page: Page, id: string) =>
  page.locator(`[data-puck-layer-tree-id="${id}"] > [aria-roledescription="draggable"]`)

async function publish(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
  // The header badge already reads "Đã xuất bản" for a published page; wait for the action's toast.
  await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản thành công' })).toBeVisible({
    timeout: 15000,
  })
}

async function savedContent(page: Page, pageId: number): Promise<Block[]> {
  const res = await page.request.get(`/api/pages/${pageId}?depth=0`)
  expect(res.ok()).toBe(true)
  return (await res.json()).puckData.content
}

const childIds = (block: Block | undefined, slot: string): string[] =>
  ((block?.props[slot] as Block[] | undefined) || []).map((child) => child.props.id)

/** Bootstraps an admin, creates a published page, opens it in the builder and cleans up after. */
async function withBuilderPage(
  { page, browser }: { page: Page; browser: Browser },
  testInfo: TestInfo,
  content: (marker: string) => Block[],
  run: (ctx: { pageId: number; slug: string; marker: string; publicPage: Page }) => Promise<void>,
): Promise<void> {
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
  const slug = `e2e-drag-${marker}`
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
        puckData: { content: content(marker), root: { props: { title: `[MẪU] ${marker}` } } },
      },
    })
    expect(created.ok()).toBe(true)
    pageId = (await created.json()).doc?.id as number
    await page.goto(`/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
    await run({ pageId, slug, marker, publicPage })
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
}

const cardTitles = (marker: string) => [1, 2, 3].map((n) => `[MẪU] Thẻ ${n} ${marker}`)

test.describe('PK-06: kéo thả trong builder lưu đúng', () => {
  test('tab Cấu trúc: kéo thẻ 3 lên đầu → dữ liệu và trang công khai 3, 1, 2', async ({
    page,
    browser,
  }, testInfo) => {
    await withBuilderPage(
      { page, browser },
      testInfo,
      (marker) => [iconGrid('grid-drag', cardTitles(marker))],
      async ({ pageId, slug, marker, publicPage }) => {
        const titles = cardTitles(marker)
        await expect(
          page.frameLocator('iframe').getByRole('heading', { name: titles[2], exact: true }),
        ).toBeVisible({ timeout: 30000 })
        await openOutline(page, ['grid-drag'])

        const first = await layer(page, 'grid-drag-card-0').boundingBox()
        if (!first) throw new Error('Không thấy lớp thẻ 1 trong tab Cấu trúc')
        await drag(page, await center(layer(page, 'grid-drag-card-2')), {
          x: first.x + first.width / 2,
          y: first.y + 2,
        })
        await expect(
          page.locator('[data-puck-layer-tree-id^="grid-drag-card-"]').first(),
        ).toHaveAttribute('data-puck-layer-tree-id', 'grid-drag-card-2', { timeout: 5000 })

        await publish(page)
        expect(childIds((await savedContent(page, pageId))[0], 'cards')).toEqual([
          'grid-drag-card-2',
          'grid-drag-card-0',
          'grid-drag-card-1',
        ])
        await expect(async () => {
          await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
          await expect(publicPage.locator('[data-marker="number"] h3')).toHaveText(
            [titles[2], titles[0], titles[1]],
            { timeout: 2000 },
          )
        }).toPass({ timeout: 30000 })
      },
    )
  })

  test('tab Cấu trúc: kéo thẻ từ lưới vào Cột 1 → trang công khai hiện thẻ trong cột', async ({
    page,
    browser,
  }, testInfo) => {
    await withBuilderPage(
      { page, browser },
      testInfo,
      (marker) => [columns('cols-drag'), iconGrid('grid-src', cardTitles(marker).slice(0, 2))],
      async ({ pageId, slug, marker, publicPage }) => {
        const titles = cardTitles(marker)
        await expect(
          page.frameLocator('iframe').getByRole('heading', { name: titles[1], exact: true }),
        ).toBeVisible({ timeout: 30000 })
        await openOutline(page, ['cols-drag', 'grid-src'])

        // Puck lists slot zones in reverse order (Cột 3, Cột 2, Cột 1); target Cột 1 by its title.
        const col1 = page
          .locator('[data-puck-layer-tree-id="cols-drag"] [class*="Layer-zones"]')
          .filter({ hasText: 'Nội dung Cột 1' })
          .locator('li')
          .first()
        await drag(page, await center(layer(page, 'grid-src-card-1')), await center(col1))
        await expect(
          page
            .locator('[data-puck-layer-tree-id="cols-drag"]')
            .locator('[data-puck-layer-tree-id="grid-src-card-1"]'),
        ).toBeVisible({ timeout: 5000 })

        await publish(page)
        const [cols, grid] = await savedContent(page, pageId)
        expect(childIds(cols, 'col1')).toEqual(['grid-src-card-1'])
        expect(childIds(grid, 'cards')).toEqual(['grid-src-card-0'])
        await expect(async () => {
          await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
          await expect(
            publicPage
              .locator('section[data-block="columns"]')
              .getByRole('heading', { name: titles[1] }),
          ).toBeVisible({ timeout: 2000 })
        }).toPass({ timeout: 30000 })
      },
    )
  })

  test('canvas (bố cục mặc định, zoom ≈ 52%): giữ vùng trống của thẻ 3, kéo sang trước thẻ 1 → 3, 1, 2', async ({
    page,
    browser,
  }, testInfo) => {
    await withBuilderPage(
      { page, browser },
      testInfo,
      (marker) => [iconGrid('grid-canvas', cardTitles(marker))],
      async ({ pageId, marker }) => {
        const titles = cardTitles(marker)
        const canvas = page.frameLocator('iframe')
        await expect(canvas.getByRole('heading', { name: titles[2], exact: true })).toBeVisible({
          timeout: 30000,
        })
        await expect
          .poll(async () => Number(await page.locator('select').first().inputValue()))
          .toBeLessThan(0.6)

        const card = (i: number) => canvas.locator(`[data-puck-component="grid-canvas-card-${i}"]`)
        await expect(async () => {
          const source = await card(2).boundingBox()
          const target = await card(0).boundingBox()
          if (!source || !target) throw new Error('Không thấy thẻ trên canvas')
          // Blank card padding (top-right corner), not the inline-editable title.
          await drag(
            page,
            { x: source.x + source.width - 12, y: source.y + 12 },
            { x: target.x + 8, y: target.y + target.height / 2 },
          )
          await expect(canvas.getByRole('heading', { level: 3 })).toHaveText(
            [titles[2], titles[0], titles[1]],
            { timeout: 2000 },
          )
        }).toPass({ timeout: 30000 })

        // The canvas shows the preview order before Puck commits the move (after its drop
        // animation); the Outline reads committed state, so wait for it before publishing.
        await openOutline(page, ['grid-canvas'])
        await expect(
          page.locator('[data-puck-layer-tree-id^="grid-canvas-card-"]').first(),
        ).toHaveAttribute('data-puck-layer-tree-id', 'grid-canvas-card-2')

        await publish(page)
        expect(childIds((await savedContent(page, pageId))[0], 'cards')).toEqual([
          'grid-canvas-card-2',
          'grid-canvas-card-0',
          'grid-canvas-card-1',
        ])
      },
    )
  })

  test('PK-07: thả thẻ ra ngoài lưới không tạo thẻ lẻ ở cấp gốc trang', async ({
    page,
    browser,
  }, testInfo) => {
    await withBuilderPage(
      { page, browser },
      testInfo,
      (marker) => [iconGrid('grid-root', cardTitles(marker))],
      async ({ pageId, marker }) => {
        const titles = cardTitles(marker)
        const canvas = page.frameLocator('iframe')
        await expect(canvas.getByRole('heading', { name: titles[2], exact: true })).toBeVisible({
          timeout: 30000,
        })
        const source = await canvas
          .locator('[data-puck-component="grid-root-card-2"]')
          .boundingBox()
        const grid = await canvas.locator('[data-puck-component="grid-root"]').boundingBox()
        if (!source || !grid) throw new Error('Không thấy lưới thẻ trên canvas')
        // Far below the grid section: only the page root zone is there.
        await drag(
          page,
          { x: source.x + source.width - 12, y: source.y + 12 },
          { x: grid.x + grid.width / 2, y: grid.y + grid.height + 120 },
        )

        await publish(page)
        const content = await savedContent(page, pageId)
        expect(content.map((block) => block.type)).toEqual(['IconCardGrid'])
        expect(childIds(content[0], 'cards')).toEqual([
          'grid-root-card-0',
          'grid-root-card-1',
          'grid-root-card-2',
        ])
      },
    )
  })
})
