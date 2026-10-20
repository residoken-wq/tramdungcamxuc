import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from './fixtures'

/**
 * E2E tests kiểm tra Content-Security-Policy (CSP) khi kích hoạt chặn thật (CSP_ENFORCE=true).
 *
 * Lưu ý theo phân công task T1-15b: File này được VIẾT theo spec, KHÔNG CHẠY trong môi trường Laptop
 * mà sẽ được Planning / CI kiểm thử tích hợp tự động với CSP_ENFORCE=true.
 */

interface CspViolationRecord {
  blockedURI?: string
  violatedDirective?: string
  originalPolicy?: string
}

// Helper thiết lập lắng nghe vi phạm CSP và console errors trên page
async function setupCspViolationWatcher(page: Page) {
  const violations: CspViolationRecord[] = []

  const consoleErrors: string[] = []

  await page.addInitScript(() => {
    ;(window as unknown as { __cspViolations: CspViolationRecord[] }).__cspViolations = []
    window.addEventListener('securitypolicyviolation', (e) => {
      ;(window as unknown as { __cspViolations: CspViolationRecord[] }).__cspViolations.push({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
      })
    })
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (
        text.toLowerCase().includes('refused to') ||
        text.toLowerCase().includes('violates the following content security policy directive')
      ) {
        consoleErrors.push(text)
      }
    }
  })

  return {
    async getViolations(): Promise<CspViolationRecord[]> {
      const clientViolations = await page.evaluate<CspViolationRecord[]>(() => {
        return (
          (window as unknown as { __cspViolations?: CspViolationRecord[] }).__cspViolations || []
        )
      })
      return [...violations, ...clientViolations]
    },
    getConsoleErrors() {
      return consoleErrors
    },
  }
}

test.describe('Content Security Policy Enforced Tests (CSP_ENFORCE=true)', () => {
  test('Phản hồi các trang công khai chứa header Content-Security-Policy chặn thật', async ({
    request,
  }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)

    const headers = res.headers()
    const csp = headers['content-security-policy'] || headers['content-security-policy-report-only']
    expect(csp, 'Trang phải có CSP header').toBeDefined()
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('https://challenges.cloudflare.com')
    expect(csp).toContain('https://plausible.io')
  })

  test('Trang chủ (/) tải hoàn chỉnh, không phát sinh vi phạm CSP hay console refused errors', async ({
    page,
  }) => {
    const watcher = await setupCspViolationWatcher(page)

    const res = await page.goto('/', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)

    // Đợi hydration hoàn tất
    await page.waitForLoadState('load')

    const violations = await watcher.getViolations()
    const consoleErrors = watcher.getConsoleErrors()

    expect(violations, 'Không được có sự kiện securitypolicyviolation trên trang chủ').toEqual([])
    expect(consoleErrors, 'Console không được có lỗi CSP Refused to').toEqual([])
  })

  test('Trang Tài nguyên (/tai-nguyen) lọc tài nguyên & nạp script không bị CSP chặn', async ({
    page,
  }) => {
    const watcher = await setupCspViolationWatcher(page)

    const res = await page.goto('/tai-nguyen', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)
    await page.waitForLoadState('load')

    // Thử bấm chuyển tab hoặc lọc tài nguyên (kích hoạt track analytics)
    const tabButton = page.locator('button, [role="tab"]').first()
    if (await tabButton.isVisible()) {
      await tabButton.click()
    }

    const violations = await watcher.getViolations()
    const consoleErrors = watcher.getConsoleErrors()

    expect(violations, 'Không được có vi phạm CSP khi lọc thư viện').toEqual([])
    expect(consoleErrors, 'Không có console error CSP refused to').toEqual([])
  })

  test('Trang có form Turnstile và video YouTube không vi phạm CSP', async ({
    page,
    browser,
  }, testInfo) => {
    // Builds its own page so it runs on an empty CI database. Violations fire for both
    // Content-Security-Policy and Content-Security-Policy-Report-Only.
    test.skip(testInfo.project.name !== 'desktop-1440', 'Bootstrap runs once per database.')
    test.setTimeout(120000)
    const init = await (await page.request.get('/api/users/init')).json()
    test.skip(
      !process.env.CI && init.initialized === true,
      'DB dev đã có quản trị viên; bỏ qua luồng tạo tài khoản đầu tiên.',
    )

    const password = randomUUID()
    const reg = await page.request.post('/api/users/first-register', {
      data: { email: `csp-${randomUUID()}@example.test`, password, confirmPassword: password },
    })
    expect(reg.ok(), await reg.text()).toBe(true)
    const userId: number = (await reg.json()).user.id
    let pageId: number | undefined
    const visitor = await browser.newContext({ baseURL: testInfo.project.use.baseURL })
    try {
      const slug = `csp-${randomUUID().slice(0, 8)}`
      const created = await page.request.post('/api/pages', {
        data: {
          title: 'CSP',
          slug,
          _status: 'published',
          puckData: {
            root: { props: {} },
            content: [
              { type: 'B2BBriefForm', props: { id: 'csp-form', version: 1, title: 'Brief' } },
              {
                type: 'VideoEmbed',
                props: {
                  id: 'csp-video',
                  version: 1,
                  url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
                },
              },
            ],
          },
        },
      })
      expect(created.status(), await created.text()).toBe(201)
      pageId = (await created.json()).doc.id

      const guest = await visitor.newPage()
      const watcher = await setupCspViolationWatcher(guest)
      const res = await guest.goto(`/${slug}`, { waitUntil: 'domcontentloaded' })
      expect(res?.status()).toBe(200)
      await expect(guest.locator('#gui-brief')).toBeVisible()
      await expect(guest.locator('iframe[src*="youtube-nocookie.com"]')).toHaveCount(1)
      // Turnstile token proves the Cloudflare script and iframe were allowed.
      await expect(guest.locator('input[name="cf-turnstile-response"]')).not.toHaveValue('', {
        timeout: 20000,
      })
      await guest.waitForTimeout(1500)
      expect(await watcher.getViolations(), 'Không được có vi phạm CSP').toEqual([])
      expect(watcher.getConsoleErrors()).toEqual([])
    } finally {
      await visitor.close()
      if (pageId) await page.request.delete(`/api/pages/${pageId}`)
      await page.request.delete(`/api/users/${userId}`)
    }
  })
})
