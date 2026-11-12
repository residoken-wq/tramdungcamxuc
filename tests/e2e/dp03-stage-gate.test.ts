import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { expect, test, type Browser, type Page, type Response } from './fixtures'
import * as zip from './helpers/habit-zip'
import { vi } from '../../src/lib/i18n/vi'

/**
 * DP-03: login gate after Habit stage 1 on /habit/5-phut.
 * Needs E2E_TEST_HOOKS=1 (GL-01 mock Google). Runs once on desktop-1440 and loops over
 * 1440 / 375 itself, because it bootstraps the first admin and may create `habit-tracker-so`.
 * Screenshots only with DP03_SCREENSHOTS=1 (so a normal run never rewrites docs/).
 * QA DP-03c: rewritten (admin was logged in with a guessed password, the product was assumed
 * to exist, the step-1 answers were never checked, screenshots were rewritten on every run).
 */

const SHOT_DIR = path.join(process.cwd(), 'docs/screenshots/dp03')
const SHOTS = process.env.DP03_SCREENSHOTS === '1'
const STEP3_PLACEHOLDER = 'Thức dậy, uống một ly nước'

async function bootstrapAdmin(page: Page): Promise<number> {
  const init = await (await page.request.get('/api/users/init')).json()
  if (init.initialized !== false) {
    const meRes = await page.request.get('/api/users/me')
    if (meRes.ok() && (await meRes.json()).user) {
      return (await meRes.json()).user.id
    }
  }

  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = `AdminPass-${randomUUID()}`
  await page.locator('#field-email').fill(`admin-dp03-${randomUUID()}@example.test`)
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

  if (!response || !response.ok()) throw new Error('First-user registration failed.')
  await expect(page).toHaveURL(/\/admin\/?$/)
  return (await (await page.request.get('/api/users/me')).json()).user.id
}

/** Reuse `habit-tracker-so` when it exists; otherwise create a sample one (deleted afterwards). */
async function ensureHabitProduct(
  admin: Page,
): Promise<{ id: number; created: boolean; salePrice: number }> {
  const found = await (
    await admin.request.get('/api/products?where[slug][equals]=habit-tracker-so&draft=true')
  ).json()
  if (found.docs?.length) {
    const doc = found.docs[0]
    return { id: doc.id, created: false, salePrice: doc.salePrice ?? doc.price }
  }
  const res = await admin.request.post('/api/products', {
    data: {
      name: '[MẪU] Habit Tracker số',
      slug: 'habit-tracker-so',
      web: 'habit',
      type: 'digital_tool',
      trialDays: 28,
      price: 250000,
      salePrice: 178000,
      saleStatus: 'on_sale',
      isSample: true,
      _status: 'published',
    },
  })
  expect(res.ok()).toBe(true)
  return { id: (await res.json()).doc.id, created: true, salePrice: 178000 }
}

