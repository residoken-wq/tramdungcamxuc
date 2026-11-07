import { randomUUID } from 'node:crypto'
import { test, expect, type Response } from './fixtures'
import { expectNoSeriousA11y } from './helpers/a11y'

test.describe('PK-25: HeroImage side layout E2E', () => {
  test('renders 2-column side layout at 1440 (image to the right of title) and stacked at 375 (image below text) with no horizontal scroll and clean axe', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Runs on desktop-1440 project.')
    test.setTimeout(180000)
    page.setDefaultTimeout(30000)

    const email = `pk25-${randomUUID()}@example.test`
    const password = randomUUID()
    const slug = `e2e-hero-side-${randomUUID().slice(0, 8)}`
    const mediaAlt = `[MẪU] Ảnh đại diện Hero Side E2E - ${randomUUID().slice(0, 8)}`

    let userId: number | undefined
    let pageId: number | undefined
    let mediaId: string | number | undefined

    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    )

    try {
      // 1. Admin setup (or use existing session if initialized)
      const init = await page.request.get('/api/users/init')
      expect(init.ok()).toBe(true)
      const initData = await init.json()

      if (!initData.initialized) {
        await page.goto('/admin/create-first-user')
        await page.locator('#field-email').fill(email)
        await page.locator('#field-password').fill(password)
        await page.locator('#field-confirm-password').fill(password)

        let regResponse: Response | undefined
        await expect(async () => {
          const registration = page.waitForResponse(
            (res) =>
              res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
            { timeout: 5000 },
          )
          await page.locator('button[type="submit"]').click()
          regResponse = await registration
        }).toPass({ timeout: 60000 })

        if (!regResponse) throw new Error('First-user registration request was never sent.')
        expect(regResponse.ok()).toBe(true)
        const registered = await regResponse.json()
        userId = registered.user?.id || registered.doc?.id
        await expect(page).toHaveURL(/\/admin\/?$/)
      } else {
        test.skip(!process.env.CI, 'Dev DB already initialized with admin; skip first-user flow.')
      }

      if (!userId) {
        const meRes = await page.request.get('/api/users/me')
        if (meRes.ok()) {
          const meData = await meRes.json()
          userId = meData.user?.id
        }
      }

      // 2. Upload sample media
      const uploadRes = await page.request.post('/api/media', {
        multipart: {
          _payload: JSON.stringify({ alt: mediaAlt }),
          file: {
            name: `pk25-sample-${randomUUID().slice(0, 8)}.png`,
            mimeType: 'image/png',
            buffer: pngBuffer,
          },
        },
      })
      expect(uploadRes.ok()).toBe(true)
      const uploadData = await uploadRes.json()
      mediaId = uploadData.doc?.id || uploadData.id
      const mediaUrl = uploadData.doc?.url || uploadData.url || ''
      expect(mediaId).toBeDefined()

      // 3. Create published page with HeroImage in side layout
      const createPage = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E Hero Side ${slug}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'HeroImage',
                props: {
                  id: 'hero-side-e2e',
                  version: 3,
                  layout: 'side',
                  imageSide: 'right',
                  titleLine1: '[MẪU] TIÊU ĐỀ KHAI VẤN',
                  titleLine2: 'CHUYỂN MÌNH BỀN VỮNG',
                  emotionLine: '[MẪU] Dòng cảm xúc chạm tới trái tim người học',
                  mediaId: String(mediaId),
                  imageUrl: mediaUrl,
                  imageAlt: mediaAlt,
                  buttonText: 'Bắt đầu ngay',
                  buttonLink: '#explore',
                  badges: [{ text: '[MẪU] Bảo mật tuyệt đối' }],
                  stats: [{ value: '[MẪU] 500+', label: 'Giờ khai vấn' }],
                  bgColor: 'warm-ivory',
                  padding: 'md',
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E Hero Side ${slug}` } },
          },
        },
      })
      expect(createPage.ok()).toBe(true)
      const pageData = await createPage.json()
      pageId = pageData.doc?.id || pageData.id
      expect(pageId).toBeDefined()

      // 4. Test at desktop-1440
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })

      const heading = page.locator('h1').first()
      const heroImage = page.locator(`img[alt="${mediaAlt}"]`).first()

      await expect(heading).toBeVisible()
      await expect(heroImage).toBeVisible()

      const titleBox1440 = await heading.boundingBox()
      const imgBox1440 = await heroImage.boundingBox()

      expect(titleBox1440).not.toBeNull()
      expect(imgBox1440).not.toBeNull()

      // On desktop: image is positioned to the right of the title
      expect(imgBox1440!.x).toBeGreaterThan(titleBox1440!.x + titleBox1440!.width - 1)
      // Top of image is not lower than bottom of title/text block (they align on the same vertical band)
      expect(imgBox1440!.y).toBeLessThan(titleBox1440!.y + titleBox1440!.height)

      // 5. Test at mobile-375
      await page.setViewportSize({ width: 375, height: 812 })
      await page.waitForTimeout(300)

      const titleBox375 = await heading.boundingBox()
      const imgBox375 = await heroImage.boundingBox()

      expect(titleBox375).not.toBeNull()
      expect(imgBox375).not.toBeNull()

      // On mobile: image is stacked below the title/text block
      expect(imgBox375!.y).toBeGreaterThan(titleBox375!.y + titleBox375!.height - 1)

      // No horizontal scrolling at 375
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)

      // 6. Axe accessibility check on the hero section
      await expectNoSeriousA11y(page, 'HeroImage Side Layout', {
        include: ['section.group\\/heroimg'],
      })
    } finally {
      // Clean up test data
      if (pageId) {
        await page.request.delete(`/api/pages/${pageId}`).catch(() => {})
      }
      if (mediaId) {
        await page.request.delete(`/api/media/${mediaId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
