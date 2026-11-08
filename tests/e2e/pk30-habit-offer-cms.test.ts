import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

// PK-30: the /habit/1-percent-better offer page reads its text from the habit-tracker-so product.
// QA PK-30: edits the product through REST, checks the public page, restores it in `finally`.
// CI starts from an empty database, so a [MẪU] product is created when none exists.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk30-${randomUUID()}@example.test`)
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

type OfferFields = {
  offerTitleLine1?: string | null
  curriculumModules?: Array<{ title: string; description?: string | null }> | null
}

test.describe('PK-30: Habit offer page text from the product form', () => {
  test('edited title and module show on /habit/1-percent-better; 375 has no sideways scroll; clean a11y', async ({
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
    const title = `[MẪU] Tiêu đề thử PK-30 ${suffix}`
    const moduleTitle = `[MẪU] Module thử ${suffix}`

    let adminId: number | undefined
    let productId: number | undefined
    let createdProduct = false
    let original: OfferFields | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      adminId = await bootstrapAdmin(page)

      const found = await (
        await page.request.get(
          '/api/products?where[slug][equals]=habit-tracker-so&limit=1&depth=0&draft=false',
        )
      ).json()
      if (found.docs?.length) {
        productId = found.docs[0].id
        original = {
          offerTitleLine1: found.docs[0].offerTitleLine1 ?? null,
          curriculumModules: found.docs[0].curriculumModules ?? [],
        }
      } else {
        // Free keeps the price / cover-image publish checks out of this test.
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
        data: {
          offerTitleLine1: title,
          curriculumModules: [{ title: moduleTitle, description: '[MẪU] Mô tả module thử' }],
          _status: 'published',
        },
      })
      expect(patch.ok(), await patch.text()).toBe(true)

      // 1440
      await guest.setViewportSize({ width: 1440, height: 900 })
      const nav = await guest.goto('/habit/1-percent-better', { waitUntil: 'domcontentloaded' })
      expect(nav?.status()).toBe(200)
      await expect(guest.getByText(title).first()).toBeVisible()
      await expect(guest.getByText(moduleTitle).first()).toBeVisible()
      // the "modules" stat follows the real number of modules (1 here, not the old fixed 4)
      const modulesStat = guest
        .getByText('Module lộ trình tinh gọn')
        .locator('xpath=preceding-sibling::*[1]')
      await expect(modulesStat).toHaveText('1')

      // 375
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.reload({ waitUntil: 'domcontentloaded' })
      await expect(guest.getByText(title).first()).toBeVisible()
      const overflow = await guest.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(1)
      await expectNoSeriousA11y(guest)
    } finally {
      if (productId) {
        if (createdProduct) {
          await page.request.delete(`/api/products/${productId}`).catch(() => {})
        } else if (original) {
          await page.request
            .patch(`/api/products/${productId}`, { data: { ...original, _status: 'published' } })
            .catch(() => {})
        }
      }
      if (adminId) {
        await page.request.delete(`/api/users/${adminId}`).catch(() => {})
      }
      await guest.close().catch(() => {})
      await visitor.close().catch(() => {})
    }
  })
})
