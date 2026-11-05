import 'server-only'
import crypto from 'node:crypto'
import type { Payload } from 'payload'
import type { Customer } from '@/payload-types'
import { getAuthSecret } from './token'

export const GOOGLE_OAUTH_COOKIE_NAME = 'tdcx_google_oauth_state'
export const GOOGLE_OAUTH_COOKIE_MAX_AGE = 600 // 10 minutes in seconds

export interface GoogleOAuthStatePayload {
  state: string
  nonce: string
  verifier: string
  next: string
  consent: 1 | 0
  marketing: 1 | 0
  exp: number
}

export interface GoogleEndpoints {
  authorize: string
  token: string
  jwks: string
}

/**
 * Resolves Google OAuth endpoints.
 * In development / E2E test mode with E2E_TEST_HOOKS=1, routes to local mock endpoints.
 */
export function googleEndpoints(): GoogleEndpoints {
  if (process.env.E2E_TEST_HOOKS === '1' && process.env.NODE_ENV !== 'production') {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    return {
      authorize: `${base}/api/test-google/authorize`,
      token: `${base}/api/test-google/token`,
      jwks: `${base}/api/test-google/jwks`,
    }
  }
  return {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    jwks: 'https://www.googleapis.com/oauth2/v3/certs',
  }
}

/**
 * Generates cryptographically secure random url-safe base64 string.
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url')
}

/**
 * Computes S256 code_challenge from code_verifier.
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

/**
 * Signs an OAuth state payload using HMAC-SHA256 and getAuthSecret().
 */
export function signOAuthCookie(
  payload: GoogleOAuthStatePayload,
  secret: string = getAuthSecret(),
): string {
  const json = JSON.stringify(payload)
  const dataB64 = Buffer.from(json).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(dataB64).digest('base64url')
  return `${dataB64}.${signature}`
}

/**
 * Verifies an OAuth state cookie using constant-time comparison.
 * Returns payload if signature matches and not expired, null otherwise.
 */
export function verifyOAuthCookie(
  cookieValue: string | null | undefined,
  secret: string = getAuthSecret(),
): GoogleOAuthStatePayload | null {
  if (!cookieValue || typeof cookieValue !== 'string') return null
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null

  const [dataB64, signatureB64] = parts
  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(dataB64).digest('base64url')
    const sigBuf = Buffer.from(signatureB64, 'base64url')
    const expBuf = Buffer.from(expectedSig, 'base64url')

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null
    }

    const json = Buffer.from(dataB64, 'base64url').toString('utf8')
    const payload = JSON.parse(json) as GoogleOAuthStatePayload

    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp !== 'number' || payload.exp < now) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

let cachedJwks: {
  keys: Array<{ kid?: string; [key: string]: unknown }>
  expiresAt: number
} | null = null

/**
 * Clears in-memory JWKS cache (useful for testing).
 */
export function clearJwksCache(): void {
  cachedJwks = null
}

/**
 * Fetches Google JWKS keys with in-memory caching according to Cache-Control header.
 */
