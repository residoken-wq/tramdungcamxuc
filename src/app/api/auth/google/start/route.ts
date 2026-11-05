import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { checkAndRecordRateLimit, RateLimitError } from '@/lib/forms/ratelimit.server'
import { getSafeRedirectUrl } from '@/lib/auth/redirect'
import {
  googleEndpoints,
  generateRandomToken,
  generateCodeChallenge,
  signOAuthCookie,
  GOOGLE_OAUTH_COOKIE_NAME,
  GOOGLE_OAUTH_COOKIE_MAX_AGE,
} from '@/lib/auth/google.server'

function getClientIp(req: NextRequest): string | undefined {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return req.headers.get('x-real-ip') || undefined
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rawNext = searchParams.get('next')
    const safeNext = getSafeRedirectUrl(rawNext)
    const consent = searchParams.get('consent') === '1' ? 1 : 0
    const marketing = searchParams.get('marketing') === '1' ? 1 : 0

    const ip = getClientIp(request)
    const payload = await getPayload({ config })

    // 1. Rate limiting by IP
    await checkAndRecordRateLimit(payload, {
      form: 'customer_google_start',
      ip,
      windowMinutes: 10,
      maxHits: 30,
    })

    // 2. Cryptographic state, nonce, and PKCE verifier
    const state = generateRandomToken(32)
    const nonce = generateRandomToken(32)
    const verifier = generateRandomToken(32)
    const codeChallenge = generateCodeChallenge(verifier)

    const now = Math.floor(Date.now() / 1000)
    const cookiePayload = {
      state,
      nonce,
      verifier,
      next: safeNext,
      consent: consent as 1 | 0,
      marketing: marketing as 1 | 0,
      exp: now + GOOGLE_OAUTH_COOKIE_MAX_AGE,
    }

    const cookieValue = signOAuthCookie(cookiePayload)

    // 3. Build Google authorization URL
    const endpoints = googleEndpoints()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectUri = `${siteUrl}/api/auth/google/callback`

    const authUrl = new URL(endpoints.authorize)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID || '')
    authUrl.searchParams.set('scope', 'openid email profile')
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('nonce', nonce)
    authUrl.searchParams.set('prompt', 'select_account')

    const response = NextResponse.redirect(authUrl.toString(), 302)
    response.cookies.set(GOOGLE_OAUTH_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/google',
      maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,
    })

    return response
  } catch (err) {
    if (err instanceof RateLimitError) {
      const loginUrl = new URL('/tai-khoan/dang-nhap', request.url)
      loginUrl.searchParams.set('loi', 'that-bai')
      return NextResponse.redirect(loginUrl.toString(), 302)
    }
    console.error('[AuthGoogle] Start error:', err)
    const loginUrl = new URL('/tai-khoan/dang-nhap', request.url)
    loginUrl.searchParams.set('loi', 'that-bai')
    return NextResponse.redirect(loginUrl.toString(), 302)
  }
}
