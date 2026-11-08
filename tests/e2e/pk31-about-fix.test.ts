import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test, type Page, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'domcontentloaded' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`pk31-${randomUUID()}@example.test`)
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

test.describe('PK-31: Trang "Về Trạm" – Xuống dòng, Subtitle color, HanaStory highlights', () => {
  test('public page renders newlines, card subtitle color, box quote, and responsive highlights with clean a11y', async ({
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
    const slug = `e2e-pk31-${suffix}`
    let pageId: number | undefined

    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const guest = await visitor.newPage()

    const screenshotsDir = path.resolve(process.cwd(), 'docs/screenshots/pk31')
    const captureScreenshots = process.env.PK31_SCREENSHOTS === '1'
    if (captureScreenshots && !fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true })
    }

    try {
      await bootstrapAdmin(page)

      const testPuckData = {
        root: { props: { title: `[MẪU] Về Trạm PK-31 ${suffix}` } },
        content: [
          {
            type: 'VisionMission',
            props: {
              id: 'vm-1',
              titleLine1: 'TẦM NHÌN & SỨ MỆNH',
              cards: [
                {
                  type: 'VisionCard',
                  props: {
                    id: 'vc-1',
                    title: 'TẦM NHÌN',
                    content: 'VỚI CÁ NHÂN\nTrở thành người bạn đồng hành an toàn.',
                  },
                },
              ],
            },
          },
          {
            type: 'IconCardGrid',
            props: {
              id: 'grid-1',
              titleLine1: 'GIÁ TRỊ CỐT LÕI',
              cards: [
                {
                  type: 'Card',
                  props: {
                    id: 'card-gentle',
                    title: 'Gentle',
                    subtitle: 'Dịu dàng & Tinh tế',
                    subtitleColor: 'bright-magenta',
                    text: 'Đồng hành an toàn\nLuôn tôn trọng nhịp điệu của bạn.',
                  },
                },
              ],
            },
          },
          {
            type: 'HanaStory',
            props: {
              id: 'story-1',
              seriesLabel: 'VỀ NGƯỜI ĐỒNG HÀNH',
              titleLine1: 'HÀNH TRÌNH',
              titleLine2: 'THẤU CẢM & CHUYỂN HÓA',
              quoteStyle: 'box',
              quoteLine: 'Cảm xúc là la bàn dẫn đường.',
              storyContent: 'Hành trình bắt đầu từ những chiêm nghiệm sâu sắc.\n\nĐoạn văn tiếp nối giữ nhịp chuyển mình.',
              highlights: [
                { title: 'Quan sát', text: 'Lắng nghe cơ thể và nhịp thở.' },
                { title: 'Thấu hiểu', text: 'Nhận diện cảm xúc thật bên dưới.' },
                { title: 'Vững bước', text: 'Lựa chọn phản ứng phù hợp.' },
              ],
            },
          },
        ],
      }

      // Create and publish page via REST
      const res = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] Về Trạm PK-31 ${suffix}`,
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

      // Test 1: VisionCard has whitespace-pre-line and text with newline
      const visionParagraph = guest.locator('p.whitespace-pre-line').filter({ hasText: 'VỚI CÁ NHÂN' })
      await expect(visionParagraph).toBeVisible()
      const visionText = await visionParagraph.innerText()
      expect(visionText).toContain('VỚI CÁ NHÂN\nTrở thành')

      // Test 2: Card with subtitle and bright-magenta color
      const subtitleEl = guest.getByText('Dịu dàng & Tinh tế')
      await expect(subtitleEl).toBeVisible()
      await expect(subtitleEl).toHaveClass(/text-bright-magenta/)

      // Test 3: HanaStory with quoteStyle: 'box'
      const quoteEl = guest.getByText(/Cảm xúc là la bàn dẫn đường/)
      await expect(quoteEl).toBeVisible()
      const quoteBox = quoteEl.locator('..')
      await expect(quoteBox).toHaveClass(/bg-soft-pink/)

      // Test 4: 3 Highlights on desktop 1440px (1 row)
      const hl1 = guest.getByText('01')
      const hl2 = guest.getByText('02')
      const hl3 = guest.getByText('03')
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

      if (captureScreenshots) {
        await guest.screenshot({ path: path.join(screenshotsDir, '01-about-page-1440.png'), fullPage: true })
      }

      // 2. Mobile 375px
      await guest.setViewportSize({ width: 375, height: 812 })
      await guest.waitForTimeout(200)

      const mbox1 = await hl1.boundingBox()
      const mbox2 = await hl2.boundingBox()
      const mbox3 = await hl3.boundingBox()
      expect(mbox1).not.toBeNull()
      expect(mbox2).not.toBeNull()
      expect(mbox3).not.toBeNull()
      expect((mbox2?.y ?? 0)).toBeGreaterThan((mbox1?.y ?? 0) + 20)
      expect((mbox3?.y ?? 0)).toBeGreaterThan((mbox2?.y ?? 0) + 20)

      if (captureScreenshots) {
        await guest.screenshot({ path: path.join(screenshotsDir, '01-about-page-375.png'), fullPage: true })
      }

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