export async function getGoogleJwks(
  jwksUrl: string = googleEndpoints().jwks,
): Promise<Array<{ kid?: string; [key: string]: unknown }>> {
  const now = Date.now()
  if (cachedJwks && cachedJwks.expiresAt > now) {
    return cachedJwks.keys
  }

  const res = await fetch(jwksUrl, {
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch Google JWKS: ${res.statusText}`)
  }

  let ttlMs = 3600 * 1000
  const cc = res.headers.get('cache-control')
  if (cc) {
    const match = cc.match(/max-age=(\d+)/i)
    if (match) {
      ttlMs = Math.max(60, parseInt(match[1], 10)) * 1000
    }
  }

  const data = (await res.json()) as { keys: Array<{ kid?: string; [key: string]: unknown }> }
  if (!data || !Array.isArray(data.keys)) {
    throw new Error('Invalid JWKS response from Google')
  }

  cachedJwks = {
    keys: data.keys,
    expiresAt: now + ttlMs,
  }
  return data.keys
}

export interface VerifiedGoogleUser {
  sub: string
  email: string
  name?: string
}

/**
 * REVIEW-REQUIRED: Verifies a Google ID token (JWT) using RS256 signature with Google's public key from JWKS.
 * Strictly verifies iss, aud, exp (with 60s max leeway), nonce, and email_verified === true.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  expectedNonce: string,
  clientId: string,
  jwksUrl: string = googleEndpoints().jwks,
): Promise<VerifiedGoogleUser> {
  const parts = idToken.split('.')
  if (parts.length !== 3) {
    throw new Error('Malformed ID token: must have 3 parts')
  }

  const [headerB64, payloadB64, signatureB64] = parts

  let header: { alg?: string; kid?: string }
  let payload: {
    iss?: string
    aud?: string
    sub?: string
    email?: string
    email_verified?: boolean
    name?: string
    nonce?: string
    exp?: number
    iat?: number
  }

  try {
    header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'))
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
  } catch {
    throw new Error('Malformed ID token: invalid JSON in header or payload')
  }

  if (header.alg !== 'RS256') {
    throw new Error(`Unsupported algorithm in ID token: ${header.alg}`)
  }

  // 1. Validate claims before signature
  const validIssuers = ['https://accounts.google.com', 'accounts.google.com']
  if (!payload.iss || !validIssuers.includes(payload.iss)) {
    throw new Error(`Invalid issuer in ID token: ${payload.iss}`)
  }

  if (!payload.aud || payload.aud !== clientId) {
    throw new Error(`Audience mismatch in ID token: expected ${clientId}, got ${payload.aud}`)
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  // Max 60 seconds leeway
  if (typeof payload.exp !== 'number' || nowSeconds > payload.exp + 60) {
    throw new Error('ID token has expired')
  }
  if (typeof payload.iat === 'number' && nowSeconds < payload.iat - 60) {
    throw new Error('ID token issued in the future')
  }

  if (payload.nonce !== expectedNonce) {
    throw new Error(`Nonce mismatch in ID token: expected ${expectedNonce}, got ${payload.nonce}`)
  }

  // Strictly require email_verified === true
  if (payload.email_verified !== true) {
    throw new Error('Email is not verified by Google')
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Missing sub claim in ID token')
  }

  if (!payload.email || typeof payload.email !== 'string') {
    throw new Error('Missing email claim in ID token')
  }

  // 2. Fetch JWKS and verify signature
  const keys = await getGoogleJwks(jwksUrl)
  const jwk = header.kid ? keys.find((k) => k.kid === header.kid) : keys[0]
  if (!jwk) {
    throw new Error(`No matching key found in JWKS for kid: ${header.kid}`)
  }

  const publicKey = crypto.createPublicKey({ key: jwk as crypto.JsonWebKey, format: 'jwk' })
  const signingInput = `${headerB64}.${payloadB64}`
  const signatureBuf = Buffer.from(signatureB64, 'base64url')

  const isSigValid = crypto.verify('RSA-SHA256', Buffer.from(signingInput), publicKey, signatureBuf)

  if (!isSigValid) {
    throw new Error('Invalid signature on Google ID token')
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: typeof payload.name === 'string' ? payload.name.trim().slice(0, 100) : undefined,
  }
}

/**
 * Exchanges authorization code for tokens with Google's token endpoint using PKCE.
 */
export async function exchangeGoogleCodeForTokens(params: {
  code: string
  codeVerifier: string
  clientId: string
  clientSecret: string
  redirectUri: string
  tokenEndpoint?: string
}): Promise<{ id_token: string; access_token?: string }> {
  const endpoint = params.tokenEndpoint || googleEndpoints().token
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: params.codeVerifier,
  })

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    throw new Error(`Google token exchange failed (${res.status}): ${errorText.slice(0, 200)}`)
  }

  const data = (await res.json()) as { id_token?: string; access_token?: string }
  if (!data.id_token || typeof data.id_token !== 'string') {
    throw new Error('Google token response missing id_token')
  }

  return {
    id_token: data.id_token,
    access_token: data.access_token,
  }
}

export type FindOrCreateGoogleResult =
  | { customer: Customer; error?: undefined }
  | { customer?: undefined; error: 'can-dong-y' | 'lien-ket-khac' }

/**
 * REVIEW-REQUIRED: Links or creates a customer from verified Google identity.
 * Rules:
 * 1. Search by googleSub. If found:
 *    - If Google email differs from customer.email, DO NOT overwrite email. Log customer.id (never log email).
 *    - Return customer.
 * 2. If not found by googleSub, search by lowercase email:
 *    - If customer exists:
 *      - If already linked to a DIFFERENT googleSub -> return error 'lien-ket-khac'.
 *      - If googleSub is empty -> link googleSub, fill name if empty, update consentAt if consentPolicy=1.
 * 3. If customer does not exist:
 *    - If consentPolicy !== 1 -> DO NOT create, return error 'can-dong-y'.
 *    - Create new customer with email, name (slice 100), googleSub, consentAt, consentMarketing.
 * 4. Never stores Google avatar picture, access token, or refresh token (Nghị định 13/2023).
 */
export async function findOrCreateGoogleCustomer(params: {
  payload: Payload
  googleSub: string
  email: string
  name?: string
  consentPolicy?: 1 | 0
  consentMarketing?: 1 | 0
}): Promise<FindOrCreateGoogleResult> {
  const { payload, googleSub, consentPolicy, consentMarketing } = params
  const normalizedEmail = params.email.trim().toLowerCase()
  const cleanName = params.name ? params.name.trim().slice(0, 100) : ''
  const nowIso = new Date().toISOString()

  // 1. Search by googleSub
  const bySub = await payload.find({
    collection: 'customers',
    where: {
      googleSub: { equals: googleSub },
    },
    limit: 1,
    overrideAccess: true,
  })

  if (bySub.docs.length > 0) {
    const existing = bySub.docs[0] as Customer
    // If Google email differs from stored customer email, do not mutate email, just log ID
    if (existing.email && existing.email.trim().toLowerCase() !== normalizedEmail) {
      console.warn(`[AuthGoogle] Customer ID ${existing.id} logged in with different Google email`)
    }
    return { customer: existing }
  }

  // 2. Search by lowercase email
  const byEmail = await payload.find({
    collection: 'customers',
    where: {
      email: { equals: normalizedEmail },
    },
    limit: 1,
    overrideAccess: true,
  })

  if (byEmail.docs.length > 0) {
    const existing = byEmail.docs[0] as Customer
    // Check if customer already has a different googleSub
    if (existing.googleSub && existing.googleSub !== googleSub) {
      return { error: 'lien-ket-khac' }
    }

    // Link googleSub to existing customer
    const updateData: Record<string, unknown> = {
      googleSub,
    }

    // Only fill name if currently empty
    if ((!existing.name || existing.name.trim().length === 0) && cleanName) {
      updateData.name = cleanName
    }

    // Update consentAt if missing and user consented
    if (!existing.consentAt && consentPolicy === 1) {
      updateData.consentAt = nowIso
    }

    if (consentMarketing === 1 && !existing.consentMarketing) {
      updateData.consentMarketing = true
    }

    const updated = await payload.update({
      collection: 'customers',
      id: existing.id,
      data: updateData,
      overrideAccess: true,
    })

    return { customer: updated as Customer }
  }

  // 3. New customer: require consentPolicy === 1
  if (consentPolicy !== 1) {
    return { error: 'can-dong-y' }
  }

  const newCustomer = await payload.create({
    collection: 'customers',
    data: {
      email: normalizedEmail,
      name: cleanName || undefined,
      googleSub,
      consentAt: nowIso,
      consentMarketing: consentMarketing === 1,
    },
    overrideAccess: true,
  })

  return { customer: newCustomer as Customer }
}
