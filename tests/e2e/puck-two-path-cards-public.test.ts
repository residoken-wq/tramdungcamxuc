import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

// 07/11: /ve-tram returned 500 on production ("Functions cannot be passed directly to Client
// Components … paths: function"). TwoPathCards is a client component and received its slot as a
// function on the server. Guard: a published page with this block renders on the public site.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`two-paths-${randomUUID()}@example.test`)
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

test.describe('TwoPathCards on a public page', () => {
  test('a published page with the "Hai lối đi" block and its path cards renders (no 500)', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120000)
    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const suffix = randomUUID().slice(0, 8)
    const slug = `e2e-two-paths-${suffix}`
    let adminId: number | undefined
    let pageId: number | undefined
    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      const card = (id: string, title: string, href: string) => ({
        type: 'PathCard',
        props: {
          id,
          version: 1,
          groupLabel: '[TEST] NHÓM',
          title,
          description: '[TEST] Mô tả thẻ lối đi.',
          buttonLabel: '[TEST] Xem thêm',
          linkType: 'url',
          pageId: '',
          href,
          buttonStyle: 'solid',
          align: 'left',
        },
      })
      const res = await page.request.post('/api/pages', {
        data: {
          title: `[TEST] Hai lối đi ${suffix}`,
          slug,
          _status: 'published',
          puckData: {
            root: { props: {} },
            content: [
              {
                type: 'TwoPathCards',
                props: {
                  id: `TwoPathCards-${suffix}`,
                  version: 2,
                  seriesLabel: '[TEST] ĐỒNG HÀNH',
                  titleLine1: '[TEST] CHỌN LỘ TRÌNH',
                  titleLine2: '[TEST] PHÙ HỢP',
                  titleSize: 'md',
                  cardAlign: 'inherit',
                  bgColor: 'warm-ivory',
                  padding: 'md',
                  paths: [
                    card(`PathCard-a-${suffix}`, `[TEST] Lối đi cá nhân ${suffix}`, '/coaching'),
                    card(
                      `PathCard-b-${suffix}`,
                      `[TEST] Lối đi doanh nghiệp ${suffix}`,
                      '/doanh-nghiep',
                    ),
                  ],
                },
              },
            ],
          },
        },
      })
      expect(res.ok(), await res.text()).toBe(true)
      pageId = (await res.json()).doc.id

      const response = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(guest.getByText(`[TEST] Lối đi cá nhân ${suffix}`)).toBeVisible()
      await expect(guest.getByText(`[TEST] Lối đi doanh nghiệp ${suffix}`)).toBeVisible()
      // Both cards sit in the two-column grid, side by side on desktop
      const grid = guest.locator('.md\\:grid-cols-2').filter({
        has: guest.getByText(`[TEST] Lối đi cá nhân ${suffix}`),
      })
      await expect(grid.first()).toBeVisible()
    } finally {
      await visitor.close()
      if (pageId) await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      if (adminId) await page.request.delete(`/api/users/${adminId}`).catch(() => {})
    }
  })
})
