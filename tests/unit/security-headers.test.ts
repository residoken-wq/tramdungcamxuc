import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import {
  isSecurityHeadersExempt,
  isPuckEmbeddable,
  getSecurityHeaders,
  buildCspDirective,
  applySecurityHeaders,
} from '@/lib/security-headers'
import { proxy } from '@/proxy'

describe('Security Headers', () => {
  describe('isSecurityHeadersExempt', () => {
    it('exempts /admin, /builder, /api and their subpaths', () => {
      expect(isSecurityHeadersExempt('/admin')).toBe(true)
      expect(isSecurityHeadersExempt('/admin/collections/pages')).toBe(true)
      expect(isSecurityHeadersExempt('/builder')).toBe(true)
      expect(isSecurityHeadersExempt('/builder/123')).toBe(true)
      expect(isSecurityHeadersExempt('/api')).toBe(true)
      expect(isSecurityHeadersExempt('/api/leads')).toBe(true)
    })

    it('does not exempt public routes', () => {
      expect(isSecurityHeadersExempt('/')).toBe(false)
      expect(isSecurityHeadersExempt('/thu-vien')).toBe(false)
      expect(isSecurityHeadersExempt('/coaching/growth-mirror')).toBe(false)
      expect(isSecurityHeadersExempt('/tai-khoan')).toBe(false)
    })
  })

  describe('isPuckEmbeddable', () => {
    it('returns true for public marketing and content routes', () => {
      expect(isPuckEmbeddable('/')).toBe(true)
      expect(isPuckEmbeddable('/thu-vien')).toBe(true)
      expect(isPuckEmbeddable('/coaching/growth-mirror')).toBe(true)
    })

    it('returns false for exempt routes and account routes', () => {
      expect(isPuckEmbeddable('/admin')).toBe(false)
      expect(isPuckEmbeddable('/builder')).toBe(false)
      expect(isPuckEmbeddable('/api')).toBe(false)
      expect(isPuckEmbeddable('/tai-khoan')).toBe(false)
    })
  })

  describe('getSecurityHeaders', () => {
    it('returns no headers for exempt routes', () => {
      expect(getSecurityHeaders('/admin')).toEqual({})
      expect(getSecurityHeaders('/admin/login')).toEqual({})
      expect(getSecurityHeaders('/builder/page-1')).toEqual({})
      expect(getSecurityHeaders('/api/graphql')).toEqual({})
    })

    it('returns expected security headers for public routes in non-production', () => {
      const headers = getSecurityHeaders('/', { isProduction: false })

      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()')
      expect(headers['Content-Security-Policy-Report-Only']).toBeDefined()
      expect(headers['Content-Security-Policy-Report-Only']).toContain("default-src 'self'")
      expect(headers['Content-Security-Policy-Report-Only']).toContain("frame-ancestors 'self'")
      expect(headers['Content-Security-Policy-Report-Only']).toContain(
        'https://challenges.cloudflare.com',
      )
      expect(headers['Content-Security-Policy-Report-Only']).toContain('https://plausible.io')
      expect(headers['Content-Security-Policy-Report-Only']).toContain(
        'https://iframe.mediadelivery.net',
      )

      // In development / non-production, HSTS is omitted
      expect(headers['Strict-Transport-Security']).toBeUndefined()

      // Public site route embeddable by Puck omits X-Frame-Options: DENY
      expect(headers['X-Frame-Options']).toBeUndefined()
    })

    it('enforces CSP when isEnforce option is true', () => {
      const headers = getSecurityHeaders('/', { isEnforce: true, isProduction: false })
      expect(headers['Content-Security-Policy']).toBeDefined()
      expect(headers['Content-Security-Policy-Report-Only']).toBeUndefined()
      expect(headers['Content-Security-Policy']).toContain('https://plausible.io')
    })

    it('enforces CSP when CSP_ENFORCE env is "true"', () => {
      const originalEnv = process.env.CSP_ENFORCE
      try {
        process.env.CSP_ENFORCE = 'true'
        const headers = getSecurityHeaders('/', { isProduction: false })
        expect(headers['Content-Security-Policy']).toBeDefined()
        expect(headers['Content-Security-Policy-Report-Only']).toBeUndefined()
      } finally {
        process.env.CSP_ENFORCE = originalEnv
      }
    })

    it('uses report-only CSP when CSP_ENFORCE is false or unset', () => {
      const originalEnv = process.env.CSP_ENFORCE
      try {
        delete process.env.CSP_ENFORCE
        const headers = getSecurityHeaders('/', { isProduction: false })
        expect(headers['Content-Security-Policy-Report-Only']).toBeDefined()
        expect(headers['Content-Security-Policy']).toBeUndefined()
      } finally {
        process.env.CSP_ENFORCE = originalEnv
      }
    })

    it('includes Strict-Transport-Security in production', () => {
      const headers = getSecurityHeaders('/', { isProduction: true })
      expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains')
    })

    it('applies X-Frame-Options: DENY for non-embeddable public routes', () => {
      const headers = getSecurityHeaders('/tai-khoan', { isProduction: false })
      expect(headers['X-Frame-Options']).toBe('DENY')
    })

    it('incorporates S3 public storage origin into CSP directives', () => {
      const csp = buildCspDirective({
        s3PublicUrl: 'https://assets.tramdungcamxuc.com',
      })
      expect(csp).toContain('https://assets.tramdungcamxuc.com')
      expect(csp).toContain('https://plausible.io')
    })
  })

  describe('applySecurityHeaders', () => {
    it('mutates Headers object directly for public routes', () => {
      const headers = new Headers()
      applySecurityHeaders(headers, '/thu-vien')
      expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(headers.has('Content-Security-Policy-Report-Only')).toBe(true)
    })

    it('applies enforced CSP header when isEnforce is true', () => {
      const headers = new Headers()
      applySecurityHeaders(headers, '/thu-vien', { isEnforce: true })
      expect(headers.has('Content-Security-Policy')).toBe(true)
      expect(headers.has('Content-Security-Policy-Report-Only')).toBe(false)
    })
  })

  describe('proxy integration', () => {
    it('applies security headers when proxy() is called', () => {
      const res = proxy()
      expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()')
      expect(res.headers.has('Content-Security-Policy-Report-Only')).toBe(true)
    })
  })

  describe('admin unauthorized with a customer session (T2-20d)', () => {
    const request = (path: string, cookie?: string) =>
      new NextRequest(`http://localhost:3000${path}`, {
        headers: cookie ? { cookie } : undefined,
      })

    it('drops the customer cookie and returns to /admin', () => {
      const res = proxy(request('/admin/unauthorized', 'tdcx_customer_token=abc; payload-token=x'))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toBe('http://localhost:3000/admin')
      const setCookie = res.headers.get('set-cookie') ?? ''
      expect(setCookie).toContain('tdcx_customer_token=;')
      expect(setCookie).toContain('Path=/')
      expect(setCookie).not.toContain('payload-token')
    })

    it('leaves /admin/unauthorized alone without a customer cookie (no redirect loop)', () => {
      const res = proxy(request('/admin/unauthorized', 'payload-token=x'))
      expect(res.headers.get('location')).toBeNull()
      expect(res.headers.get('set-cookie')).toBeNull()
    })

    it('keeps the customer cookie on other admin and site pages', () => {
      for (const path of ['/admin', '/admin/collections/orders', '/tai-khoan']) {
        const res = proxy(request(path, 'tdcx_customer_token=abc'))
        expect(res.headers.get('location')).toBeNull()
        expect(res.headers.get('set-cookie')).toBeNull()
      }
    })
  })
})
