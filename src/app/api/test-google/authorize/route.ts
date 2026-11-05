import crypto from 'node:crypto'
import { notFound } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import { saveMockAuthSession } from '@/lib/auth/google-mock.server'
import { e2eTestHooksEnabled } from '@/lib/auth/test-hooks'

export async function GET(request: NextRequest) {
  // Only accessible when test hooks are explicitly enabled in non-production environments
  if (!e2eTestHooksEnabled()) {
    notFound()
  }

  const searchParams = request.nextUrl.searchParams
  const redirectUri = searchParams.get('redirect_uri')
  const state = searchParams.get('state')
  const nonce = searchParams.get('nonce') || ''
  const codeChallenge = searchParams.get('code_challenge') || ''

  if (!redirectUri || !state) {
    return new NextResponse('Missing redirect_uri or state', { status: 400 })
  }

  const mockError = searchParams.get('mock_error')
  if (mockError) {
    const targetUrl = new URL(redirectUri)
    targetUrl.searchParams.set('error', mockError)
    targetUrl.searchParams.set('state', state)
    return NextResponse.redirect(targetUrl.toString(), 302)
  }

  const code = crypto.randomBytes(16).toString('hex')
  const sub = searchParams.get('mock_sub') || `mock-sub-${Date.now()}`
  const email = searchParams.get('mock_email') || `mock-student-${Date.now()}@example.com`
  const name = searchParams.get('mock_name') || 'Học viên Google Mẫu'
  const unverified = searchParams.get('mock_unverified') === '1'

  saveMockAuthSession(code, {
    nonce,
    sub,
    email,
    name,
    unverified,
    codeChallenge,
  })

  const targetUrl = new URL(redirectUri)
  targetUrl.searchParams.set('code', code)
  targetUrl.searchParams.set('state', state)

  return NextResponse.redirect(targetUrl.toString(), 302)
}
