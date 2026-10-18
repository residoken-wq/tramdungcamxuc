import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'
import { CUSTOMER_TOKEN_COOKIE } from '@/lib/auth/token'

const ADMIN_UNAUTHORIZED_PATH = '/admin/unauthorized'

// Read at request time so the same image can serve a demo or an indexable site.
export function proxy(request?: NextRequest) {
  const pathname = request?.nextUrl?.pathname ?? '/'

  // REVIEW-REQUIRED (T2-20d): a browser with only a customer session (tdcx_customer_token) and no
  // valid admin JWT is authenticated as a customer, so Payload sends /admin to /admin/unauthorized.
  // Payload's "Đăng xuất" there only clears the admin cookie, leaving the browser stuck. Drop the
  // customer cookie and go back to /admin, which then shows the admin login.
  if (
    request &&
    pathname.replace(/\/+$/, '') === ADMIN_UNAUTHORIZED_PATH &&
    request.cookies.has(CUSTOMER_TOKEN_COOKIE)
  ) {
    const redirect = NextResponse.redirect(new URL('/admin', request.url))
    redirect.cookies.delete({ name: CUSTOMER_TOKEN_COOKIE, path: '/' })
    applySecurityHeaders(redirect.headers, pathname)
    return redirect
  }

  const response = NextResponse.next()

  if (process.env.SITE_NOINDEX === 'true') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  // Prevent browser and reverse proxy caching on transactional order views
  if (pathname.startsWith('/thanh-toan/don/')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  applySecurityHeaders(response.headers, pathname)

  return response
}
