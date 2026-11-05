import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getMockPublicJwk } from '@/lib/auth/google-mock.server'
import { e2eTestHooksEnabled } from '@/lib/auth/test-hooks'

export async function GET() {
  if (!e2eTestHooksEnabled()) {
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
