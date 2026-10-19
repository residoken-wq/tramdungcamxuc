import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { e2eTestHooksEnabled } from '@/lib/auth/test-hooks'

// Only admin accounts created by the e2e suite use this domain.
const E2E_ADMIN_EMAIL_DOMAIN = '@example.test'

/**
 * REVIEW-REQUIRED: Test-only endpoint. Deletes admin users created by e2e tests
 * (email ending in @example.test) so a test that died mid-way does not leave its
 * first admin behind and break every later "create first user" test.
 * Active ONLY when E2E_TEST_HOOKS=1 (CI e2e job, see test-hooks.ts). Returns 404 otherwise.
 */
export async function POST() {
  if (!e2eTestHooksEnabled()) {
    return new NextResponse('Not found', { status: 404 })
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { like: E2E_ADMIN_EMAIL_DOMAIN } },
    depth: 0,
    limit: 100,
    overrideAccess: true,
  })

  let deleted = 0
  for (const user of docs) {
    if (!user.email?.toLowerCase().endsWith(E2E_ADMIN_EMAIL_DOMAIN)) continue
    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
    deleted++
  }

  return NextResponse.json({ deleted })
}
