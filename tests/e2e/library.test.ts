import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

// Test E2E Thư viện (T1-09): tự tạo dữ liệu độc lập qua REST, kiểm tra lọc tab/topic và responsive 375px,
// sau đó tự dọn dẹp để không làm bẩn cơ sở dữ liệu.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t1-09-${randomUUID()}@example.test`)
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

test.describe('Thư viện (T1-09): tabs, topics, URL persistence & 375px mobile', () => {
  test('tab=noi-dung&topic=eq shows post, hides product; 375px does not overflow', async ({
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
    let createdProductId: number | undefined
    let createdPostId: number | undefined

    const productSlug = `habit-tracker-test-${randomUUID()}`
    const productName = `Habit Tracker Test ${randomUUID().slice(0, 8)}`
    const postSlug = `eq-article-test-${randomUUID()}`
    const postTitle = `EQ Article Test ${randomUUID().slice(0, 8)}`

    try {
      userId = await bootstrapAdmin(page)

      // 1. Tạo 1 product: digital_tool, web: 'habit' (thuộc tab khóa học, chủ đề habit)
      const productRes = await page.request.post('/api/products', {
        data: {
          name: productName,
          slug: productSlug,
          web: 'habit',
          type: 'digital_tool',
          saleStatus: 'on_sale',
          _status: 'published',
        },
      })
      expect(productRes.ok()).toBe(true)
      createdProductId = (await productRes.json()).doc.id

      // 2. Tạo 1 post: topic 'eq', format 'article' (thuộc tab nội dung, chủ đề eq)
      const postRes = await page.request.post('/api/posts', {
        data: {
          title: postTitle,
          slug: postSlug,
          topic: 'eq',
          format: 'article',
          _status: 'published',
        },
      })
      expect(postRes.ok()).toBe(true)
      createdPostId = (await postRes.json()).doc.id

      // 3. Kiểm tra hiển thị tại desktop 1440px và mobile 375px
      for (const width of [1440, 375]) {
        const ctx = await browser.newContext({
          baseURL: testInfo.project.use.baseURL,
          viewport: { width, height: width === 375 ? 667 : 900 },
        })
        const pub = await ctx.newPage()
        try {
          // Mở URL đã lọc: tab nội dung, chủ đề cảm xúc
          await pub.goto('/thu-vien?tab=noi-dung&topic=eq', { waitUntil: 'domcontentloaded' })

          // Thấy bài viết chủ đề eq
          const postLink = pub.getByRole('link', { name: postTitle }).first()
          await expect(postLink, `bài viết ${postTitle} phải hiển thị tại ${width}px`).toBeVisible()

          // Không thấy sản phẩm khóa học habit tracker
          const productLocator = pub.getByText(productName)
          await expect(
            productLocator,
            `sản phẩm ${productName} không được hiển thị tại ${width}px`,
          ).toHaveCount(0)

          // Tại 375px: kiểm tra không tràn ngang (no horizontal overflow)
          if (width === 375) {
            const bodyScrollWidth = await pub.evaluate(() => document.body.scrollWidth)
            const windowInnerWidth = await pub.evaluate(() => window.innerWidth)
            expect(
              bodyScrollWidth,
              'trang /thu-vien không được tràn ngang ở màn hình 375px',
            ).toBeLessThanOrEqual(windowInnerWidth)
          }
        } finally {
          await ctx.close()
        }
      }
    } finally {
      // Dọn dẹp dữ liệu thử nghiệm
      if (createdProductId) {
        await page.request.delete(`/api/products/${createdProductId}`).catch(() => {})
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
