import { NextResponse } from 'next/server'
import { __testLatestOtpCodes } from '@/lib/auth/otp.server'

/**
 * Test-only endpoint for E2E tests to retrieve OTP code.
 * Exclusively active when NODE_ENV === 'test'. Returns 404 in all other environments.
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'test') {
    return new NextResponse('Not found', { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
  }

  const code = __testLatestOtpCodes.get(email) ?? null
  return NextResponse.json({ email, code })
}
