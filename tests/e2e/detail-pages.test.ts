import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from '@playwright/test'

// Test E2E Các trang con dữ liệu (T1-10): coaching, doanh nghiệp, blog.
// Tự tạo dữ liệu độc lập qua REST (admin, service + testimonials consent, program, post),
// kiểm tra desktop 1440px và mobile 375px không tràn ngang, kiểm tra ẩn testimonial chưa đồng ý,
// kiểm tra slug không tồn tại chuyển 404 có nút về trang chủ, sau đó dọn dẹp DB.

async function bootstrapAdmin(page: Page): Promise<number> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const password = randomUUID()
  await page.locator('#field-email').fill(`t1-10-${randomUUID()}@example.test`)
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

test.describe('Trang con dữ liệu (T1-10): coaching, doanh nghiệp, blog & 404', () => {
  test('hiển thị đúng chi tiết, ẩn testimonial chưa đồng ý, 404 khi slug lạ, không tràn ngang ở 375px', async ({
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
    let createdServiceId: number | undefined
    let createdProgramId: number | undefined
    let createdPostId: number | undefined
    let createdConsentTestimonialId: number | undefined
    let createdUnconsentedTestimonialId: number | undefined

    const suffix = randomUUID().slice(0, 8)
    const serviceSlug = `coaching-test-${suffix}`
    const serviceName = `Dịch Vụ Coaching Test ${suffix}`
    const programSlug = `doanh-nghiep-test-${suffix}`
    const programName = `Chương Trình Doanh Nghiệp ${suffix}`
    const postSlug = `bai-viet-test-${suffix}`
    const postTitle = `Bài Viết Chia Sẻ ${suffix}`
    const consentedQuote = `Lời chia sẻ đã đồng ý hiển thị ${suffix}`
    const unconsentedQuote = `Lời chia sẻ bí mật chưa đồng ý ${suffix}`

    try {
      userId = await bootstrapAdmin(page)

      // 1. Tạo 2 lời chia sẻ: 1 có consent = true (published) + 1 có consent = false (draft)
      const t1Res = await page.request.post('/api/testimonials', {
        data: {
          name: `Người chia sẻ A ${suffix}`,
          role: 'Trưởng phòng Nhân sự',
          quote: consentedQuote,
          consent: true,
          _status: 'published',
        },
      })
      expect(t1Res.ok()).toBe(true)
      createdConsentTestimonialId = (await t1Res.json()).doc.id

      const t2Res = await page.request.post('/api/testimonials', {
        data: {
          name: `Người chia sẻ B ${suffix}`,
          role: 'Khách hàng ẩn danh',
          quote: unconsentedQuote,
          consent: false,
          _status: 'draft',
        },
      })
      expect(t2Res.ok()).toBe(true)
      createdUnconsentedTestimonialId = (await t2Res.json()).doc.id

      // 2. Tạo 1 service liên kết cả 2 testimonials
      const serviceRes = await page.request.post('/api/services', {
        data: {
          name: serviceName,
          slug: serviceSlug,
          audience: 'Chuyên viên mong muốn phát triển sự nghiệp',
          situations: [{ text: 'Đang cảm thấy chênh vênh' }],
          outcomes: [{ text: 'Xác định rõ hướng đi tiếp theo' }],
          process: [{ text: 'Bước 1: Lắng nghe và thấu hiểu' }],
          duration: '60 phút / phiên',
          format: 'Trực tuyến qua Zoom',
          priceMode: 'quote',
          testimonials: [createdConsentTestimonialId, createdUnconsentedTestimonialId],
          saleStatus: 'consult',
          _status: 'published',
        },
      })
      expect(serviceRes.ok()).toBe(true)
      createdServiceId = (await serviceRes.json()).doc.id

      // 3. Tạo 1 program doanh nghiệp
      const programRes = await page.request.post('/api/programs', {
        data: {
          name: programName,
          slug: programSlug,
          learnerGroup: 'Quản lý cấp trung và trưởng nhóm',
          targetBehaviors: [{ text: 'Phản hồi mang tính xây dựng' }],
          format: 'Đào tạo trực tiếp 2 ngày',
          duration: '16 giờ học',
          deliverables: [{ text: 'Bộ cẩm nang thực hành' }],
          followUp: 'Hỗ trợ đồng hành 30 ngày',
          measurement: 'Đánh giá trước và sau chương trình',
          saleStatus: 'consult',
          _status: 'published',
        },
      })
      expect(programRes.ok()).toBe(true)
      createdProgramId = (await programRes.json()).doc.id

      // 4. Tạo 1 post bài viết
      const postRes = await page.request.post('/api/posts', {
        data: {
          title: postTitle,
          slug: postSlug,
          series: 'Đọc sách cùng bạn',
          topic: 'eq',
          format: 'article',
          _status: 'published',
        },
      })
      expect(postRes.ok()).toBe(true)
      createdPostId = (await postRes.json()).doc.id

      // 5. Kiểm tra hiển thị tại desktop 1440px và mobile 375px
      for (const width of [1440, 375]) {
        const ctx = await browser.newContext({
          baseURL: testInfo.project.use.baseURL,
          viewport: { width, height: width === 375 ? 667 : 900 },
        })
        const pub = await ctx.newPage()
        try {
          // 5.1 Kiểm tra trang Coaching
          await pub.goto(`/coaching/${serviceSlug}`, { waitUntil: 'domcontentloaded' })
          const serviceHeading = pub
            .getByRole('heading', { name: serviceName })
            .filter({ visible: true })
            .first()
          await expect(
            serviceHeading,
            `tiêu đề coaching ${serviceName} phải hiển thị tại ${width}px`,
          ).toBeVisible()

          // Thấy testimonial đã đồng ý
          const consentedQuoteLoc = pub.getByText(consentedQuote).filter({ visible: true }).first()
          await expect(consentedQuoteLoc, `lời chia sẻ đã đồng ý phải hiển thị`).toBeVisible()

          // Tuyệt đối KHÔNG thấy testimonial chưa đồng ý
          const unconsentedQuoteLoc = pub.getByText(unconsentedQuote)
          await expect(
            unconsentedQuoteLoc,
            `lời chia sẻ chưa đồng ý không được hiển thị`,
          ).toHaveCount(0)

          // 5.2 Kiểm tra trang Doanh nghiệp
          await pub.goto(`/doanh-nghiep/${programSlug}`, { waitUntil: 'domcontentloaded' })
          const programHeading = pub
            .getByRole('heading', { name: programName })
            .filter({ visible: true })
            .first()
          await expect(
            programHeading,
            `tiêu đề chương trình ${programName} phải hiển thị tại ${width}px`,
          ).toBeVisible()

          // 5.3 Kiểm tra trang Blog
          await pub.goto(`/blog/${postSlug}`, { waitUntil: 'domcontentloaded' })
          const postHeading = pub
            .getByRole('heading', { name: postTitle })
            .filter({ visible: true })
            .first()
          await expect(
            postHeading,
            `tiêu đề bài viết ${postTitle} phải hiển thị tại ${width}px`,
          ).toBeVisible()

          // 5.4 Kiểm tra trang 404 thương hiệu khi slug lạ không tồn tại
          const invalidSlug = `slug-khong-ton-tai-${randomUUID().slice(0, 8)}`
          await pub.goto(`/coaching/${invalidSlug}`, { waitUntil: 'domcontentloaded' })
          const notFoundHeading = pub
            .getByRole('heading', { name: 'Không tìm thấy trang' })
            .filter({ visible: true })
            .first()
          await expect(notFoundHeading, `trang 404 phải hiển thị tiêu đề thương hiệu`).toBeVisible()

          const homeButton = pub
            .getByRole('link', { name: 'Về trang chủ' })
            .filter({ visible: true })
            .first()
          await expect(homeButton, `trang 404 phải có nút Về trang chủ`).toBeVisible()

          // Kiểm tra không tràn ngang ở 375px
          if (width === 375) {
            const bodyScrollWidth = await pub.evaluate(() => document.body.scrollWidth)
            const windowInnerWidth = await pub.evaluate(() => window.innerWidth)
            expect(
              bodyScrollWidth,
              'trang con không được tràn ngang ở màn hình 375px',
            ).toBeLessThanOrEqual(windowInnerWidth)
          }
        } finally {
          await ctx.close()
        }
      }
    } finally {
      // Dọn dẹp dữ liệu thử nghiệm
      if (createdServiceId) {
        await page.request.delete(`/api/services/${createdServiceId}`).catch(() => {})
      }
      if (createdProgramId) {
        await page.request.delete(`/api/programs/${createdProgramId}`).catch(() => {})
      }
      if (createdPostId) {
        await page.request.delete(`/api/posts/${createdPostId}`).catch(() => {})
      }
      if (createdConsentTestimonialId) {
        await page.request
          .delete(`/api/testimonials/${createdConsentTestimonialId}`)
          .catch(() => {})
      }
      if (createdUnconsentedTestimonialId) {
        await page.request
          .delete(`/api/testimonials/${createdUnconsentedTestimonialId}`)
          .catch(() => {})
      }
      if (userId) {
        await page.request.delete(`/api/users/${userId}`).catch(() => {})
      }
    }
  })
})
