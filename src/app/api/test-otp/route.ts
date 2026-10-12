import { NextResponse } from 'next/server'
import { __testLatestOtpCodes } from '@/lib/auth/otp.server'
import { e2eTestHooksEnabled } from '@/lib/auth/test-hooks'

/**
 * Test-only endpoint for E2E tests to retrieve OTP code.
 * Active ONLY when E2E_TEST_HOOKS=1 (CI e2e job). Returns 404 otherwise. See test-hooks.ts.
 */
export async function GET(request: Request) {
  if (!e2eTestHooksEnabled()) {
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
