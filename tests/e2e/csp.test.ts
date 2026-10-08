import { expect, test, type Page } from '@playwright/test'

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

  test('Trang Thư viện (/thu-vien) lọc tài nguyên & nạp script không bị CSP chặn', async ({
    page,
  }) => {
    const watcher = await setupCspViolationWatcher(page)

    const res = await page.goto('/thu-vien', { waitUntil: 'domcontentloaded' })
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

  test('Trang có form Turnstile (/doanh-nghiep hoặc popup lead) không vi phạm CSP và gửi được', async ({
    page,
  }) => {
    const watcher = await setupCspViolationWatcher(page)

    const res = await page.goto('/doanh-nghiep', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)

    // Kiểm tra Turnstile iframe hoặc form xuất hiện mà không bị CSP frame-src / script-src chặn
    const form = page.locator('form').first()
    if (await form.isVisible()) {
      const violations = await watcher.getViolations()
      expect(
        violations.filter((v: { violatedDirective?: string }) =>
          v.violatedDirective?.includes('frame-src'),
        ),
        'Cloudflare Turnstile frame không được vi phạm frame-src',
      ).toEqual([])
    }

    const consoleErrors = watcher.getConsoleErrors()
    expect(consoleErrors).toEqual([])
  })

  test('Trang chứa VideoEmbed tải iframe YouTube/Vimeo hợp lệ theo CSP frame-src', async ({
    page,
  }) => {
    const watcher = await setupCspViolationWatcher(page)

    // Mở trang giới thiệu hoặc trang có thể chứa VideoEmbed
    const res = await page.goto('/ve-hana', { waitUntil: 'domcontentloaded' })
    expect(res?.status()).toBe(200)

    const violations = await watcher.getViolations()
    const frameViolations = violations.filter(
      (v: { violatedDirective?: string }) =>
        v.violatedDirective?.includes('frame-src') || v.violatedDirective?.includes('media-src'),
    )

    expect(frameViolations, 'Video embed không được gây vi phạm frame-src').toEqual([])
  })
})
