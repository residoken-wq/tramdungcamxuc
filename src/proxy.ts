import { NextResponse } from 'next/server'

// Read at request time so the same image can serve a demo or an indexable site.
export function proxy() {
  const response = NextResponse.next()
  if (process.env.SITE_NOINDEX === 'true') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}
