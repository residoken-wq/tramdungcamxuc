import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

// BX-08a: the product form creates a builder page that replaces /habit/1-percent-better once it is
// published; unpublishing brings the coded page back. Data is restored / deleted in `finally`.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`bx08a-${randomUUID()}@example.test`)
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

test.describe('BX-08a: product page edited with the builder', () => {
  test('product form creates a draft builder page; publish replaces the coded page; unpublish restores it', async ({
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
    const title = `[MẪU] Tiêu đề BX-08a ${suffix}`
    const quote = `[MẪU] Trích dẫn thêm BX-08a ${suffix}`

    let adminId: number | undefined
    let productId: number | undefined
    let createdProduct = false
    let originalTitle: string | null = null
    let pageId: number | string | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      const found = await (
        await page.request.get('/api/products?where[slug][equals]=habit-tracker-so&limit=1&depth=0')
      ).json()
      if (found.docs?.length) {
        productId = found.docs[0].id
        originalTitle = found.docs[0].offerTitleLine1 ?? null
      } else {
        const res = await page.request.post('/api/products', {
          data: {
            name: '[MẪU] Habit Tracker số',
            slug: 'habit-tracker-so',
            web: 'habit',
            type: 'digital_tool',
            saleStatus: 'free',
            _status: 'published',
          },
        })
        expect(res.ok(), await res.text()).toBe(true)
        productId = (await res.json()).doc.id
        createdProduct = true
      }
      const patch = await page.request.patch(`/api/products/${productId}`, {
        data: { offerTitleLine1: title, _status: 'published' },
      })
      expect(patch.ok(), await patch.text()).toBe(true)

      // 1. Product form → "Chỉnh bố cục bằng builder" creates a DRAFT page and opens the builder
      await page.goto(`/admin/collections/products/${productId}`, { waitUntil: 'domcontentloaded' })
      const panel = page.getByTestId('product-builder-panel')
      await expect(panel).toBeVisible({ timeout: 30000 })
      const popupPromise = context.waitForEvent('page')
      const created = page.waitForResponse(
        (res) => res.url().includes('/api/pages') && res.request().method() === 'POST',
      )
      await panel.getByRole('button', { name: 'Chỉnh bố cục bằng builder' }).click()
      const createdRes = await created
      expect(createdRes.ok(), await createdRes.text()).toBe(true)
      pageId = (await createdRes.json()).doc.id // cleanup works even if a later step fails
      const popup = await popupPromise
      await popup.waitForURL(/\/builder\/\w+/, { timeout: 30000 })
      expect(popup.url()).toContain(`/builder/${pageId}`)
      await popup.close()
      await expect(panel.getByRole('link', { name: /Mở trang builder/ })).toBeVisible()

      // Draft only: visitors still see the coded page
      await guest.goto('/habit/1-percent-better', { waitUntil: 'domcontentloaded' })
      await expect(guest.getByText(title).first()).toBeVisible()

      // 2. Change the layout like Hana would (image right, extra quote in the hero slot) and publish
      const draft = await (await page.request.get(`/api/pages/${pageId}?draft=true&depth=0`)).json()
      expect(draft.slug).toBe('habit/1-percent-better')
      const puckData = draft.puckData
      const hero = puckData.content[0]
      expect(hero.type).toBe('ProductOfferHero')
      expect(JSON.stringify(puckData)).not.toContain(title) // only the product id is stored
      hero.props.align = 'left'
      hero.props.extra = [
        { type: 'QuoteBlock', props: { id: `QuoteBlock-bx08a-${suffix}`, quote } },
      ]
      const publish = await page.request.patch(`/api/pages/${pageId}`, {
        data: { puckData, _status: 'published' },
      })
      expect(publish.ok(), await publish.text()).toBe(true)

      // 3. Public page = builder page, text still read from the product
      await guest.setViewportSize({ width: 1440, height: 900 })
      const nav = await guest.goto('/habit/1-percent-better', { waitUntil: 'domcontentloaded' })
      expect(nav?.status()).toBe(200)
      // The quote dropped into the hero's "Thêm phần tử" slot only exists on the builder page
      await expect(guest.getByText(quote).first()).toBeVisible()
      await expect(guest.getByText(title).first()).toBeVisible()

      // 375: no sideways scroll, clean a11y
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.reload({ waitUntil: 'domcontentloaded' })
      await expect(guest.getByText(title).first()).toBeVisible()
      const overflow = await guest.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
      await expectNoSeriousA11y(guest)

      // 4. Unpublish → coded page back
      const unpublish = await page.request.patch(`/api/pages/${pageId}`, {
        data: { _status: 'draft' },
      })
      expect(unpublish.ok(), await unpublish.text()).toBe(true)
      await guest.setViewportSize({ width: 1440, height: 900 })
      await guest.goto('/habit/1-percent-better', { waitUntil: 'domcontentloaded' })
      await expect(guest.getByText(title).first()).toBeVisible()
      await expect(guest.getByText(quote)).toHaveCount(0)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await visitor.close()
      if (pageId) await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      if (productId) {
        if (createdProduct) {
          await page.request.delete(`/api/products/${productId}`).catch(() => {})
        } else {
          await page.request
            .patch(`/api/products/${productId}`, {
              data: { offerTitleLine1: originalTitle, _status: 'published' },
            })
            .catch(() => {})
        }
      }
      if (adminId) await page.request.delete(`/api/users/${adminId}`).catch(() => {})
    }
  })
})
