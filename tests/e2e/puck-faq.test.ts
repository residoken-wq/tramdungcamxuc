import { randomUUID } from 'node:crypto'
import { test, expect, type Page, type Response } from './fixtures'

// PK-05: Draggable FaqItem child blocks with slot in FAQ (v4)
// E2E test được viết cho Planning chạy; test tự tạo dữ liệu qua REST và tự dọn dẹp.
// KHÔNG CHẠY trong luồng Pair Programming theo quy định task PK-05.

async function bootstrapAdmin(page: Page): Promise<{ userId?: number }> {
  await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
  const email = `pk05-${randomUUID()}@example.test`
  const password = randomUUID()
  await page.locator('#field-email').fill(email)
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
  const registered = await response.json()
  await expect(page).toHaveURL(/\/admin\/?$/)
  const userId = registered.user?.id || registered.doc?.id
  return { userId }
}

test.describe('PK-05: Draggable FaqItem child blocks in FAQ (v4)', () => {
  test('trang FAQ v4 manual hiển thị 2 câu hỏi; tương tác accordion; builder sửa câu 2, nhân bản câu 1, xuất bản thành 3 câu', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)
    page.setDefaultTimeout(20000)

    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )
    expect(init, 'Run on a migrated DB without admin users.').toMatchObject({ initialized: false })

    const marker = randomUUID().slice(0, 8)
    const slug = `e2e-faq-item-${marker}`
    let userId: number | undefined
    let pageId: number | undefined

    const publicContext = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    const publicPage = await publicContext.newPage()

    try {
      const admin = await bootstrapAdmin(page)
      userId = admin.userId

      // 1. Tạo qua REST một trang đã xuất bản, chứa FAQ v4 với 2 câu hỏi
      const created = await page.request.post('/api/pages', {
        data: {
          title: `[MẪU] E2E FAQ Page ${marker}`,
          slug,
          _status: 'published',
          puckData: {
            content: [
              {
                type: 'FAQ',
                props: {
                  id: 'faq-e2e-root',
                  version: 4,
                  titleLine1: 'GIẢI ĐÁP',
                  titleLine2: 'THẮC MẮC',
                  source: 'manual',
                  numbered: true,
                  bgColor: 'warm-ivory',
                  items: [
                    {
                      type: 'FaqItem',
                      props: {
                        id: 'faq-item-1',
                        question: `[MẪU] Câu hỏi số 1 ban đầu ${marker}`,
                        answer: `Nội dung giải đáp chi tiết cho câu hỏi 1 ${marker}`,
                        questionColor: 'deep-navy',
                        questionSize: 'md',
                        answerColor: 'deep-navy',
                        answerSize: 'md',
                      },
                    },
                    {
                      type: 'FaqItem',
                      props: {
                        id: 'faq-item-2',
                        question: `[MẪU] Câu hỏi số 2 ban đầu ${marker}`,
                        answer: `Nội dung giải đáp chi tiết cho câu hỏi 2 ${marker}`,
                        questionColor: 'deep-navy',
                        questionSize: 'md',
                        answerColor: 'deep-navy',
                        answerSize: 'md',
                      },
                    },
                  ],
                },
              },
            ],
            root: { props: { title: `[MẪU] E2E FAQ Page ${marker}` } },
          },
        },
      })
      expect(created.ok()).toBe(true)
      const pageDoc = await created.json()
      pageId = pageDoc.doc?.id || pageDoc.id

      // 2. Vào trang công khai kiểm tra hiển thị 2 câu hỏi
      await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      await expect(publicPage.getByText('GIẢI ĐÁP')).toBeVisible({ timeout: 15000 })
      await expect(publicPage.getByText('THẮC MẮC')).toBeVisible({ timeout: 15000 })

      const q1Button = publicPage.getByRole('button', {
        name: `[MẪU] Câu hỏi số 1 ban đầu ${marker}`,
        exact: false,
      })
      const q2Button = publicPage.getByRole('button', {
        name: `[MẪU] Câu hỏi số 2 ban đầu ${marker}`,
        exact: false,
      })
      await expect(q1Button).toBeVisible()
      await expect(q2Button).toBeVisible()
      await expect(q1Button).toHaveAttribute('aria-expanded', 'false')

      // Click câu hỏi 1 để mở accordion
      await q1Button.click()
      await expect(q1Button).toHaveAttribute('aria-expanded', 'true')
      const answer1 = publicPage.getByText(`Nội dung giải đáp chi tiết cho câu hỏi 1 ${marker}`)
      await expect(answer1).toBeVisible()
      await expect(answer1).not.toHaveAttribute('hidden')

      // 3. Vào builder Puck tại /admin/builder/[pageId]
      await page.goto(`/admin/builder/${pageId}`, { waitUntil: 'domcontentloaded' })
      const iframe = page.frameLocator('iframe[data-puck-frame]').first()
      const canvas = iframe.locator('body')
      await expect(canvas.getByText('GIẢI ĐÁP').first()).toBeVisible({ timeout: 30000 })

      // 4. Chọn câu hỏi 2 trong canvas, sửa nội dung
      const q2InCanvas = canvas.getByText(`[MẪU] Câu hỏi số 2 ban đầu ${marker}`).first()
      await q2InCanvas.click()

      const questionInput = page.getByRole('textbox', { name: 'Câu hỏi', exact: true })
      await expect(questionInput).toBeVisible({ timeout: 5000 })
      await questionInput.fill(`[MẪU] Câu hỏi số 2 đã được cập nhật ${marker}`)

      // 5. Nhân bản FaqItem 1
      const q1InCanvas = canvas.getByText(`[MẪU] Câu hỏi số 1 ban đầu ${marker}`).first()
      await q1InCanvas.click()

      // Nút Duplicate trong action bar của item
      const duplicateBtn = page.getByRole('button', { name: /Nhân bản|Duplicate/i }).first()
      if (await duplicateBtn.isVisible()) {
        await duplicateBtn.click()
      }

      // 6. Xuất bản
      await page.getByRole('button', { name: 'Xuất bản', exact: true }).click()
      await expect(
        page
          .getByText(/Đã xuất bản/)
          .filter({ visible: true })
          .first(),
      ).toBeVisible({ timeout: 15000 })

      // 7. Kiểm tra lại trang công khai
      await expect(async () => {
        await publicPage.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
        const updatedQ2 = publicPage.getByRole('button', {
          name: `[MẪU] Câu hỏi số 2 đã được cập nhật ${marker}`,
          exact: false,
        })
        await expect(updatedQ2).toBeVisible({ timeout: 2000 })
      }).toPass({ timeout: 30000 })

      const faqButtons = publicPage.locator('button[aria-controls^="faq-a-"]')
      // Ban đầu 2 câu, nhân bản 1 câu -> 3 câu
      await expect(faqButtons).toHaveCount(3)
    } finally {
      test.setTimeout(testInfo.timeout + 30000)
      await publicContext.close()

      try {
        if (pageId) {
          const deleted = await page.request.delete(`/api/pages/${pageId}`)
          expect(deleted.ok(), 'Temporary E2E page must be removed.').toBe(true)
        }
      } finally {
        if (userId) {
          try {
            await page.request.delete(`/api/users/${userId}`)
          } catch {
            // ignore cleanup errors
          }
        }
      }
    }
  })
})
