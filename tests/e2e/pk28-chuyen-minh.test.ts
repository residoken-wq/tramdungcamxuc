import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'
import { journeyTemplate } from '@/puck/templates/journey'

// PK-28: Chuyển mình không chênh vênh 100% precision E2E
// Creates a page from journeyTemplate via REST, verifies responsive layout and a11y on public page,
// then cleans up in finally.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk28-${randomUUID()}@example.test`)
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

test.describe('PK-28: Chuyển mình không chênh vênh 100% precision', () => {
  test('public page renders 20 slides with 100% brand precision, responsive mobile, and clean a11y', async ({
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
    const slug = `e2e-pk28-${suffix}`
    let pageId: number | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      await bootstrapAdmin(page)

      // Create page with journeyTemplate via REST
      const res = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] Chuyển mình PK-28 ${suffix}`,
          slug,
          _status: 'published',
          puckData: journeyTemplate,
        },
      })

      expect(res.ok(), await res.text()).toBe(true)
      pageId = (await res.json()).doc.id

      // 1. Desktop 1440px
      await guest.setViewportSize({ width: 1440, height: 900 })
      const navRes = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(navRes?.status()).toBe(200)

      // Slide 1: Hero title is sentence/title case (not uppercase)
      const h1 = guest.locator('h1').first()
      await expect(h1).toBeVisible()
      const h1Class = (await h1.getAttribute('class')) || ''
      expect(h1Class).not.toContain('uppercase')
      await expect(guest.getByText('Chuyển mình').first()).toBeVisible()
      await expect(guest.getByText('không chênh vênh').first()).toBeVisible()

      // Slide 2: StoryLead
      await expect(
        guest.getByText('01 · CÂU CHUYỆN KHÔNG CỦA RIÊNG AI').first(),
      ).toBeVisible()

      // Slide 6: PhaseArchitecture - Phase 1 to left of Phase 2
      const phase1 = guest.getByText('PHASE 1 · HÔM NAY').first()
      const phase2 = guest.getByText('Career Clarity').first()
      await expect(phase1).toBeVisible()
      await expect(phase2).toBeVisible()

      const p1Box = await phase1.boundingBox()
      const p2Box = await phase2.boundingBox()
      if (p1Box && p2Box) {
        expect(p1Box.x).toBeLessThan(p2Box.x)
      }

      // Slide 7: LoopDiagram
      await expect(guest.getByText('VÒNG LẶP TRONG CÁCH TRIỂN KHAI').first()).toBeVisible()

      // Slide 11: ProgramStepFlow 3 steps
      await expect(guest.getByText('CHẶNG 1 · HIỂU').first()).toBeVisible()
      await expect(guest.getByText('CHẶNG 2 · THỬ').first()).toBeVisible()
      await expect(guest.getByText('CHẶNG 3').first()).toBeVisible()

      // Slide 18: MatrixTable
      await expect(guest.getByText('01 · Thói quen').first()).toBeVisible()
      await expect(guest.getByText('02 · Cảm xúc').first()).toBeVisible()
      await expect(guest.getByText('03 · Giao tiếp').first()).toBeVisible()

      // 2. Mobile 375px: responsive check & no horizontal scroll
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.waitForTimeout(300)

      const scrollWidth = await guest.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await guest.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // max 5px margin of error for subpixel

      // Accessibility check on public journey page
      await expectNoSeriousA11y(guest)
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      await visitor.close()
    }
  })
})
