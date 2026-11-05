import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getMockPublicJwk } from '@/lib/auth/google-mock.server'

export async function GET() {
  if (process.env.E2E_TEST_HOOKS !== '1' || process.env.NODE_ENV === 'production') {
    notFound()
  }

  const jwk = getMockPublicJwk()

  return NextResponse.json(
    { keys: [jwk] },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    },
  )
}
