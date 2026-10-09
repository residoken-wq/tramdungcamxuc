import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'

// Read at request time so the same image can serve a demo or an indexable site.
export function proxy(request?: NextRequest) {
  const pathname = request?.nextUrl?.pathname ?? '/'
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