async function guestPage(browser: Browser, width: number) {
  const context = await browser.newContext({
    viewport: { width, height: width === 375 ? 667 : 900 },
    extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 240) + 10}` },
  })
  return { context, page: await context.newPage() }
}

async function deleteCustomerByEmail(admin: Page, email: string) {
  const q = encodeURIComponent(email)
  const res = await admin.request.get(`/api/customers?where[email][equals]=${q}&depth=0`)
  if (!res.ok()) return
  for (const c of ((await res.json()).docs ?? []) as Array<{ id: number }>) {
    for (const col of ['entitlements', 'habitPlans']) {
      const rel = await admin.request.get(`/api/${col}?where[customer][equals]=${c.id}&depth=0`)
      if (!rel.ok()) continue
      for (const d of ((await rel.json()).docs ?? []) as Array<{ id: number }>) {
        await admin.request.delete(`/api/${col}/${d.id}`).catch(() => {})
      }
    }
    await admin.request.delete(`/api/customers/${c.id}`).catch(() => {})
  }
  await admin.request.delete(`/api/leads?where[email][equals]=${q}`).catch(() => {})
}

test.describe('DP-03: login gate after Habit stage 1 (/habit/5-phut)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs once, loops over 1440 / 375.')
  })

  for (const width of [1440, 375]) {
    const label = width === 375 ? 'mobile' : 'desktop'

    test(`new guest: stage 1 free -> gate -> Google -> back on step 3 -> step 6 email locked (${width}px)`, async ({
      browser,
      page,
    }) => {
      test.setTimeout(240000)
      let adminId: number | undefined
      let product: { id: number; created: boolean } | undefined
      let customerEmail = ''
      const { context, page: guest } = await guestPage(browser, width)

      try {
        adminId = await bootstrapAdmin(page)
        product = await ensureHabitProduct(page)

        // Stage 1 needs no account.
        await guest.goto('/habit/5-phut')
        await zip.answerDiagnose(guest, 4)
        await zip.passPercent(guest)

        // Gate instead of step 3 – step 3 is not in the DOM at all.
        // The gate scrolls into view (not left below the hero on a phone).
        await expect(guest.getByRole('heading', { name: vi.dp03.loginTitle })).toBeInViewport()
        await expect(guest.getByPlaceholder(STEP3_PLACEHOLDER)).toHaveCount(0)
        const loginLink = guest.getByRole('link', { name: vi.dp03.loginButton })
        await expect(loginLink).toHaveAttribute(
          'href',
          `/tai-khoan/dang-nhap?next=${encodeURIComponent('/habit/5-phut?buoc=3')}`,
        )
        // Back to step 2 then navigate to stage 2 again via "Sang giai đoạn 2" button (AU-03 removed large stage cards).
        await guest.getByRole('button', { name: vi.dp03.backToStage1 }).click()
        const nextStageBtn = guest.getByRole('button', { name: /Sang giai đoạn 2/ })
        await expect(nextStageBtn).toBeVisible()
        await nextStageBtn.click()
        await expect(guest.getByRole('heading', { name: vi.dp03.loginTitle })).toBeVisible()
        await expect(guest.getByPlaceholder(STEP3_PLACEHOLDER)).toHaveCount(0)
        if (SHOTS) await guest.screenshot({ path: path.join(SHOT_DIR, `login-gate-${label}.png`) })

        // Real login page, real Google button (GL-01 mock), consent ticked.
        await loginLink.click()
        await expect(guest).toHaveURL(/\/tai-khoan\/dang-nhap\?next=/)
        await guest.locator('input[name="consentPolicy"]').check()
        await guest.getByRole('link', { name: vi.gl01.continueWithGoogle }).click()

        // Back on step 3 with the stage-1 answers kept.
        await expect(guest).toHaveURL(/\/habit\/5-phut\?buoc=3/, { timeout: 20000 })
        await expect(guest.getByPlaceholder(STEP3_PLACEHOLDER)).toBeVisible({ timeout: 15000 })
        await expect(guest.getByRole('heading', { name: vi.dp03.loginTitle })).toHaveCount(0)
        await guest
          .getByRole('button', { name: /Khám đúng bệnh/ })
          .last()
          .click()
        await expect(guest.locator('button[aria-pressed="true"]')).toHaveCount(8)
        await guest.getByRole('button', { name: /Tiếp · Nguyên lý 1% Better/ }).click()
        await zip.passPercent(guest)

        await zip.fillMentor(guest, '[MẪU] Uống nước ấm')
        await zip.fillIdentity(guest, {
          action: 'đi bộ 10 phút',
          role: 'người khoẻ mạnh',
          atomic: 'Xỏ giày',
        })
        await zip.setRhythm(guest, 'Mỗi ngày')
        await zip.nextFromIdentity(guest)
        await zip.nextFromLoop(guest)

        // Step 6: email from the session, read-only; no consent box (consent given at login).
        const email = guest.getByLabel(/Email nhận kế hoạch/)
        await expect(email).toHaveValue(/@example\.com$/)
        await expect(email).not.toBeEditable()
        customerEmail = await email.inputValue()
        await expect(guest.getByLabel(/Tôi đồng ý lưu kế hoạch/)).toHaveCount(0)
        if (SHOTS)
          await guest.screenshot({ path: path.join(SHOT_DIR, `step6-locked-email-${label}.png`) })

        await guest.getByLabel('Tên của bạn').fill('Học viên Test 01')
        await zip.submitBoarding(guest)

        // The trial started on step 6 (not at the gate).
        const customers = await (
          await page.request.get(
            `/api/customers?where[email][equals]=${encodeURIComponent(customerEmail)}&depth=0`,
          )
        ).json()
        expect(customers.docs).toHaveLength(1)
        const ents = await (
          await page.request.get(
            `/api/entitlements?where[customer][equals]=${customers.docs[0].id}&where[product][equals]=${product.id}&depth=0`,
          )
        ).json()
        expect(ents.docs.map((d: { status: string }) => d.status)).toEqual(['trial'])
      } finally {
        await context.close()
        if (adminId) {
          if (customerEmail) await deleteCustomerByEmail(page, customerEmail)
          if (product?.created) await zip.deleteTestProduct(page, product.id)
          await page.request.delete(`/api/users/${adminId}`).catch(() => {})
        }
      }
    })

    test(`trial used up: gate offers "Mua để dùng tiếp" with the CMS price (${width}px)`, async ({
      browser,
      page,
    }) => {
      test.setTimeout(180000)
      let adminId: number | undefined
      let product: { id: number; created: boolean; salePrice: number } | undefined
      const customerEmail = `dp03-exp-${randomUUID().slice(0, 8)}@example.test`
      const { context, page: guest } = await guestPage(browser, width)

      try {
        adminId = await bootstrapAdmin(page)
        product = await ensureHabitProduct(page)

        const cust = await page.request.post('/api/customers', {
          data: {
            email: customerEmail,
            name: 'Học viên Test 02',
            consentAt: new Date().toISOString(),
          },
        })
        expect(cust.ok()).toBe(true)
        const customerId = (await cust.json()).doc.id
        const ent = await page.request.post('/api/entitlements', {
          data: {
            customer: customerId,
            product: product.id,
            source: 'trial',
            status: 'expired',
            grantedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
            expiresAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          },
        })
        expect(ent.ok()).toBe(true)

        await guest.goto(
          `/api/auth/google/start?next=${encodeURIComponent('/habit/5-phut')}&consent=1&mock_email=${encodeURIComponent(customerEmail)}`,
        )
        await expect(guest).toHaveURL(/\/habit\/5-phut/, { timeout: 20000 })

        await zip.answerDiagnose(guest, 3)
        await zip.passPercent(guest)

        await expect(guest.getByRole('heading', { name: vi.dp03.buyTitle })).toBeInViewport()
        await expect(guest.getByPlaceholder(STEP3_PLACEHOLDER)).toHaveCount(0)
        // (The trial-expired banner above the page has its own "Mua để dùng tiếp" link.)
        const gate = guest.getByRole('region', { name: vi.dp03.buyTitle })
        await expect(gate.getByRole('link', { name: vi.dp03.buyButton })).toHaveAttribute(
          'href',
          '/thanh-toan?san-pham=habit-tracker-so',
        )
        await expect(gate.getByRole('link', { name: vi.dp03.viewOfferButton })).toHaveAttribute(
          'href',
          '/habit/1-percent-better',
        )
        await expect(
          guest.getByText(product.salePrice.toLocaleString('vi-VN'), { exact: false }).first(),
        ).toBeVisible()
        if (SHOTS) await guest.screenshot({ path: path.join(SHOT_DIR, `buy-gate-${label}.png`) })

        // ?buoc=6 typed by hand does not get around the gate either.
        await guest.goto('/habit/5-phut?buoc=6')
        await expect(guest.getByRole('heading', { name: vi.dp03.buyTitle })).toBeVisible()
        await expect(guest.getByText('HABIT BOARDING PASS')).toHaveCount(0)
      } finally {
        await context.close()
        if (adminId) {
          await deleteCustomerByEmail(page, customerEmail)
          if (product?.created) await zip.deleteTestProduct(page, product.id)
          await page.request.delete(`/api/users/${adminId}`).catch(() => {})
        }
      }
    })
  }
})
