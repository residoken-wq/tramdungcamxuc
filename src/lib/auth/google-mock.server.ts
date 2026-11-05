import 'server-only'
import crypto from 'node:crypto'

export interface MockAuthData {
  nonce: string
  sub: string
  email: string
  name?: string
  unverified?: boolean
  error?: string
  codeChallenge?: string
}

let mockKeyPair: { publicKey: crypto.KeyObject; privateKey: crypto.KeyObject } | null = null
let mockPublicJwk: (crypto.JsonWebKey & { kid: string; alg: string; use: string }) | null = null

const mockStore = new Map<string, { data: MockAuthData; expiresAt: number }>()

function getMockKeys() {
  if (!mockKeyPair) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    })
    mockKeyPair = { publicKey, privateKey }

    const jwk = publicKey.export({ format: 'jwk' })
    mockPublicJwk = {
      ...jwk,
      kid: 'mock-google-key-id',
      alg: 'RS256',
      use: 'sig',
    }
  }
  return { ...mockKeyPair, publicJwk: mockPublicJwk! }
}

export function getMockPublicJwk() {
  const { publicJwk } = getMockKeys()
  return publicJwk
}

export function saveMockAuthSession(code: string, data: MockAuthData): void {
  // 5 minutes TTL
  mockStore.set(code, {
    data,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
}

export function getMockAuthSession(code: string): MockAuthData | null {
  const entry = mockStore.get(code)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    mockStore.delete(code)
    return null
  }
  return entry.data
}

export function createMockIdToken(params: {
  sub: string
  email: string
  name?: string
  nonce: string
  aud?: string
  email_verified?: boolean
  expiresInSeconds?: number
}): string {
  const { privateKey } = getMockKeys()
  const now = Math.floor(Date.now() / 1000)
  const exp = now + (params.expiresInSeconds ?? 3600)

  const header = {
    alg: 'RS256',
    kid: 'mock-google-key-id',
    typ: 'JWT',
  }

  const payload = {
    iss: 'https://accounts.google.com',
    aud: params.aud || process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
    sub: params.sub,
    email: params.email,
    email_verified: params.email_verified !== false,
    name: params.name || 'Học viên Google',
    nonce: params.nonce,
    iat: now,
    exp,
  }

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signingInput = `${headerB64}.${payloadB64}`

  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey)
  const signatureB64 = signature.toString('base64url')

  return `${signingInput}.${signatureB64}`
}
