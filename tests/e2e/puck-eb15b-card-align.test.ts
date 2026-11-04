import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'
import { vi } from '@/lib/i18n/vi'

/**
 * EB-15b / EB-15bc: icons and text inside cards follow both ways of centring:
 * 1. tab "Kiểu" → "Căn lề" (text-align) on the grid block,
 * 2. the grid field "Căn lề tất cả thẻ".
 * A grid left on defaults keeps its icons on the left.
 */

type Measure = { card: number; cardLeft: number; icon: number; iconLeft: number; title: number }

const card = (id: string, i: number) => ({
  type: 'Card',
  props: {
    id: `${id}-card-${i}`,
    version: 1,
    icon: 'heart',
    title: `[MẪU] Thẻ ${i + 1}`,
    text: '[MẪU] Mô tả ngắn để kiểm căn lề.',
    align: 'left',
  },
})

const grid = (id: string, title: string) => ({
  type: 'IconCardGrid',
  props: {
    id,
    version: 2,
    titleLine1: title,
    marker: 'icon',
    columns: 3,
    cardStyle: 'white',
    cardAlign: 'inherit',
    cards: [0, 1, 2].map((i) => card(id, i)),
  },
})

/** Horizontal centres of each card, its visible icon and the title's text (not its box). */
async function measureGrid(page: Page, gridTitle: string): Promise<Measure[]> {
  const section = page.locator('section').filter({ hasText: gridTitle }).first()
  await expect(section.locator('[data-eb-card]')).toHaveCount(3)
  return section.evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>('[data-eb-card]')].map((cardEl) => {
      const centre = (r: DOMRect) => r.x + r.width / 2
      const svg = [...cardEl.querySelectorAll('svg')].find((s) => s.getBoundingClientRect().width)
      const h3 = cardEl.querySelector('h3')
      if (!svg || !h3) throw new Error('Card without icon or title')
      const range = document.createRange()
      range.selectNodeContents(h3)
      const box = cardEl.getBoundingClientRect()
      return {
        card: centre(box),
        cardLeft: box.x,
        icon: centre(svg.getBoundingClientRect()),
        iconLeft: svg.getBoundingClientRect().x,
        title: centre(range.getBoundingClientRect()),
      }
    }),
  )
}

test.describe('EB-15b: căn lề icon / chữ trong thẻ', () => {
  test('tab Kiểu "Căn lề: Giữa" và "Căn lề tất cả thẻ: Căn giữa" đều đưa icon + chữ vào giữa', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(240000)
    page.setDefaultTimeout(20000)

    const email = `eb15b-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-eb15b-${randomUUID().slice(0, 8)}`
    const suffix = randomUUID().slice(0, 6)
    const styleGrid = { id: `eb15b-style-${suffix}`, title: '[MẪU] Lưới căn bằng tab Kiểu' }
    const fieldGrid = { id: `eb15b-field-${suffix}`, title: '[MẪU] Lưới căn tất cả thẻ' }
    const plainGrid = { id: `eb15b-plain-${suffix}`, title: '[MẪU] Lưới để mặc định' }

    let userId: number | undefined
    let pageId: number | undefined

    try {
      // 1. First admin on a clean DB (self-contained).
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()
      test.skip(
        !process.env.CI && initData.initialized === true,
        'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
      )
      await page.goto('/admin/create-first-user')
      await page.locator('#field-email').fill(email)
      await page.locator('#field-password').fill(password)
      await page.locator('#field-confirm-password').fill(password)
      let response: Response | undefined
      await expect(async () => {
        const registration = page.waitForResponse(
          (res) =>
            res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
          { timeout: 5000 },
        )
        await page.locator('button[type="submit"]').click()
        response = await registration
      }).toPass({ timeout: 60000 })
      if (!response) throw new Error('First-user registration request was never sent.')
      expect(response.ok()).toBe(true)
      await expect(page).toHaveURL(/\/admin\/?$/)
      userId = (await (await page.request.get('/api/users/me')).json()).user?.id

      // 2. Draft page: three grids, every card on its default "Căn trái".
      const created = await page.request.post('/api/pages?draft=true', {
        data: {
          title: '[MẪU] E2E EB-15b',
          slug,
          _status: 'draft',
          puckData: {
            root: { props: { title: '[MẪU] E2E EB-15b' } },
            content: [
              grid(styleGrid.id, styleGrid.title),
              grid(fieldGrid.id, fieldGrid.title),
              grid(plainGrid.id, plainGrid.title),
            ],
            zones: {},
          },
        },
      })
      expect(created.ok()).toBe(true)
      pageId = (await created.json()).doc.id

      await page.goto(`/builder/${pageId}`)
      const canvas = page.frameLocator('iframe')
      const gridAlignSelect = page
        .getByRole('combobox', { name: vi.eb15b.gridCardAlign, exact: true })
        .filter({ visible: true })

      /** Clicking the grid heading selects the grid itself, not one of its cards. */
      const selectGrid = async (title: string) => {
        const heading = canvas.getByText(title, { exact: true })
        await expect(heading).toBeVisible()
        await expect(async () => {
          await heading.click()
          // The selected tab is kept between blocks: come back to "Nội dung".
          await page.getByRole('tab', { name: 'Nội dung', exact: true }).click({ timeout: 1000 })
          await expect(gridAlignSelect).toBeVisible({ timeout: 1000 })
        }).toPass({ timeout: 15000 })
      }

      // 3. Way 1: tab "Kiểu" → "Căn lề: center" on the first grid.
      await selectGrid(styleGrid.title)
      await page.getByRole('tab', { name: 'Kiểu', exact: true }).click()
      await page
        .getByRole('combobox', { name: vi.eb04.fields.textAlign, exact: true })
        .filter({ visible: true })
        .first()
        .selectOption('center')
      await expect(canvas.locator(`[data-eb-id="${styleGrid.id}"]`)).toHaveCSS(
        'text-align',
        'center',
      )

      // 4. Way 2: "Căn lề tất cả thẻ: Căn giữa" on the second grid.
      await selectGrid(fieldGrid.title)
      await gridAlignSelect.selectOption({ label: 'Căn giữa' })
      await expect(
        canvas.locator(`[data-puck-component="${fieldGrid.id}"] [data-card-align="center"]`),
      ).toHaveCount(1)

      // 5. Publish.
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(page.getByRole('status').filter({ hasText: 'Đã xuất bản' })).toBeVisible({
        timeout: 15000,
      })

      // 6. Public page at 1440 and 375.
      const publicPage = await page.context().newPage()
      for (const width of [1440, 375]) {
        await publicPage.setViewportSize({ width, height: 900 })
        await publicPage.goto(`/${slug}`)

        for (const g of [styleGrid, fieldGrid]) {
          for (const m of await measureGrid(publicPage, g.title)) {
            expect(
              Math.abs(m.icon - m.title),
              `${g.title} @${width}: icon vs title`,
            ).toBeLessThanOrEqual(2)
            expect(
              Math.abs(m.title - m.card),
              `${g.title} @${width}: title vs card`,
            ).toBeLessThanOrEqual(2)
          }
        }

        // Defaults unchanged: icon near the card's left edge, not centred.
        for (const m of await measureGrid(publicPage, plainGrid.title)) {
          expect(m.iconLeft - m.cardLeft, `default @${width}: icon on the left`).toBeLessThan(48)
          expect(Math.abs(m.icon - m.card), `default @${width}: icon not centred`).toBeGreaterThan(
            40,
          )
        }
      }
      await publicPage.close()
    } finally {
      if (pageId) await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      if (userId) await page.request.delete(`/api/users/${userId}`).catch(() => {})
    }
  })
})
