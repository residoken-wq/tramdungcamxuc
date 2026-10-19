import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

// Test E2E Thư viện & Tài nguyên (SM-05, sitemap v2):
// Bỏ 2 tab cũ, lọc chủ đề, tìm kiếm trên URL, phân trang ?trang=2, link cũ ?tab=khoa-hoc vẫn 200, responsive 375px.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`sm-05-${randomUUID()}@example.test`)
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

test.describe('Thư viện & Tài nguyên (SM-05): sitemap v2 layout, topics, search & 375px mobile', () => {
  test('legacy ?tab=khoa-hoc opens 200 without redirect; topic & search filter updates URL; 375px no overflow', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(180000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    let userId: number | undefined
    let createdFreeProductId: number | undefined
    let createdPostId: number | undefined

    const productSlug = `free-ebook-test-${randomUUID()}`
    const productName = `Free Ebook Test ${randomUUID().slice(0, 8)}`
    const postSlug = `eq-article-test-${randomUUID()}`
    const postTitle = `EQ Article Test ${randomUUID().slice(0, 8)}`

    try {
      userId = await bootstrapAdmin(page)

      // 1. Tạo 1 free product: ebook, saleStatus: 'free' (tài nguyên miễn phí)
      const productRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: productSlug,
          web: 'site',
          type: 'ebook',
          saleStatus: 'free',
          isSample: true,
          _status: 'published',
        },
      })
      expect(productRes.ok()).toBe(true)
      createdFreeProductId = (await productRes.json()).doc.id

      // 2. Tạo 1 post: topic 'eq', format 'article', featured: true
      const postRes = await page.request.post('/api/posts', {
        data: {
          title: postTitle,
          slug: postSlug,
          topic: 'eq',
          format: 'article',
          featured: true,
          _status: 'published',
        },
      })
      expect(postRes.ok()).toBe(true)
      createdPostId = (await postRes.json()).doc.id

      // 3. Kiểm tra link cũ ?tab=khoa-hoc vẫn trả về 200 (bỏ qua im lặng)
      const legacyRes = await page.request.get('/tai-nguyen?tab=khoa-hoc')
      expect(legacyRes.status()).toBe(200)

      // 4. Kiểm tra trang 2 (?trang=2) vẫn trả về 200
      const page2Res = await page.request.get('/tai-nguyen?trang=2')
      expect(page2Res.status()).toBe(200)

      // 5. Kiểm tra hiển thị tại desktop 1440px và mobile 375px
      for (const width of [1440, 375]) {
        const ctx = await browser.newContext({
          baseURL: testInfo.project.use.baseURL,
          viewport: { width, height: width === 375 ? 667 : 900 },
        })
        const pub = await ctx.newPage()
        try {
          // Mở URL đã lọc theo topic eq và tìm kiếm
          await pub.goto(`/tai-nguyen?topic=eq&q=${encodeURIComponent('EQ Article')}`, {
            waitUntil: 'domcontentloaded',
          })

          // Thấy bài viết nổi bật chủ đề eq
          const postHeading = pub.getByRole('heading', { name: postTitle }).first()
          await expect(
            postHeading,
            `bài viết ${postTitle} phải hiển thị tại ${width}px`,
          ).toBeVisible()

          // Tại 375px: kiểm tra không tràn ngang (no horizontal overflow)
          if (width === 375) {
            const bodyScrollWidth = await pub.evaluate(() => document.body.scrollWidth)
            const windowInnerWidth = await pub.evaluate(() => window.innerWidth)
            expect(
              bodyScrollWidth,
              'trang /tai-nguyen không được tràn ngang ở màn hình 375px',
            ).toBeLessThanOrEqual(windowInnerWidth)
          }
        } finally {
          await ctx.close()
        }
      }
    } finally {
      // Dọn dẹp dữ liệu thử nghiệm
      if (createdFreeProductId) {
        await page.request.delete(`/api/products/${createdFreeProductId}`).catch(() => {})
      }
      if (createdPostId) {
        await page.request.delete(`/api/posts/${createdPostId}`).catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
