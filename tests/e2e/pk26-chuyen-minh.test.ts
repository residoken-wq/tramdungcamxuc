import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'
import { journeyTemplate } from '@/puck/templates/journey'

// PK-26: Chuyển mình không chênh vênh template E2E
// Test creates a page from journeyTemplate via REST, verifies responsive layout and a11y on public page,
// then cleans up in finally. Runs on CI.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk26-${randomUUID()}@example.test`)
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

test.describe('PK-26: Chuyển mình không chênh vênh (journey template)', () => {
  test('public page renders 6 loop nodes, 4x3 matrix grid, responsive stacked cards, arrow connectors, and clean a11y', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const suffix = randomUUID().slice(0, 8)
    const slug = `e2e-chuyen-minh-${suffix}`
    let adminId: number | undefined
    let pageId: number | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // Create page with journeyTemplate via REST
      const res = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] Chuyển mình E2E ${suffix}`,
          slug,
          _status: 'published',
          // PK-28 rebuilt journey.ts with its own step-flow blocks, so the IconCardGrid arrow
          // connector (PK-26 A2) is checked on an extra test grid appended to the page.
          puckData: {
            ...journeyTemplate,
            content: [
              ...journeyTemplate.content,
              {
                type: 'IconCardGrid',
                props: {
                  id: `arrow-grid-${suffix}`,
                  version: 2,
                  columns: 3,
                  connector: 'arrow',
                  cards: [1, 2, 3].map((n) => ({
                    type: 'Card',
                    props: { id: `arrow-card-${n}-${suffix}`, title: `[MẪU] Bước ${n}`, text: '' },
                  })),
                },
              },
            ],
          },
        },
      })

      expect(res.ok(), await res.text()).toBe(true)
      pageId = (await res.json()).doc.id

      // 1. Kiểm tra trên màn hình Desktop (1440px)
      await guest.setViewportSize({ width: 1440, height: 900 })
      const navRes = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(navRes?.status()).toBe(200)

      // Hero title is visible
      await expect(guest.getByText('Chuyển mình').first()).toBeVisible()
      await expect(guest.getByText('không chênh vênh').first()).toBeVisible()

      // LoopDiagram: 6 nodes are visible in desktop view
      // (the section title lives in a separate SectionHeader block, so match the nodes themselves)
      await expect(guest.getByText('01 · Nhận diện vấn đề').first()).toBeVisible()
      await expect(guest.getByText('06 · Đúc kết').first()).toBeVisible()

      // MatrixTable 28-day grid: 4 rows × 3 columns
      const desktopTable = guest.locator('table').filter({ hasText: '01 · Thói quen' })
      const matrixTable = guest.locator('section').filter({ has: desktopTable })
      await expect(matrixTable).toHaveCount(1)
      // Desktop table is visible
      await expect(desktopTable).toBeVisible()
      // 3 column headers
      await expect(desktopTable.locator('th[scope="col"]')).toHaveCount(4) // 1 corner + 3 cols
      // 4 row headers (Tuần 1 - Tuần 4)
      await expect(desktopTable.locator('th[scope="row"]')).toHaveCount(4)

      // Arrow connectors in 5-step regulation toolkit
      // Slot grids draw the arrow with CSS (`::after` on every card but the last), so read it there.
      const arrowContent = () =>
        guest.evaluate(() => {
          const grid = [...document.querySelectorAll('[class]')].find((el) =>
            el.getAttribute('class')?.includes("after:content-['→']"),
          )
          const first = grid?.firstElementChild
          return first ? getComputedStyle(first, '::after').content : 'missing'
        })
      expect(await arrowContent()).toBe('"→"')

      // 2. Kiểm tra trên màn hình Mobile (375px)
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.waitForTimeout(500)

      // No horizontal scroll on mobile (overflow <= 1px)
      const overflow = await guest.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)

      // On mobile, desktop table is hidden and stacked cards are visible
      await expect(desktopTable).toBeHidden()
      const mobileStackedCards = matrixTable.locator('[data-eb-card]')
      expect(await mobileStackedCards.count()).toBeGreaterThanOrEqual(4)

      // Arrows hidden on mobile (hidden lg:flex)
      expect(await arrowContent()).toBe('none')

      // 3. Accessibility check (axe clean)
      await expectNoSeriousA11y(guest, 'journey-chuyen-minh-e2e')
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await guest.close()
      await visitor.close()
    }
  })
})
