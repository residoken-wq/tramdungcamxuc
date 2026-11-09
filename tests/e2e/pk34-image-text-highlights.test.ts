import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk34-${randomUUID()}@example.test`)
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

test.describe('PK-34: ImageText – Thẻ đánh số + Trích dẫn dạng hộp', () => {
  test('public page renders box quote above paragraphs and responsive highlights with clean a11y', async ({
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
    const slug = `e2e-pk34-${suffix}`
    let pageId: number | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    try {
      await bootstrapAdmin(page)

      const testPuckData = {
        root: { props: { title: `[MẪU] ImageText PK-34 ${suffix}` } },
        content: [
          {
            type: 'ImageText',
            props: {
              version: 2,
              id: 'it-pk34',
              seriesLabel: 'VỀ TRẠM DỪNG',
              titleLine1: 'TẠI SAO LẠI LÀ',
              titleLine2: 'TRẠM DỪNG CẢM XÚC?',
              // QA PK-34: real ImageText props (layout / content / buttonLink), no real person's photo.
              layout: 'image-left',
              imageAlt: '[MẪU] Ảnh minh họa',
              imageBadge: 'Không gian an toàn',
              bgColor: 'warm-ivory',
              quote: 'Trạm dừng không phải để bỏ cuộc, mà để bạn gom góp lại sức mạnh.',
              quoteStyle: 'box',
              content:
                'Cuộc sống bận rộn cuốn chúng ta vào những guồng quay không ngừng nghỉ.\n\nTại Trạm, bạn được thả lỏng và tìm lại sự cân bằng từ sâu bên trong.',
              highlights: [
                {
                  title: 'Điểm dừng an toàn',
                  text: 'Nơi bạn được lắng nghe trọn vẹn mà không bị phán xét.',
                },
                {
                  title: 'Nhận diện cảm xúc',
                  text: 'Gọi tên cảm xúc thật, mở khóa những tầng sâu kín.',
                },
                {
                  title: 'Hành động nhỏ bền bỉ',
                  text: 'Từng bước chuyển hóa thói quen để sống bình an mỗi ngày.',
                },
              ],
              buttonText: 'Khám phá hành trình',
              buttonLink: '/habit',
            },
          },
        ],
      }

      // Create and publish page via REST
      const res = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] ImageText PK-34 ${suffix}`,
          slug,
          _status: 'published',
          puckData: testPuckData,
        },
      })

      expect(res.ok(), await res.text()).toBe(true)
      pageId = (await res.json()).doc.id

      // 1. Desktop 1440px
      await guest.setViewportSize({ width: 1440, height: 900 })
      const navRes = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(navRes?.status()).toBe(200)

      // Test 1: Box quote rendered in soft-pink container
      const quoteEl = guest.getByText(/Trạm dừng không phải để bỏ cuộc/)
      await expect(quoteEl).toBeVisible()
      const quoteBox = quoteEl.locator('..')
      await expect(quoteBox).toHaveClass(/bg-soft-pink/)

      // Verify box quote is positioned above paragraphs
      const paragraphEl = guest.getByText(/Cuộc sống bận rộn cuốn chúng ta/)
      await expect(paragraphEl).toBeVisible()
      const qBox = await quoteBox.boundingBox()
      const pBox = await paragraphEl.boundingBox()
      expect(qBox).not.toBeNull()
      expect(pBox).not.toBeNull()
      expect(qBox?.y ?? 0).toBeLessThan(pBox?.y ?? 0)

      // Test 2: 3 Highlights on desktop 1440px (1 row)
      const hl1 = guest.getByText('Điểm dừng an toàn', { exact: true })
      const hl2 = guest.getByText('Nhận diện cảm xúc', { exact: true })
      const hl3 = guest.getByText('Hành động nhỏ bền bỉ', { exact: true })
      await expect(hl1).toBeVisible()
      await expect(hl2).toBeVisible()
      await expect(hl3).toBeVisible()

      const box1 = await hl1.boundingBox()
      const box2 = await hl2.boundingBox()
      const box3 = await hl3.boundingBox()
      expect(box1).not.toBeNull()
      expect(box2).not.toBeNull()
      expect(box3).not.toBeNull()
      expect(Math.abs((box1?.y ?? 0) - (box2?.y ?? 0))).toBeLessThan(15)
      expect(Math.abs((box1?.y ?? 0) - (box3?.y ?? 0))).toBeLessThan(15)

      // 2. Mobile 375px
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.waitForTimeout(200)

      const mbox1 = await hl1.boundingBox()
      const mbox2 = await hl2.boundingBox()
      const mbox3 = await hl3.boundingBox()
      expect(mbox1).not.toBeNull()
      expect(mbox2).not.toBeNull()
      expect(mbox3).not.toBeNull()
      expect(mbox2?.y ?? 0).toBeGreaterThan((mbox1?.y ?? 0) + 20)
      expect(mbox3?.y ?? 0).toBeGreaterThan((mbox2?.y ?? 0) + 20)

      // 3. Accessibility check
      await expectNoSeriousA11y(guest)
    } finally {
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      await guest.close()
      await visitor.close()
    }
  })
})
