import { randomUUID } from 'node:crypto'
import { expect, test, type APIRequestContext, type Page, type Response } from '@playwright/test'

// The spec builds its own data (menu, legal page, Zalo chat) so it runs on an empty CI database,
// then restores the globals it touched.

const QUIZ_LABEL = 'Test thói quen 5 phút'
const QUIZ_HREF = '/habit/chan-doan'
const LEGAL_SLUG = 'dieu-khoan-su-dung'
const LEGAL_TITLE = 'Điều khoản sử dụng'
const ZALO_URL = 'https://zalo.me/0000000000'

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t1-05-${randomUUID()}@example.test`)
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
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

async function getGlobal(request: APIRequestContext, slug: string) {
  const res = await request.get(`/api/globals/${slug}?depth=0`)
  expect(res.ok()).toBe(true)
  return res.json()
}

test.describe('Site shell (T1-05): navbar, footer, floating chat, legal pages', () => {
  test('menu has the quiz, legal page renders, Zalo button does not cover the footer', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let userId: number | undefined
    let createdLegalId: number | undefined
    let navBefore: { mainMenu?: unknown[] } | undefined
    let settingsBefore: { showFloatingChat?: boolean; zaloChatUrl?: string | null } | undefined

    try {
      userId = await bootstrapAdmin(page)

      // 1. Data: menu with the quiz, a published legal page, Zalo chat on.
      navBefore = await getGlobal(page.request, 'navigation')
      settingsBefore = await getGlobal(page.request, 'siteSettings')

      const navRes = await page.request.post('/api/globals/navigation', {
        data: {
          mainMenu: [
            { label: QUIZ_LABEL, linkType: 'url', url: QUIZ_HREF },
            { label: 'Đặt phiên trải nghiệm', linkType: 'url', url: '/', highlight: true },
          ],
        },
      })
      expect(navRes.ok()).toBe(true)

      const existing = await (
        await page.request.get(`/api/legalPages?where[slug][equals]=${LEGAL_SLUG}&depth=0`)
      ).json()
      if (existing.docs.length === 0) {
        const created = await page.request.post('/api/legalPages', {
          data: { title: LEGAL_TITLE, slug: LEGAL_SLUG, order: 2, _status: 'published' },
        })
        expect(created.ok()).toBe(true)
        createdLegalId = (await created.json()).doc.id
      }
      const legalTitle: string = existing.docs[0]?.title ?? LEGAL_TITLE

      const settingsRes = await page.request.post('/api/globals/siteSettings', {
        data: { showFloatingChat: true, zaloChatUrl: ZALO_URL },
      })
      expect(settingsRes.ok()).toBe(true)

      // 2. Public pages at 1440 and 375.
      for (const width of [1440, 375]) {
        const ctx = await browser.newContext({
          baseURL: testInfo.project.use.baseURL,
          viewport: { width, height: width === 375 ? 667 : 900 },
        })
        const pub = await ctx.newPage()
        try {
          await pub.goto('/')

          // Quiz link visible on the bar itself (no need to open the mobile drawer).
          const quiz = pub
            .getByRole('banner')
            .locator(`a[href="${QUIZ_HREF}"]`)
            .filter({ visible: true })
            .first()
          await expect(quiz, `quiz link at ${width}px`).toBeVisible()

          // Footer lists the legal page.
          await expect(
            pub.getByRole('contentinfo').getByRole('link', { name: legalTitle }),
          ).toHaveAttribute('href', `/${LEGAL_SLUG}`)

          // No horizontal overflow.
          expect(
            await pub.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width)

          // Zalo button: visible, opens a new tab, does not cover any footer link.
          const chat = pub.locator(`a[href="${ZALO_URL}"]`)
          await expect(chat).toBeVisible()
          await expect(chat).toHaveAttribute('target', '_blank')
          await pub.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
          const chatBox = await chat.boundingBox()
          const links = pub.getByRole('contentinfo').locator('a')
          const count = await links.count()
          for (let i = 0; i < count; i++) {
            const box = await links.nth(i).boundingBox()
            if (!box || !chatBox) continue
            const overlap =
              chatBox.x < box.x + box.width &&
              chatBox.x + chatBox.width > box.x &&
              chatBox.y < box.y + box.height &&
              chatBox.y + chatBox.height > box.y
            expect(overlap, `Zalo button covers footer link #${i} at ${width}px`).toBe(false)
          }

          // Legal page.
          const res = await pub.goto(`/${LEGAL_SLUG}`)
          expect(res?.status()).toBe(200)
          await expect(pub.getByRole('heading', { level: 1, name: legalTitle })).toBeVisible()
          await expect(pub).toHaveTitle(new RegExp(legalTitle))
        } finally {
          await ctx.close()
        }
      }

      // 3. Route exists but the record is gone → 404.
      if (createdLegalId) {
        await page.request.delete(`/api/legalPages/${createdLegalId}`)
        createdLegalId = undefined
        const missing = await page.request.get(`/${LEGAL_SLUG}`)
        expect(missing.status()).toBe(404)
      }
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      if (createdLegalId) await page.request.delete(`/api/legalPages/${createdLegalId}`)
      if (navBefore) {
        await page.request.post('/api/globals/navigation', {
          data: { mainMenu: navBefore.mainMenu ?? [] },
        })
      }
      if (settingsBefore) {
        await page.request.post('/api/globals/siteSettings', {
          data: {
            showFloatingChat: settingsBefore.showFloatingChat ?? false,
            zaloChatUrl: settingsBefore.zaloChatUrl ?? null,
          },
        })
      }
      if (userId) {
        const deleted = await page.request.delete(`/api/users/${userId}`)
        expect(deleted.ok(), 'Temporary user must be deleted.').toBe(true)
      }
    }
  })
})
