/**
 * Security headers configuration and application for public routes.
 *
 * Exempt paths:
 * - `/admin` (Payload CMS admin)
 * - `/builder` (Puck visual editor and canvas)
 * - `/api` (Payload and custom API endpoints)
 */

export const EXEMPT_PATH_PREFIXES = ['/admin', '/builder', '/api'] as const

export function isSecurityHeadersExempt(pathname: string): boolean {
  const normalized = pathname.trim() || '/'
  return EXEMPT_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

/**
 * Checks if a route can be embedded in Puck's editor preview iframe.
 * Public site pages ((site) shell routes, home, landing, library, etc.)
 * are embedded by Puck in /admin/builder/[pageId].
 */
export function isPuckEmbeddable(pathname: string): boolean {
  if (isSecurityHeadersExempt(pathname)) {
    return false
  }
  const normalized = pathname.trim() || '/'
  // /tai-khoan and styleguide are not Puck-editable site pages
  if (normalized === '/tai-khoan' || normalized.startsWith('/tai-khoan/')) {
    return false
  }
  return true
}

export interface CspOptions {
  s3PublicUrl?: string
  s3Endpoint?: string
  isDev?: boolean
}

/**
 * Builds Content-Security-Policy (Report-Only) header directives.
 */
export function buildCspDirective(options: CspOptions = {}): string {
  const s3Urls: string[] = []

  const candidateUrls = [
    options.s3PublicUrl ?? process.env.S3_PUBLIC_URL,
    options.s3Endpoint ?? process.env.S3_ENDPOINT,
  ].filter(Boolean) as string[]

  for (const urlStr of candidateUrls) {
    try {
      const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`)
      s3Urls.push(parsed.origin)
    } catch {
      // Ignore malformed URL
    }
  }

  const s3OriginStr = s3Urls.length > 0 ? ` ${Array.from(new Set(s3Urls)).join(' ')}` : ''

  // Next.js hydration and Turnstile require 'unsafe-inline' for scripts.
  // In development, 'unsafe-eval' is also needed for React Fast Refresh/HMR.
  const scriptSources = [
    "'self'",
    'https://challenges.cloudflare.com',
    'https://plausible.io',
    "'unsafe-inline'",
    ...((options.isDev ?? process.env.NODE_ENV !== 'production') ? ["'unsafe-eval'"] : []),
  ].join(' ')

  const directives: string[] = [
    "default-src 'self'",
    `img-src 'self' data: blob:${s3OriginStr}`,
    `media-src 'self' data: blob:${s3OriginStr}`,
    "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com https://iframe.mediadelivery.net",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "connect-src 'self' https://challenges.cloudflare.com https://plausible.io",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  return directives.join('; ')
}

export interface SecurityHeaderOptions {
  isProduction?: boolean
  isEnforce?: boolean
  s3PublicUrl?: string
  s3Endpoint?: string
}

/**
 * Returns security headers map for a given pathname.
 * Returns empty object for exempt routes (/admin, /builder, /api).
 */
export function getSecurityHeaders(
  pathname: string,
  options: SecurityHeaderOptions = {},
): Record<string, string> {
  if (isSecurityHeadersExempt(pathname)) {
    return {}
  }

  const isProd = options.isProduction ?? process.env.NODE_ENV === 'production'
  const isEnforce = options.isEnforce ?? process.env.CSP_ENFORCE === 'true'
  const cspHeaderName = isEnforce
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only'

  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    [cspHeaderName]: buildCspDirective({
      s3PublicUrl: options.s3PublicUrl,
      s3Endpoint: options.s3Endpoint,
      isDev: !isProd,
    }),
  }

  if (isProd) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
  }

  if (!isPuckEmbeddable(pathname)) {
    headers['X-Frame-Options'] = 'DENY'
  }

  return headers
}

/**
 * Applies security headers directly to a Headers object.
 */
export function applySecurityHeaders(
  headers: Headers,
  pathname: string,
  options: SecurityHeaderOptions = {},
): void {
  const securityHeaders = getSecurityHeaders(pathname, options)
  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value)
  }
}
