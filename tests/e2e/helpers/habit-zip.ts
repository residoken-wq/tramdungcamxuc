import { expect, type Page } from '@playwright/test'

// Shared steps for the DP-01 zip Habit flow on /habit/5-phut (selectors follow the real UI).

/** Step 1: answer every diagnose question with the same score, then go to step 2. */
export async function answerDiagnose(page: Page, score = 4) {
  await expect(page.getByText(/Khám đúng .bệnh./i).first()).toBeVisible({ timeout: 20000 })
  const groups = page
    .getByRole('group')
    .filter({ has: page.getByRole('button', { name: '1', exact: true }) })
  await expect(groups.first()).toBeVisible()
  const count = await groups.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    await groups
      .nth(i)
      .getByRole('button', { name: String(score), exact: true })
      .click()
  }
  await page.getByRole('button', { name: /Tiếp · Nguyên lý 1% Better/ }).click()
}

/** Step 2: 1% principle, go to stage 2. */
export async function passPercent(page: Page) {
  await expect(page.getByText(/Nguyên lý 1%/i).first()).toBeVisible({ timeout: 15000 })
  await page.getByRole('button', { name: /Sang giai đoạn 2/ }).click()
}

/** Step 3: type one routine, mark it useful (+), pick it as Mentor. */
export async function fillMentor(page: Page, activity: string) {
  const first = page.getByPlaceholder('Thức dậy, uống một ly nước')
  await expect(first).toBeVisible({ timeout: 15000 })
  await first.fill(activity)
  await page.getByTitle('Có ích (+)').first().click()
  await page.getByRole('button', { name: activity, exact: true }).click()
  await expect(page.getByText(/Mentor của bạn:/)).toBeVisible()
  await page.getByRole('button', { name: /Tiếp • Gọi tên thói quen/ }).click()
}

/** Step 4: identity statement + atomic habit. */
export async function fillIdentity(
  page: Page,
  { action, role, atomic }: { action: string; role: string; atomic: string },
) {
  const actionInput = page.getByPlaceholder('đọc sách mỗi ngày')
  await expect(actionInput).toBeVisible({ timeout: 15000 })
  await actionInput.fill(action)
  await page.getByPlaceholder('người luôn học hỏi').fill(role)
  await page.getByPlaceholder('đọc 1 trang sách').fill(atomic)
}

/** Step 4 rhythm: one of the 3 frequency buttons, then optional day chips (T2…T7, CN) to toggle. */
export async function setRhythm(
  page: Page,
  frequency: '3 lần một tuần' | '5 lần một tuần' | 'Mỗi ngày',
  toggleDays: string[] = [],
) {
  const btn = page.getByRole('button', { name: frequency, exact: true })
  await btn.click()
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
  for (const day of toggleDays) {
    await page.getByRole('button', { name: day, exact: true }).click()
  }
}

/** Step 4 start date (yyyy-mm-dd). */
export async function setStartDate(page: Page, ymd: string) {
  await page.getByLabel('Ngày bắt đầu').fill(ymd)
}

export async function nextFromIdentity(page: Page) {
  await page.getByRole('button', { name: /Tiếp • Thiết kế vòng lặp/ }).click()
  await expect(page.getByText(/Thiết kế vòng lặp/i).first()).toBeVisible({ timeout: 15000 })
}

/** Step 5: tick techniques by name; optional note per technique (opens its details). */
export async function pickTechniques(page: Page, picks: Array<{ name: string; note?: string }>) {
  for (const { name, note } of picks) {
    const box = page.getByRole('checkbox', { name, exact: true })
    await box.click()
    await expect(box).toHaveAttribute('aria-checked', 'true')
    if (note) {
      const row = box.locator('xpath=ancestor::div[contains(@class,"justify-between")][1]/..')
      const noteInput = row.getByLabel('Cách tôi áp dụng:')
      if (!(await noteInput.isVisible())) {
        await row.getByRole('button', { name: 'Xem', exact: true }).click()
      }
      await noteInput.fill(note)
    }
  }
}

export async function nextFromLoop(page: Page) {
  await page.getByRole('button', { name: /Tiếp • Nhận thẻ lên tàu/ }).click()
  await expect(page.getByText('HABIT BOARDING PASS').first()).toBeVisible({ timeout: 15000 })
}

/** Step 6: fill the email form (Turnstile must have produced a token before submit, bypassed if logged in). */
export async function fillBoarding(page: Page, { name, email }: { name: string; email: string }) {
  await page.getByLabel('Tên của bạn').fill(name)
  const emailInput = page.getByLabel(/Email nhận kế hoạch/)
  if (await emailInput.isEditable()) {
    await emailInput.fill(email)
  }
  const consentBox = page.getByLabel(/Tôi đồng ý lưu kế hoạch/)
  if (await consentBox.isVisible()) {
    await consentBox.check()
  }
  const turnstileInput = page.locator('input[name="cf-turnstile-response"]')
  if (await turnstileInput.isVisible()) {
    await expect(turnstileInput).not.toHaveValue('', {
      timeout: 20000,
    })
  }
}

/**
 * REVIEW-REQUIRED: DP-03 Đăng nhập khách hàng bằng mock Google route (GL-01 test hook)
 * để chuẩn bị phiên hợp lệ trước khi vào các bước >= 3 của /habit/5-phut.
 */
export async function loginHabitCustomer(page: Page, email: string, nextUrl = '/habit/5-phut') {
  await page.goto(
    `/api/auth/google/start?next=${encodeURIComponent(nextUrl)}&consent=1&mock_email=${encodeURIComponent(email)}`,
  )
}

export async function submitBoarding(page: Page) {
  await page
    .getByRole('button', { name: /Lên chuyến · Bắt đầu 28 ngày/ })
    .first()
    .click()
  const success = page.getByRole('link', { name: /Vào bảng theo dõi 28 ngày/ })
  const error = page.getByRole('alert').filter({ hasText: /\S/ })
  await expect(success.or(error).first()).toBeVisible({ timeout: 20000 })
  if (!(await success.isVisible())) {
    throw new Error(`Submit plan failed: ${await error.first().innerText()}`)
  }
}

/**
 * Delete a test product together with what points at it (entitlements first: their product
 * column is NOT NULL, so the product delete fails otherwise and later tests find a duplicate slug).
 */
export async function deleteTestProduct(page: Page, productId: number) {
  const res = await page.request
    .get(`/api/entitlements?where[product][equals]=${productId}&limit=200&depth=0`)
    .catch(() => null)
  if (res?.ok()) {
    const docs = ((await res.json()).docs ?? []) as Array<{ id: number }>
    for (const doc of docs) {
      await page.request.delete(`/api/entitlements/${doc.id}`).catch(() => {})
    }
  }
  await page.request.delete(`/api/products/${productId}`).catch(() => {})
}
