import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`hb08-e2e-${randomUUID()}@example.test`)
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

test.describe('HB-08: Nguyên lý 1% thanh kéo trên /habit/5-phut', () => {
  test('hiển thị khối khi có dữ liệu trong CMS, điều khiển được bằng bàn phím, không tràn ngang ở 375px', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    let previousJourneyContent: Record<string, unknown> | null = null
    const guestContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guestPage = await guestContext.newPage()

    try {
      await bootstrapAdmin(page)

      // 1. Lưu lại cấu hình global habitJourneyContent hiện tại để khôi phục
      const getRes = await page.request.get('/api/globals/habitJourneyContent')
      if (getRes.ok()) {
        previousJourneyContent = await getRes.json()
      }

      // 2. Cập nhật khối onePercent với tiêu đề 2 tầng và 1 fact có nguồn
      const titleLine1 = `Nguyên lý 1% ${randomUUID().slice(0, 4)}`
      const titleLine2 = 'Mỗi ngày tốt hơn một chút'
      const updateRes = await page.request.post('/api/globals/habitJourneyContent', {
        data: {
          ...(previousJourneyContent || {}),
          onePercent: {
            title: `${titleLine1} | ${titleLine2}`,
            dailyPercent: 1,
            maxDays: 365,
            facts: [
              {
                statement: '[MẪU] Số liệu kiểm thử HB-08.',
                sourceLabel: '[MẪU] Nguồn kiểm thử',
                sourceUrl: 'https://example.com/nguon-mau',
              },
            ],
          },
        },
      })
      expect(updateRes.ok()).toBe(true)

      // 3. Khách truy cập vào /habit/5-phut
      await guestPage.goto('/habit/5-phut', { waitUntil: 'domcontentloaded' })

      // Khối Nguyên lý 1% hiển thị trên trang
      const section = guestPage.getByTestId('one-percent-section')
      await expect(section).toBeVisible()

      // Tiêu đề 2 tầng
      await expect(guestPage.getByText(titleLine1)).toBeVisible()
      await expect(guestPage.getByText(titleLine2)).toBeVisible()

      // Dẫn chứng và link nguồn
      await expect(guestPage.getByTestId('one-percent-facts')).toBeVisible()
      const sourceLink = guestPage.getByRole('link', { name: '[MẪU] Nguồn kiểm thử' })
      await expect(sourceLink).toBeVisible()
      expect(await sourceLink.getAttribute('href')).toBe('https://example.com/nguon-mau')

      // Thanh kéo slider
      const slider = guestPage.getByRole('slider')
      await expect(slider).toBeVisible()
      await expect(slider).toHaveAttribute('aria-valuenow', '365')

      // Điều khiển bằng bàn phím (Home -> về 0 ngày)
      await slider.focus()
      await guestPage.keyboard.press('Home')
      await expect(slider).toHaveAttribute('aria-valuenow', '0')

      // Nhấn ArrowRight 10 lần -> tăng lên 10 ngày
      for (let i = 0; i < 10; i++) {
        await guestPage.keyboard.press('ArrowRight')
      }
      await expect(slider).toHaveAttribute('aria-valuenow', '10')

      // 4. Kiểm tra responsive ở viewport mobile 375px không bị tràn ngang
      await guestPage.setViewportSize({ width: 375, height: 667 })
      const hasHorizontalOverflow = await guestPage.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalOverflow).toBe(false)
    } finally {
      // Dọn dẹp: khôi phục nguyên trạng global habitJourneyContent
      // Khôi phục cả khi bản cũ chưa có onePercent (DB trống): ghi rõ onePercent cũ hoặc rỗng,
      // nếu không tiêu đề / số liệu test sẽ còn lại trong global (HB-08c).
      await page.request
        .post('/api/globals/habitJourneyContent', {
          data: {
            ...(previousJourneyContent || {}),
            onePercent: previousJourneyContent?.onePercent ?? { title: '', intro: null, facts: [] },
          },
        })
        .catch(() => {})
      await guestContext.close()
    }
  })
})
