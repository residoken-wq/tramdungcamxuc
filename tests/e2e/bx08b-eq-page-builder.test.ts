import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

// BX-08b: the "Nội dung EQ Buddy" global creates a builder page that replaces /eq-buddy once it is
// published; unpublishing brings the coded page back. Data is deleted in `finally`.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`bx08b-${randomUUID()}@example.test`)
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

test.describe('BX-08b: /eq-buddy edited with the builder', () => {
  test('EQ global creates a draft builder page; publish replaces /eq-buddy; unpublish restores it', async ({
    page,
    browser,
    context,
  }, testInfo) => {
    test.setTimeout(240000)
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, checks 1440 and 375 itself.')

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const suffix = randomUUID().slice(0, 8)
    const quote = `[MẪU] Trích dẫn EQ BX-08b ${suffix}`

    let adminId: number | undefined
    let pageId: number | string | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      // 1. Global "Nội dung EQ Buddy" → "Chỉnh bố cục bằng builder" creates a DRAFT page
      await page.goto('/admin/globals/eqBuddyContent', { waitUntil: 'domcontentloaded' })
      const panel = page.getByTestId('eq-builder-panel')
      await expect(panel).toBeVisible({ timeout: 30000 })
      const popupPromise = context.waitForEvent('page')
      const created = page.waitForResponse(
        (res) => res.url().includes('/api/pages') && res.request().method() === 'POST',
      )
      await panel.getByRole('button', { name: 'Chỉnh bố cục bằng builder' }).click()
      const createdRes = await created
      expect(createdRes.ok(), await createdRes.text()).toBe(true)
      pageId = (await createdRes.json()).doc.id
      const popup = await popupPromise
      await popup.waitForURL(/\/builder\/\w+/, { timeout: 30000 })
      expect(popup.url()).toContain(`/builder/${pageId}`)
      await popup.close()
      await expect(panel.getByRole('link', { name: /Mở trang builder/ })).toBeVisible()

      // Draft only: visitors still see the coded page, draw button included
      await guest.goto('/eq-buddy', { waitUntil: 'domcontentloaded' })
      await expect(guest.locator('a[href="/eq-buddy/rut-the"]').first()).toBeVisible()

      // 2. Add a quote inside the frame like Hana would and publish
      const draft = await (await page.request.get(`/api/pages/${pageId}?draft=true&depth=0`)).json()
      expect(draft.slug).toBe('eq-buddy')
      const puckData = draft.puckData
      const frame = puckData.content[0]
      expect(frame.type).toBe('EqBuddyFrame')
      frame.props.align = 'left'
      frame.props.content = [
        { type: 'QuoteBlock', props: { id: `QuoteBlock-bx08b-${suffix}`, quote } },
        ...frame.props.content,
      ]
      const publish = await page.request.patch(`/api/pages/${pageId}`, {
        data: { puckData, _status: 'published' },
      })
      expect(publish.ok(), await publish.text()).toBe(true)

      // 3. Public page = builder page; the draw button still leads to the draw screen
      await guest.setViewportSize({ width: 1440, height: 900 })
      const nav = await guest.goto('/eq-buddy', { waitUntil: 'domcontentloaded' })
      expect(nav?.status()).toBe(200)
      await expect(guest.getByText(quote).first()).toBeVisible()
      await expect(guest.locator('a[href="/eq-buddy/rut-the"]').first()).toBeVisible()

      // 375: no sideways scroll, clean a11y
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.reload({ waitUntil: 'domcontentloaded' })
      await expect(guest.getByText(quote).first()).toBeVisible()
      const overflow = await guest.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
      await expectNoSeriousA11y(guest)

      // The draw screen is an app page and is never replaced
      const draw = await guest.goto('/eq-buddy/rut-the', { waitUntil: 'domcontentloaded' })
      expect(draw?.status()).toBe(200)
      await expect(guest.getByText(quote)).toHaveCount(0)

      // 4. Unpublish → coded page back
      const unpublish = await page.request.patch(`/api/pages/${pageId}`, {
        data: { _status: 'draft' },
      })
      expect(unpublish.ok(), await unpublish.text()).toBe(true)
      await guest.setViewportSize({ width: 1440, height: 900 })
      await guest.goto('/eq-buddy', { waitUntil: 'domcontentloaded' })
      await expect(guest.locator('a[href="/eq-buddy/rut-the"]').first()).toBeVisible()
      await expect(guest.getByText(quote)).toHaveCount(0)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await visitor.close()
      if (pageId) await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      if (adminId) await page.request.delete(`/api/users/${adminId}`).catch(() => {})
    }
  })
})
