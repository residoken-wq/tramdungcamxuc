import { randomUUID } from 'node:crypto'
import { expect, test, type Page, type Response } from './fixtures'

/**
 * E2E tests luồng Quiz chẩn đoán thói quen 5 phút (/habit/chan-doan) (T1-14).
 *
 * Lưu ý theo phân công task T1-14: File này được VIẾT theo spec, KHÔNG CHẠY trong môi trường Laptop
 * mà sẽ được Planning / CI kiểm thử tích hợp tự động.
 */

async function bootstrapAdmin(
  page: Page,
): Promise<{ userId: number; email: string; password: string }> {
  const init = await (await page.request.get('/api/users/init')).json()
  const password = randomUUID()
  const email = `admin-t114-${randomUUID()}@example.test`

  if (!init.initialized) {
    await page.goto('/admin/create-first-user', { waitUntil: 'networkidle' })
    await page.locator('#field-email').fill(email)
    await page.locator('#field-password').fill(password)
    await page.locator('#field-confirm-password').fill(password)

    let response: Response | undefined
    await expect(async () => {
      const registration = page.waitForResponse(
        (res) =>
          res.url().includes('/api/users/first-register') && res.request().method() === 'POST',
        { timeout: 5000 },
      )
      await page.locator('button[type="submit"]').click()
      response = await registration
    }).toPass({ timeout: 60000 })

    if (!response) throw new Error('First-user registration request was never sent.')
    expect(response.ok()).toBe(true)
    const userMe = await (await page.request.get('/api/users/me')).json()
    return { userId: userMe.user.id, email, password }
  }

  return { userId: 0, email, password }
}

function createLexicalSuggestion(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              type: 'text',
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              version: 1,
            },
          ],
        },
      ],
    },
  }
}

test.describe('Quiz chẩn đoán thói quen 5 phút (/habit/chan-doan) (T1-14)', () => {
  test('Khách làm quiz 375px: chọn 4 cho Response, nhập email + đồng ý -> hiện kết quả Response & tạo lead diagnostic', async ({
    page,
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(180000)

    const questionIds: number[] = []
    let createdAdminId: number | undefined
    let leadId: number | undefined

    const visitor = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      viewport: { width: 375, height: 667 }, // Mobile-first 375px
    })
    const guest = await visitor.newPage()

    try {
      // 1. Tạo admin tạm để tạo 4 câu hỏi qua REST
      const { userId } = await bootstrapAdmin(page)
      createdAdminId = userId > 0 ? userId : undefined

      const testRunPrefix = randomUUID().slice(0, 6)
      const stages = [
        {
          stage: 'cue',
          statement: `[${testRunPrefix}] Tôi hay quên bắt đầu thói quen`,
          text: 'Gợi ý thiết kế tín hiệu môi trường',
        },
        {
          stage: 'craving',
          statement: `[${testRunPrefix}] Tôi không có động lực để làm`,
          text: 'Gợi ý tạo sức hút nội tại',
        },
        {
          stage: 'response',
          statement: `[${testRunPrefix}] Thói quen này quá khó và tốn sức`,
          text: 'Gợi ý chia nhỏ hành động dưới 2 phút',
        },
        {
          stage: 'reward',
          statement: `[${testRunPrefix}] Tôi không cảm thấy vui sau khi làm`,
          text: 'Gợi ý tự thưởng ngay lập tức',
        },
      ]

      for (let i = 0; i < stages.length; i++) {
        const item = stages[i]
        const res = await page.request.post('/api/diagnosticQuestions', {
          data: {
            statement: item.statement,
            stage: item.stage,
            suggestion: createLexicalSuggestion(item.text),
            order: 1000 + i,
            _status: 'published',
          },
        })
        expect(res.status(), `Tạo câu hỏi ${item.stage} phải thành công`).toBe(201)
        const doc = (await res.json()).doc
        questionIds.push(doc.id)
      }

      // 2. Khách mở trang /habit/chan-doan ở 375px
      await guest.goto('/habit/chan-doan')
      await expect(guest.getByRole('heading', { level: 1 })).toBeVisible()

      // Trả lời các câu hỏi: chọn 1 cho Cue, Craving, Reward; chọn 4 cho Response
      // Dò theo từng câu hỏi trên giao diện
      for (let i = 0; i < 4; i++) {
        const currentStatement = stages[i].statement
        // Chờ câu hỏi xuất hiện
        await expect(guest.getByText(currentStatement)).toBeVisible({ timeout: 15000 })

        if (stages[i].stage === 'response') {
          // Chọn mức 5: Rất thường xuyên
          await guest.getByRole('radio', { name: /Rất thường xuyên/ }).check()
        } else {
          // Chọn mức 1: Không bao giờ
          await guest.getByRole('radio', { name: /Không bao giờ/ }).check()
        }

        // Bấm nút chuyển tiếp
        if (i < 3) {
          await guest.getByRole('button', { name: /Câu tiếp theo/ }).click()
        } else {
          await guest.getByRole('button', { name: /Hoàn thành bài test/ }).click()
        }
      }

      // 3. Khách nhập email + đồng ý tại Email Gate
      await expect(guest.getByText(/Lưu kết quả/i)).toBeVisible({ timeout: 10000 })

      const guestEmail = `mai-quiz-${randomUUID().slice(0, 6)}@example.test`
      await guest.getByLabel(/Địa chỉ email/i).fill(guestEmail)
      await guest.locator('input[type="checkbox"]').check()

      // Chờ token Turnstile (không dùng networkidle)
      await expect(guest.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })

      // Gửi bài test
      await guest.getByRole('button', { name: /Lưu & Xem kết quả phân tích/i }).click()

      // 4. Kiểm tra trang kết quả: Response thắng và hiện gợi ý tương ứng
      await expect(guest.getByText(/Phản hồi \(Response\)/i)).toBeVisible({ timeout: 15000 })
      await expect(guest.getByText('Gợi ý chia nhỏ hành động dưới 2 phút')).toBeVisible()

      // Kiểm tra CTA Growth Mirror xuất hiện
      await expect(guest.getByRole('link', { name: /phiên trải nghiệm 149\.000đ/i })).toBeVisible()

      // 5. Kiểm tra lead được tạo trong database qua API /api/leads
      const leadsRes = await page.request.get(`/api/leads?where[email][equals]=${guestEmail}`)
      expect(leadsRes.ok()).toBe(true)
      const leadJson = await leadsRes.json()
      expect(leadJson.docs).toHaveLength(1)
      const leadDoc = leadJson.docs[0]
      leadId = leadDoc.id
      expect(leadDoc.need).toBe('personal')
      expect(leadDoc.source?.form).toBe('diagnostic')
      expect(leadDoc.interestTags?.some((t: { text: string }) => t.text === 'diagnostic')).toBe(
        true,
      )
      expect(leadDoc.interestTags?.some((t: { text: string }) => t.text === 'stage:response')).toBe(
        true,
      )
    } finally {
      // 6. Dọn dẹp dữ liệu kiểm thử
      await visitor.close()
      for (const qId of questionIds) {
        await page.request.delete(`/api/diagnosticQuestions/${qId}`).catch(() => null)
      }
      if (leadId) {
        await page.request.delete(`/api/leads/${leadId}`).catch(() => null)
      }
      if (createdAdminId) {
        await page.request.delete(`/api/users/${createdAdminId}`).catch(() => null)
      }
    }
  })
})
