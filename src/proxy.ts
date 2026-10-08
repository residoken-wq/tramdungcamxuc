import { NextResponse, type NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security-headers'

// Read at request time so the same image can serve a demo or an indexable site.
export function proxy(request?: NextRequest) {
  const pathname = request?.nextUrl?.pathname ?? '/'
  const response = NextResponse.next()

  if (process.env.SITE_NOINDEX === 'true') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  applySecurityHeaders(response.headers, pathname)

  return response
}
