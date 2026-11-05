import { notFound } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import { getMockAuthSession, createMockIdToken } from '@/lib/auth/google-mock.server'
import { e2eTestHooksEnabled } from '@/lib/auth/test-hooks'

export async function POST(request: NextRequest) {
  if (!e2eTestHooksEnabled()) {
    notFound()
  }

  const formData = await request.formData()
  const code = formData.get('code') as string
  const clientId =
    (formData.get('client_id') as string) || process.env.GOOGLE_CLIENT_ID || 'mock-client'

  if (!code) {
    return NextResponse.json({ error: 'missing_code' }, { status: 400 })
  }

  const session = getMockAuthSession(code)
  if (!session) {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
  }

  const idToken = createMockIdToken({
    sub: session.sub,
    email: session.email,
    name: session.name,
    nonce: session.nonce,
    aud: clientId,
    email_verified: !session.unverified,
  })

  return NextResponse.json({
    id_token: idToken,
    access_token: 'mock-access-token-12345',
    token_type: 'Bearer',
    expires_in: 3600,
  })
}
