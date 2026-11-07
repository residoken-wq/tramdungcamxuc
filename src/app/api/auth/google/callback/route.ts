import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  CUSTOMER_TOKEN_COOKIE,
  DEFAULT_CUSTOMER_SESSION_EXPIRATION,
  signCustomerToken,
  getAuthSecret,
} from '@/lib/auth/token'
import { getSafeRedirectUrl } from '@/lib/auth/redirect'
import { googleClientCredentials } from '@/lib/auth/methods'
import {
  GOOGLE_OAUTH_COOKIE_NAME,
  GOOGLE_OAUTH_COOKIE_PATH,
  verifyOAuthCookie,
  exchangeGoogleCodeForTokens,
  verifyGoogleIdToken,
  findOrCreateGoogleCustomer,
} from '@/lib/auth/google.server'
import { getSiteUrl } from '@/lib/site-url'

function redirectWithError(request: NextRequest, nextPath: string, errorCode: string) {
  const safeNext = getSafeRedirectUrl(nextPath)
  const loginUrl = new URL('/tai-khoan/dang-nhap', getSiteUrl())
  if (safeNext && safeNext !== '/tai-khoan') {
    loginUrl.searchParams.set('next', safeNext)
  }
  loginUrl.searchParams.set('loi', errorCode)

  const res = NextResponse.redirect(loginUrl.toString(), 302)
  res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE_NAME, path: GOOGLE_OAUTH_COOKIE_PATH })
  return res
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const googleError = searchParams.get('error')

  // 1. Read and verify state cookie
  const cookieValue = request.cookies.get(GOOGLE_OAUTH_COOKIE_NAME)?.value
  const oauthCookie = verifyOAuthCookie(cookieValue)

  if (!oauthCookie) {
    return redirectWithError(request, '/tai-khoan', 'that-bai')
  }

  const savedNext = oauthCookie.next || '/tai-khoan'

  // 2. Handle Google cancellation or errors
  if (googleError) {
    return redirectWithError(request, savedNext, 'huy')
  }

  // 3. Verify state via constant-time comparison
  if (!state || !code) {
    return redirectWithError(request, savedNext, 'that-bai')
  }

  const stateQueryBuf = Buffer.from(state, 'utf8')
  const stateCookieBuf = Buffer.from(oauthCookie.state, 'utf8')
  if (
    stateQueryBuf.length !== stateCookieBuf.length ||
    !crypto.timingSafeEqual(stateQueryBuf, stateCookieBuf)
  ) {
    return redirectWithError(request, savedNext, 'that-bai')
  }

  const { clientId, clientSecret } = googleClientCredentials()
  const siteUrl = getSiteUrl()
  const redirectUri = `${siteUrl}/api/auth/google/callback`

  try {
    // 4. Exchange code for tokens
    const tokens = await exchangeGoogleCodeForTokens({
      code,
      codeVerifier: oauthCookie.verifier,
      clientId,
      clientSecret,
      redirectUri,
    })

    // 5. REVIEW-REQUIRED: Verify ID token signature and claims
    const verifiedUser = await verifyGoogleIdToken(tokens.id_token, oauthCookie.nonce, clientId)

    const payload = await getPayload({ config })

    // 6. REVIEW-REQUIRED: Link or create customer
    const result = await findOrCreateGoogleCustomer({
      payload,
      googleSub: verifiedUser.sub,
      email: verifiedUser.email,
      name: verifiedUser.name,
      consentPolicy: oauthCookie.consent,
      consentMarketing: oauthCookie.marketing,
    })

    if (result.error) {
      return redirectWithError(request, savedNext, result.error)
    }

    // 7. REVIEW-REQUIRED: Create and sign session token
    const customer = result.customer
    const sessionToken = signCustomerToken(
      {
        id: customer.id,
        email: customer.email,
        sessionVersion: typeof customer.sessionVersion === 'number' ? customer.sessionVersion : 0,
      },
      getAuthSecret(),
    )

    // 8. Redirect to next destination and set session cookie
    const destinationUrl = new URL(savedNext, getSiteUrl())
    const response = NextResponse.redirect(destinationUrl.toString(), 302)

    response.cookies.set(CUSTOMER_TOKEN_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: DEFAULT_CUSTOMER_SESSION_EXPIRATION,
    })

    // Clean up temporary oauth cookie immediately
    response.cookies.delete({ name: GOOGLE_OAUTH_COOKIE_NAME, path: GOOGLE_OAUTH_COOKIE_PATH })

    return response
  } catch (err) {
    console.error('[AuthGoogle] Callback error:', err)
    return redirectWithError(request, savedNext, 'that-bai')
  }
}
